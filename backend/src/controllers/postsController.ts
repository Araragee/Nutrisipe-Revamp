import { Response, NextFunction } from 'express'
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
})

const updatePostSchema = createPostSchema.partial()

export async function getFeedHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await postService.getFeed(req.userId, page, limit)

    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
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
    next(error)
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
    next(error)
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
    next(error)
  }
}

export async function searchPostsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string
    const category = req.query.category as string | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    if (!query) {
      throw new AppError(400, 'Search query is required')
    }

    const result = await postService.searchPosts(req.userId, query, category, page, limit)

    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}
