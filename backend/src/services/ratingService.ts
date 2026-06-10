import prisma from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { transformPost } from '../utils/modelTransformer'
import { createNotification } from './notificationService'

interface CreateRatingData {
  postId: string
  rating: number
  review?: string
}

export async function createOrUpdateRating(
  userId: string,
  data: CreateRatingData
) {
  const { postId, rating, review } = data

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new AppError(400, 'Rating must be between 1 and 5')
  }

  // Verify post exists
  const post = await prisma.post.findUnique({
    where: { id: postId }
  })

  if (!post) {
    throw new AppError(404, 'Post not found')
  }

  // Cannot rate your own post
  if (post.userId === userId) {
    throw new AppError(400, 'Cannot rate your own post')
  }

  // Check if rating already exists
  const existingRating = await prisma.rating.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  })

  let ratingResult
  let isNew = false

  if (existingRating) {
    // Update existing rating
    ratingResult = await prisma.rating.update({
      where: { id: existingRating.id },
      data: {
        rating,
        review
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    })
  } else {
    // Create new rating
    isNew = true
    ratingResult = await prisma.rating.create({
      data: {
        userId,
        postId,
        rating,
        review
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    })

    // Create notification for post owner (only for new ratings)
    await createNotification({
      userId: post.userId,
      actorId: userId,
      type: 'rating',
      postId
    })
  }

  // Recalculate average rating for the post
  await updatePostAverageRating(postId)

  return {
    rating: ratingResult,
    isNew
  }
}

export async function getPostRatings(
  postId: string,
  page: number = 1,
  limit: number = 20,
  sortBy: string = 'newest'
) {
  const skip = (page - 1) * limit

  // Determine sort order
  let orderBy: any = { createdAt: 'desc' }

  switch (sortBy) {
    case 'oldest':
      orderBy = { createdAt: 'asc' }
      break
    case 'highest':
      orderBy = { rating: 'desc' }
      break
    case 'lowest':
      orderBy = { rating: 'asc' }
      break
    default:
      orderBy = { createdAt: 'desc' }
  }

  const [ratings, total, post, grouped] = await Promise.all([
    prisma.rating.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.rating.count({
      where: { postId }
    }),
    prisma.post.findUnique({
      where: { id: postId },
      select: {
        averageRating: true,
        ratingCount: true
      }
    }),
    prisma.rating.groupBy({
      by: ['rating'],
      where: { postId },
      _count: { rating: true }
    })
  ])

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const row of grouped) {
    const star = row.rating as 1 | 2 | 3 | 4 | 5
    if (star >= 1 && star <= 5) distribution[star] = row._count.rating
  }

  return {
    ratings,
    averageRating: post?.averageRating || 0,
    totalRatings: post?.ratingCount || 0,
    distribution,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export async function getUserRatings(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const [ratings, total] = await Promise.all([
    prisma.rating.findMany({
      where: { userId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            category: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.rating.count({
      where: { userId }
    })
  ])

  return {
    ratings: ratings.map(r => ({
      ...r,
      post: transformPost(r.post)
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export async function getUserRatingForPost(userId: string, postId: string) {
  const rating = await prisma.rating.findUnique({
    where: {
      userId_postId: { userId, postId }
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    }
  })

  return rating
}

export async function deleteRating(ratingId: string, userId: string) {
  const rating = await prisma.rating.findUnique({
    where: { id: ratingId }
  })

  if (!rating) {
    throw new AppError(404, 'Rating not found')
  }

  if (rating.userId !== userId) {
    throw new AppError(403, 'You can only delete your own ratings')
  }

  await prisma.rating.delete({
    where: { id: ratingId }
  })

  // Recalculate average rating for the post
  await updatePostAverageRating(rating.postId)

  return { success: true }
}

// Helper function to recalculate post average rating
async function updatePostAverageRating(postId: string) {
  const ratings = await prisma.rating.findMany({
    where: { postId },
    select: { rating: true }
  })

  const totalRatings = ratings.length
  const averageRating = totalRatings > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
    : 0

  await prisma.post.update({
    where: { id: postId },
    data: {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount: totalRatings
    }
  })
}
