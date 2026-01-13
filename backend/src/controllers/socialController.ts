import { Response, NextFunction } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { createNotification } from '../services/notificationService'

export async function followUserHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { userId: targetUserId } = req.params

    if (req.userId === targetUserId) {
      throw new AppError(400, 'Cannot follow yourself')
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      throw new AppError(404, 'User not found')
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.userId,
          followingId: targetUserId,
        },
      },
    })

    if (existingFollow) {
      throw new AppError(400, 'Already following this user')
    }

    await prisma.$transaction([
      prisma.follow.create({
        data: {
          followerId: req.userId,
          followingId: targetUserId,
        },
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: { followerCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: { followingCount: { increment: 1 } },
      }),
    ])

    // Create notification for followed user
    await createNotification({
      userId: targetUserId,
      actorId: req.userId,
      type: 'follow',
    })

    res.json({
      success: true,
      message: 'User followed successfully',
    })
  } catch (error) {
    next(error)
  }
}

export async function unfollowUserHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { userId: targetUserId } = req.params

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.userId,
          followingId: targetUserId,
        },
      },
    })

    if (!existingFollow) {
      throw new AppError(400, 'Not following this user')
    }

    await prisma.$transaction([
      prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: req.userId,
            followingId: targetUserId,
          },
        },
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: { followerCount: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: { followingCount: { decrement: 1 } },
      }),
    ])

    res.json({
      success: true,
      message: 'User unfollowed successfully',
    })
  } catch (error) {
    next(error)
  }
}

export async function likePostHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { postId } = req.params

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw new AppError(404, 'Post not found')
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: req.userId,
          postId,
        },
      },
    })

    if (existingLike) {
      throw new AppError(400, 'Already liked this post')
    }

    await prisma.$transaction([
      prisma.like.create({
        data: {
          userId: req.userId,
          postId,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ])

    // Create notification for post owner
    await createNotification({
      userId: post.userId,
      actorId: req.userId,
      type: 'like',
      postId: postId,
    })

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { likeCount: true },
    })

    res.json({
      success: true,
      message: 'Post liked successfully',
      data: { likeCount: updatedPost?.likeCount },
    })
  } catch (error) {
    next(error)
  }
}

export async function unlikePostHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { postId } = req.params

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: req.userId,
          postId,
        },
      },
    })

    if (!existingLike) {
      throw new AppError(400, 'Not liked this post')
    }

    await prisma.$transaction([
      prisma.like.delete({
        where: {
          userId_postId: {
            userId: req.userId,
            postId,
          },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      }),
    ])

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { likeCount: true },
    })

    res.json({
      success: true,
      message: 'Post unliked successfully',
      data: { likeCount: updatedPost?.likeCount },
    })
  } catch (error) {
    next(error)
  }
}

export async function savePostHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { postId } = req.params

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw new AppError(404, 'Post not found')
    }

    const existingSave = await prisma.save.findUnique({
      where: {
        userId_postId: {
          userId: req.userId,
          postId,
        },
      },
    })

    if (existingSave) {
      throw new AppError(400, 'Already saved this post')
    }

    await prisma.$transaction([
      prisma.save.create({
        data: {
          userId: req.userId,
          postId,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { saveCount: { increment: 1 } },
      }),
    ])

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { saveCount: true },
    })

    res.json({
      success: true,
      message: 'Post saved successfully',
      data: { saveCount: updatedPost?.saveCount },
    })
  } catch (error) {
    next(error)
  }
}

export async function unsavePostHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { postId } = req.params

    const existingSave = await prisma.save.findUnique({
      where: {
        userId_postId: {
          userId: req.userId,
          postId,
        },
      },
    })

    if (!existingSave) {
      throw new AppError(400, 'Not saved this post')
    }

    await prisma.$transaction([
      prisma.save.delete({
        where: {
          userId_postId: {
            userId: req.userId,
            postId,
          },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { saveCount: { decrement: 1 } },
      }),
    ])

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { saveCount: true },
    })

    res.json({
      success: true,
      message: 'Post unsaved successfully',
      data: { saveCount: updatedPost?.saveCount },
    })
  } catch (error) {
    next(error)
  }
}
