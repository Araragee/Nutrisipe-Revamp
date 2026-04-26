import prisma from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { createNotification } from './notificationService'
import { processMentions } from '../routes/mentions'
import { emitPostCommented } from '../socket'

interface CreateCommentData {
  postId: string
  content: string
  parentId?: string
}

export async function createComment(userId: string, data: CreateCommentData) {
  const { postId, content, parentId } = data

  // Verify post exists
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    throw new AppError(404, 'Post not found')
  }

  // Verify parent comment exists if provided
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
    })
    if (!parent) {
      throw new AppError(404, 'Parent comment not found')
    }
  }

  // Create comment and increment post comment count
  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        userId,
        postId,
        content,
        parentId,
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
    }),
    prisma.post.update({
      where: { id: postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    }),
  ])

  // Create notification for post owner
  if (post.userId !== userId) {
    await createNotification({
      userId: post.userId,
      actorId: userId,
      type: 'comment',
      postId: postId,
      commentId: comment.id,
    })
  }

  // Create notification for parent comment owner if it's a reply
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
    })
    if (parentComment && parentComment.userId !== userId && parentComment.userId !== post.userId) {
      await createNotification({
        userId: parentComment.userId,
        actorId: userId,
        type: 'comment', // Could be 'reply' if we had that type
        postId: postId,
        commentId: comment.id,
      })
    }
  }

  // Process @mentions in the comment
  await processMentions(content, userId, 'COMMENT', postId, comment.id)

  // Emit real-time update
  const updatedPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { commentCount: true }
  })
  emitPostCommented(postId, comment.id, userId, updatedPost?.commentCount || 0)

  return comment
}

export async function getCommentsByPost(
  postId: string,
  page: number = 1,
  limit: number = 20,
  parentId: string | null = null
) {
  const skip = (page - 1) * limit

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { 
        postId,
        parentId: parentId || null
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
        _count: {
          select: { replies: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.comment.count({
      where: { 
        postId,
        parentId: parentId || null
      },
    }),
  ])

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment) {
    throw new AppError(404, 'Comment not found')
  }

  if (comment.userId !== userId) {
    throw new AppError(403, 'You can only delete your own comments')
  }

  // Delete comment and decrement post comment count
  await prisma.$transaction([
    prisma.comment.delete({
      where: { id: commentId },
    }),
    prisma.post.update({
      where: { id: comment.postId },
      data: {
        commentCount: {
          decrement: 1,
        },
      },
    }),
  ])

  return { success: true }
}

export async function updateComment(
  commentId: string,
  userId: string,
  content: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment) {
    throw new AppError(404, 'Comment not found')
  }

  if (comment.userId !== userId) {
    throw new AppError(403, 'You can only edit your own comments')
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
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

  // Delete old mentions for this comment
  await prisma.mention.deleteMany({
    where: { commentId }
  })

  // Process new @mentions in the updated comment
  await processMentions(content, userId, 'COMMENT', comment.postId, commentId)

  return updatedComment
}
