import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { transformPost } from '../utils/modelTransformer'

export interface PrivacyFlags {
  publicProfile: boolean
  showSaved: boolean
  showLiked: boolean
}

const DEFAULT_PRIVACY: PrivacyFlags = {
  publicProfile: true,
  showSaved: false,
  showLiked: true,
}

export async function getUserPrivacy(userId: string): Promise<PrivacyFlags> {
  const pref = await prisma.userPreference.findUnique({ where: { userId } })
  if (!pref) return DEFAULT_PRIVACY
  try {
    const raw = JSON.parse(pref.privacy || '{}')
    return { ...DEFAULT_PRIVACY, ...raw }
  } catch {
    return DEFAULT_PRIVACY
  }
}

export async function assertPrivacyAllowed(
  targetUserId: string,
  viewerId: string | undefined,
  key: keyof PrivacyFlags,
) {
  if (viewerId && viewerId === targetUserId) return
  const privacy = await getUserPrivacy(targetUserId)
  if (!privacy[key]) {
    throw new AppError(403, 'This information is private')
  }
}

interface UpdateProfileData {
  displayName?: string
  bio?: string
  avatarUrl?: string
}

export async function searchUsers(
  query: string,
  currentUserId?: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        followerCount: true,
        followingCount: true,
      },
      orderBy: [{ followerCount: 'desc' }, { username: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
    }),
  ])

  // Add isFollowing field if currentUserId is provided
  if (currentUserId) {
    const followingIds = await prisma.follow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: users.map((u) => u.id) },
      },
      select: { followingId: true },
    })

    const followingSet = new Set(followingIds.map((f) => f.followingId))

    return {
      users: users.map((user) => ({
        ...user,
        isFollowing: followingSet.has(user.id),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getUserById(userId: string, currentUserId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      followerCount: true,
      followingCount: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  if (currentUserId && currentUserId !== userId) {
    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    })

    return {
      ...user,
      isFollowing: !!isFollowing,
    }
  }

  return user
}

export async function getUserFollowers(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    take: limit,
    skip,
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          followerCount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const total = await prisma.follow.count({
    where: { followingId: userId },
  })

  return {
    users: followers.map(f => f.follower),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getUserFollowing(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    take: limit,
    skip,
    include: {
      following: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          followerCount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const total = await prisma.follow.count({
    where: { followerId: userId },
  })

  return {
    users: following.map(f => f.following),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}


export async function updateUserProfile(userId: string, data: UpdateProfileData) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: data.displayName,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
    },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      followerCount: true,
      followingCount: true,
      createdAt: true,
    },
  })

  return user
}

export const ACCOUNT_DELETION_GRACE_DAYS = 7

export async function scheduleAccountDeletion(userId: string) {
  const scheduledAt = new Date(Date.now() + ACCOUNT_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000)
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletionScheduledAt: scheduledAt,
      isActive: false,
    },
  })
  return { scheduledAt }
}

export async function cancelAccountDeletion(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletionScheduledAt: null,
      isActive: true,
    },
  })
  return { success: true }
}

export async function purgeScheduledDeletions(now: Date = new Date()) {
  const users = await prisma.user.findMany({
    where: { deletionScheduledAt: { lte: now } },
    select: { id: true },
  })
  for (const user of users) {
    await prisma.user.delete({ where: { id: user.id } })
  }
  return { purged: users.length }
}

// Legacy alias kept for callers expecting hard cascade (admin-only paths).
export async function deleteUserCascade(userId: string) {
  return prisma.user.delete({ where: { id: userId } })
}

export async function getPopularUsers(limit: number = 12, excludeUserId?: string) {
  const where: any = { isActive: true, isBanned: false }
  if (excludeUserId) where.id = { not: excludeUserId }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ followerCount: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      followerCount: true,
      _count: { select: { posts: true } },
    },
  })

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    followerCount: u.followerCount,
    postCount: u._count.posts,
  }))
}

