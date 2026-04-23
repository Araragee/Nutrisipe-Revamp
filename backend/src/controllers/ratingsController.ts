import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import * as ratingService from '../services/ratingService'

export async function createOrUpdateRatingHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { postId, rating, review } = req.body

    if (!postId) {
      throw new AppError(400, 'Post ID is required')
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError(400, 'Rating must be between 1 and 5')
    }

    const result = await ratingService.createOrUpdateRating(req.userId, {
      postId,
      rating,
      review
    })

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      message: result.isNew ? 'Rating created successfully' : 'Rating updated successfully',
      data: result.rating
    })
  } catch (error) {
    next(error)
  }
}

export async function getPostRatingsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const sortBy = (req.query.sortBy as string) || 'newest' // newest, oldest, highest, lowest

    const result = await ratingService.getPostRatings(postId, page, limit, sortBy)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export async function getUserRatingsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await ratingService.getUserRatings(userId, page, limit)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export async function checkUserRatingHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { postId } = req.params

    const rating = await ratingService.getUserRatingForPost(req.userId, postId)

    res.json({
      success: true,
      data: rating
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteRatingHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { ratingId } = req.params

    await ratingService.deleteRating(ratingId, req.userId)

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}
