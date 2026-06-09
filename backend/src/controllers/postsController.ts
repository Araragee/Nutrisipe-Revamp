import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as postService from '../services/postService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().min(1),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
  recipe: z.object({
    servings: z.number().optional(),
    prepTime: z.number().optional(),
    cookTime: z.number().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    ingredients: z.array(z.object({
      name: z.string().min(1),
      quantity: z.string().min(1),
      unit: z.string().optional(),
    })).min(1),
    instructions: z.array(z.object({
      step: z.number(),
      text: z.string().min(1),
    })).min(1),
    nutrition: z.object({
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
      fiber: z.number().optional(),
    }).optional(),
  }).optional(),
})

const updatePostSchema = createPostSchema.partial()

export async function getFeedHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    // TODO(audit:B-08) [MEDIUM] Pagination params unclamped here and across all controllers — limit=999999 or page=-1 allowed; add shared parsePagination() with Math.max(1, page) / Math.min(limit, 100).
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await postService.getFeed(req.userId, page, limit)

    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    return next(error)
  }
}

export async function getPostByIdHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const post = await postService.getPostById(id, req.userId)

    res.json({
      success: true,
      data: post,
    })
  } catch (error) {
    return next(error)
  }
}

export async function getPostsByUserHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await postService.getPostsByUser(userId, req.userId, page, limit)

    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    return next(error)
  }
}

export async function createPostHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const validated = createPostSchema.parse(req.body)
    const post = await postService.createPost(req.userId, validated)

    res.status(201).json({
      success: true,
      data: post,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, error.errors[0].message))
    } else {
      next(error)
    }
  }
}

export async function updatePostHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { id } = req.params
    const validated = updatePostSchema.parse(req.body)
    const post = await postService.updatePost(id, req.userId, validated)

    res.json({
      success: true,
      data: post,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, error.errors[0].message))
    } else {
      next(error)
    }
  }
}

export async function deletePostHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { id } = req.params
    await postService.deletePost(id, req.userId)

    res.json({
      success: true,
      message: 'Post deleted successfully',
    })
  } catch (error) {
    return next(error)
  }
}

export async function getFollowingFeedHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await postService.getFollowingFeed(req.userId, page, limit)

    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    return next(error)
  }
}

export async function getRelatedPostsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const result = await postService.getRelatedPosts(id, req.userId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    return next(error)
  }
}

export async function searchPostsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string
    const category = req.query.category as string | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    if (!query && !category) {
      return res.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    }

    const result = await postService.searchPosts(query || '', req.userId, category, page, limit)
    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    return next(error)
  }
}

export async function getAllIngredientsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const ingredients = await postService.getAllIngredients()
    res.json({
      success: true,
      data: ingredients,
    })
  } catch (error) {
    return next(error)
  }
}

export async function getPostsByTagHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { tag } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await postService.getPostsByTag(tag, req.userId, page, limit)
    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    return next(error)
  }
}

export async function getRecommendationsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await postService.getRecommendations(req.userId, page, limit)
    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    return next(error)
  }
}