export async function getSuggestedUsers(userId: string, limit: number = 10) {
  const followedUsers = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  const followedUserIds = followedUsers.map(f => f.followingId)

  const suggestedUsers = await prisma.user.findMany({
    where: {
      id: { not: userId, notIn: followedUserIds },
    },
    take: limit * 3,
    orderBy: { followerCount: 'desc' },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      followerCount: true,
    },
  })

  return suggestedUsers.slice(0, limit)
}

export async function getSavedPosts(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit

  const [saves, total] = await Promise.all([
    prisma.save.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                saves: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.save.count({ where: { userId } }),
  ])

  const posts = saves.map(save => ({
    ...transformPost(save.post),
    isLiked: false,
    isSaved: true,
    savedAt: save.createdAt,
  }))

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getLikedPosts(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const [likes, total] = await Promise.all([
    prisma.like.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.like.count({ where: { userId } }),
  ])

  const posts = likes.map(like => ({
    ...transformPost(like.post),
    isLiked: true,
    isSaved: false, // We could also check if it's saved by the user
    likedAt: like.createdAt,
  }))

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw)
    return v ?? fallback
  } catch {
    return fallback
  }
}

export async function getUserPreferences(userId: string) {
  let preferences = await prisma.userPreference.findUnique({
    where: { userId },
  })

  if (!preferences) {
    preferences = await prisma.userPreference.create({
      data: { userId },
    })
  }

  return {
    cuisines: safeParse<string[]>(preferences.cuisines, []),
    allergies: safeParse<string[]>(preferences.allergies, []),
    dietary: safeParse<string[]>(preferences.dietary, []),
    notifications: safeParse<Record<string, boolean>>(preferences.notifications, {}),
    privacy: safeParse<Record<string, boolean>>(preferences.privacy, {}),
  }
}

export async function updateUserPreferences(
  userId: string,
  data: {
    cuisines?: string[]
    allergies?: string[]
    dietary?: string[]
    notifications?: Record<string, boolean>
    privacy?: Record<string, boolean>
  }
) {
  const updateData: any = {}
  if (data.cuisines) updateData.cuisines = JSON.stringify(data.cuisines)
  if (data.allergies) updateData.allergies = JSON.stringify(data.allergies)
  if (data.dietary) updateData.dietary = JSON.stringify(data.dietary)
  if (data.notifications) updateData.notifications = JSON.stringify(data.notifications)
  if (data.privacy) updateData.privacy = JSON.stringify(data.privacy)

  const preferences = await prisma.userPreference.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      ...updateData,
    },
  })

  return {
    cuisines: safeParse<string[]>(preferences.cuisines, []),
    allergies: safeParse<string[]>(preferences.allergies, []),
    dietary: safeParse<string[]>(preferences.dietary, []),
    notifications: safeParse<Record<string, boolean>>(preferences.notifications, {}),
    privacy: safeParse<Record<string, boolean>>(preferences.privacy, {}),
  }
}

export async function getUserActivity(userId: string, limit: number = 20) {
  const [comments, likes, follows, ratings] = await Promise.all([
    prisma.comment.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { post: { select: { title: true } } }
    }),
    prisma.like.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { post: { select: { title: true } } }
    }),
    prisma.follow.findMany({
      where: { followerId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { following: { select: { username: true, displayName: true } } }
    }),
    prisma.rating.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { post: { select: { title: true } } }
    }),
  ])

  const activities = [
    ...comments.map(c => ({ id: c.id, type: 'comment', date: c.createdAt, data: { content: c.content, postTitle: c.post.title, postId: c.postId } })),
    ...likes.map(l => ({ id: l.id, type: 'like', date: l.createdAt, data: { postTitle: l.post.title, postId: l.postId } })),
    ...follows.map(f => ({ id: f.id, type: 'follow', date: f.createdAt, data: { username: f.following.username, displayName: f.following.displayName, userId: f.followingId } })),
    ...ratings.map(r => ({ id: r.id, type: 'rating', date: r.createdAt, data: { score: r.rating, postTitle: r.post.title, postId: r.postId } })),
  ]

  return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
}

