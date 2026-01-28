import prisma from '../config/database'
import { AppError } from '../middleware/errorHandler'

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

export async function getUserActivity(userId: string, limit: number = 20) {
  const [recentLikes, recentFollows] = await Promise.all([
    prisma.like.findMany({
      where: { userId },
      take: Math.floor(limit / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    }),
    prisma.follow.findMany({
      where: { followerId: userId },
      take: Math.floor(limit / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ])

  const activities = [
    ...recentLikes.map(like => ({
      type: 'like' as const,
      createdAt: like.createdAt,
      post: like.post,
    })),
    ...recentFollows.map(follow => ({
      type: 'follow' as const,
      createdAt: follow.createdAt,
      user: follow.following,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return activities.slice(0, limit)
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
    ...save.post,
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
