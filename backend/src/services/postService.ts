import prisma from '../config/database'
import { AppError } from '../middleware/errorHandler'

interface CreatePostData {
  title: string
  description?: string
  imageUrl: string
  category: string
  tags: string[]
  isPublic?: boolean
}

export async function getFeed(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const followedUsers = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })

  const followedUserIds = followedUsers.map(f => f.followingId)

  const followedPostsCount = Math.ceil(limit * 0.7)
  const popularPostsCount = limit - followedPostsCount

  let followedPosts: any[] = []
  if (followedUserIds.length > 0) {
    followedPosts = await prisma.post.findMany({
      where: {
        userId: { in: followedUserIds },
        isPublic: true,
      },
      take: followedPostsCount,
      skip: Math.floor(skip * 0.7),
      orderBy: { createdAt: 'desc' },
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
    })
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const popularPosts = await prisma.post.findMany({
    where: {
      isPublic: true,
      createdAt: { gte: sevenDaysAgo },
      NOT: {
        id: { in: followedPosts.map(p => p.id) },
      },
    },
    take: popularPostsCount,
    skip: Math.floor(skip * 0.3),
    orderBy: [
      { likeCount: 'desc' },
      { saveCount: 'desc' },
    ],
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
  })

  const allPosts = [...followedPosts, ...popularPosts]

  const postIds = allPosts.map(p => p.id)

  const [likes, saves] = await Promise.all([
    prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
    prisma.save.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
  ])

  const likedPostIds = new Set(likes.map(l => l.postId))
  const savedPostIds = new Set(saves.map(s => s.postId))

  const postsWithEngagement = allPosts.map(post => ({
    ...post,
    isLiked: likedPostIds.has(post.id),
    isSaved: savedPostIds.has(post.id),
  }))

  const total = await prisma.post.count({
    where: { isPublic: true },
  })

  return {
    posts: postsWithEngagement,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getPostById(postId: string, userId?: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          followerCount: true,
          followingCount: true,
        },
      },
    },
  })

  if (!post) {
    throw new AppError(404, 'Post not found')
  }

  if (!post.isPublic) {
    throw new AppError(403, 'Post is not public')
  }

  if (userId) {
    const [isLiked, isSaved] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_postId: { userId, postId: post.id },
        },
      }),
      prisma.save.findUnique({
        where: {
          userId_postId: { userId, postId: post.id },
        },
      }),
    ])

    return {
      ...post,
      isLiked: !!isLiked,
      isSaved: !!isSaved,
    }
  }

  return post
}

export async function getPostsByUser(targetUserId: string, currentUserId: string | undefined, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const posts = await prisma.post.findMany({
    where: {
      userId: targetUserId,
      isPublic: true,
    },
    take: limit,
    skip,
    orderBy: { createdAt: 'desc' },
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
  })

  let postsWithEngagement = posts

  if (currentUserId) {
    const postIds = posts.map(p => p.id)

    const [likes, saves] = await Promise.all([
      prisma.like.findMany({
        where: {
          userId: currentUserId,
          postId: { in: postIds },
        },
      }),
      prisma.save.findMany({
        where: {
          userId: currentUserId,
          postId: { in: postIds },
        },
      }),
    ])

    const likedPostIds = new Set(likes.map(l => l.postId))
    const savedPostIds = new Set(saves.map(s => s.postId))

    postsWithEngagement = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id),
    }))
  }

  const total = await prisma.post.count({
    where: {
      userId: targetUserId,
      isPublic: true,
    },
  })

  return {
    posts: postsWithEngagement,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function createPost(userId: string, data: CreatePostData) {
  const post = await prisma.post.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      category: data.category,
      tags: data.tags,
      isPublic: data.isPublic ?? true,
    },
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
  })

  return post
}

export async function updatePost(postId: string, userId: string, data: Partial<CreatePostData>) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    throw new AppError(404, 'Post not found')
  }

  if (post.userId !== userId) {
    throw new AppError(403, 'Not authorized to update this post')
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      ...data,
    },
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
  })

  return updatedPost
}

export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    throw new AppError(404, 'Post not found')
  }

  if (post.userId !== userId) {
    throw new AppError(403, 'Not authorized to delete this post')
  }

  await prisma.post.delete({
    where: { id: postId },
  })

  return { success: true }
}

export async function searchPosts(
  userId: string | undefined,
  query: string,
  category?: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const where: any = {
    isPublic: true,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { has: query.toLowerCase() } },
    ],
  }

  if (category) {
    where.category = category
  }

  const posts = await prisma.post.findMany({
    where,
    take: limit,
    skip,
    orderBy: { createdAt: 'desc' },
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
  })

  let postsWithEngagement = posts

  if (userId) {
    postsWithEngagement = await Promise.all(
      posts.map(async (post) => {
        const [isLiked, isSaved] = await Promise.all([
          prisma.like.findUnique({
            where: {
              userId_postId: { userId, postId: post.id },
            },
          }),
          prisma.save.findUnique({
            where: {
              userId_postId: { userId, postId: post.id },
            },
          }),
        ])

        return {
          ...post,
          isLiked: !!isLiked,
          isSaved: !!isSaved,
        }
      })
    )
  }

  const total = await prisma.post.count({ where })

  return {
    posts: postsWithEngagement,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
