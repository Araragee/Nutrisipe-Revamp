import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as userService from '../services/userService'
import * as recommendationService from '../services/recommendationService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { parsePagination } from '../utils/pagination'

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
    const { page, limit } = parsePagination(req)

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
    const { page, limit } = parsePagination(req)

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
    const { limit } = parsePagination(req)

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
    const { limit } = parsePagination(req, 12, 50)
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

    const { limit } = parsePagination(req, 15)

    const suggestions = await recommendationService.getSuggestedUsers(req.userId, limit)

    res.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    next(error)
  }
}

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

export async function updateProfileHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const validated = updateProfileSchema.parse(req.body)
    const user = await userService.updateUserProfile(req.userId, validated)

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
    const { page, limit } = parsePagination(req)

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
    const { page, limit } = parsePagination(req)

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
    const { page, limit } = parsePagination(req)

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

const updatePreferencesSchema = z.object({
  cuisines: z.array(z.string().max(50)).max(50).optional(),
  allergies: z.array(z.string().max(50)).max(50).optional(),
  dietary: z.array(z.string().max(50)).max(50).optional(),
  notifications: z.record(z.boolean()).optional(),
  privacy: z.record(z.boolean()).optional(),
})

export async function updatePreferencesHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const validated = updatePreferencesSchema.parse(req.body)
    const preferences = await userService.updateUserPreferences(req.userId, validated)

    res.json({
      success: true,
      data: preferences,
    })
  } catch (error) {
    next(error)
  }
}
