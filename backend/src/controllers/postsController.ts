import { Request, Response, NextFunction } from 'express'
import * as postService from '../services/postService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

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

    const post = await postService.createPost(req.userId, req.body)

    res.status(201).json({
      success: true,
      data: post,
    })
  } catch (error) {
    next(error)
  }
}

export async function updatePostHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { id } = req.params
    const post = await postService.updatePost(id, req.userId, req.body)

    res.json({
      success: true,
      data: post,
    })
  } catch (error) {
    next(error)
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
