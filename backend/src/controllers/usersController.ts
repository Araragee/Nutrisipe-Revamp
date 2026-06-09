import { Request, Response, NextFunction } from 'express'
import * as userService from '../services/userService'
import * as recommendationService from '../services/recommendationService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

export async function getUserByIdHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    await userService.assertPrivacyAllowed(id, req.userId, 'publicProfile')
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

export async function deleteMeHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const result = await userService.scheduleAccountDeletion(req.userId)
    res.json({
      success: true,
      message: `Account scheduled for deletion on ${result.scheduledAt.toISOString()}`,
      data: {
        scheduledAt: result.scheduledAt,
        gracePeriodDays: userService.ACCOUNT_DELETION_GRACE_DAYS,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function cancelDeleteMeHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    await userService.cancelAccountDeletion(req.userId)
    res.json({ success: true, message: 'Account deletion cancelled' })
  } catch (error) {
    next(error)
  }
}

export async function getPopularHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 50)
    const users = await userService.getPopularUsers(limit, req.userId)
    res.json({
      success: true,
      data: users,
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

    // TODO(audit:B-06) [MEDIUM] req.body passed to updateUserProfile with no Zod schema — whitelist allowed fields (displayName, bio, avatarUrl) so callers can't inject arbitrary columns.
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
      res.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
      return
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

export async function getSavedPostsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    // Self always allowed; others gated by privacy flag.
    if (id !== req.userId) {
      await userService.assertPrivacyAllowed(id, req.userId, 'showSaved')
    }

    const result = await userService.getSavedPosts(id, page, limit)

    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}

export async function getLikedPostsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    if (id !== req.userId) {
      await userService.assertPrivacyAllowed(id, req.userId, 'showLiked')
    }

    const result = await userService.getLikedPosts(id, page, limit)

    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}

export async function getUserPreferencesHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const preferences = await userService.getUserPreferences(req.userId)

    res.json({
      success: true,
      data: preferences,
    })
  } catch (error) {
    next(error)
  }
}

export async function updatePreferencesHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const preferences = await userService.updateUserPreferences(req.userId, req.body)

    res.json({
      success: true,
      data: preferences,
    })
  } catch (error) {
    next(error)
  }
}
