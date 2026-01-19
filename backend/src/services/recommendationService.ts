import prisma from '../config/database'

export async function getSuggestedUsers(userId: string, limit: number = 15) {
  const currentUserFollowing = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })

  const followingIds = currentUserFollowing.map(f => f.followingId)

  const userLikedPosts = await prisma.like.findMany({
    where: { userId },
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        select: {
          category: true,
          userId: true,
        },
      },
    },
  })

  const likedCategories = userLikedPosts.map(like => like.post.category)
  const categoryCount: Record<string, number> = {}
  likedCategories.forEach(cat => {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  })

  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat)

  const usersWithSimilarInterests = await prisma.user.findMany({
    where: {
      id: { notIn: [userId, ...followingIds] },
      posts: {
        some: {
          category: { in: topCategories },
        },
      },
    },
    take: limit,
    orderBy: { followerCount: 'desc' },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      followerCount: true,
      followingCount: true,
    },
  })

  if (usersWithSimilarInterests.length >= limit) {
    return usersWithSimilarInterests.slice(0, limit)
  }

  const followOfFollowing = await prisma.follow.findMany({
    where: {
      followerId: { in: followingIds },
      followingId: { notIn: [userId, ...followingIds, ...usersWithSimilarInterests.map(u => u.id)] },
    },
    select: { followingId: true },
    distinct: ['followingId'],
  })

  const followOfFollowingIds = followOfFollowing.map(f => f.followingId).slice(0, limit - usersWithSimilarInterests.length)

  const additionalUsers = await prisma.user.findMany({
    where: {
      id: { in: followOfFollowingIds },
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
  })

  const combined = [...usersWithSimilarInterests, ...additionalUsers]

  if (combined.length >= limit) {
    return combined.slice(0, limit)
  }

  const popularUsers = await prisma.user.findMany({
    where: {
      id: { notIn: [userId, ...followingIds, ...combined.map(u => u.id)] },
    },
    take: limit - combined.length,
    orderBy: { followerCount: 'desc' },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      followerCount: true,
      followingCount: true,
    },
  })

  return [...combined, ...popularUsers].slice(0, limit)
}
