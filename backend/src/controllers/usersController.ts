import { Request, Response, NextFunction } from 'express'
import * as userService from '../services/userService'
import * as recommendationService from '../services/recommendationService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export async function getUserByIdHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const user = await userService.getUserById(id, req.userId)

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export async function getUserFollowersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await userService.getUserFollowers(id, page, limit)

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}

export async function getUserFollowingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await userService.getUserFollowing(id, page, limit)

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}

export async function getUserActivityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 20

    const activities = await userService.getUserActivity(id, limit)

    res.json({
      success: true,
      data: activities,
    })
  } catch (error) {
    next(error)
  }
}

export async function getSuggestionsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const limit = parseInt(req.query.limit as string) || 15

    const suggestions = await recommendationService.getSuggestedUsers(req.userId, limit)

    res.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateProfileHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const user = await userService.updateUserProfile(req.userId, req.body)

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export async function searchUsersHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    if (!query || query.trim().length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    const result = await userService.searchUsers(query.trim(), req.userId, page, limit)

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}
