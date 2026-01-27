import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as commentService from '../services/commentService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(1000),
})

const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

export async function createCommentHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const validated = createCommentSchema.parse(req.body)
    const comment = await commentService.createComment(req.userId, validated)

    res.status(201).json({
      success: true,
      data: comment,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, error.errors[0].message))
    } else {
      next(error)
    }
  }
}

export async function getCommentsByPostHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await commentService.getCommentsByPost(postId, page, limit)

    res.json({
      success: true,
      data: result.comments,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteCommentHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { commentId } = req.params
    await commentService.deleteComment(commentId, req.userId)

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export async function updateCommentHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { commentId } = req.params
    const validated = updateCommentSchema.parse(req.body)

    const comment = await commentService.updateComment(
      commentId,
      req.userId,
      validated.content
    )

    res.json({
      success: true,
      data: comment,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, error.errors[0].message))
    } else {
      next(error)
    }
  }
}
