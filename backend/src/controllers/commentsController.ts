import { Response, NextFunction } from 'express'
import * as commentService from '../services/commentService'
import { AuthRequest } from '../middleware/authenticate'
import { AppError } from '../middleware/errorHandler'

export async function createCommentHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const comment = await commentService.createComment(req.userId, req.body)

    res.status(201).json({
      success: true,
      data: comment,
    })
  } catch (error) {
    next(error)
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
    const { content } = req.body

    if (!content || content.trim().length === 0) {
      throw new AppError(400, 'Content is required')
    }

    const comment = await commentService.updateComment(
      commentId,
      req.userId,
      content
    )

    res.json({
      success: true,
      data: comment,
    })
  } catch (error) {
    next(error)
  }
}
