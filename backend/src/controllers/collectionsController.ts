import { Response, NextFunction } from 'express'
import { z } from 'zod'
import * as collectionService from '../services/collectionService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
})

export async function createCollectionHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const validated = createCollectionSchema.parse(req.body)
    const collection = await collectionService.createCollection(req.userId, validated)
    res.status(201).json({ success: true, data: collection })
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, error.errors[0].message))
    } else {
      next(error)
    }
  }
}

export async function getUserCollectionsHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params
    const collections = await collectionService.getCollections(userId, req.userId)
    res.json({ success: true, data: collections })
  } catch (error) {
    next(error)
  }
}

export async function getCollectionByIdHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const collection = await collectionService.getCollectionById(id, req.userId)
    res.json({ success: true, data: collection })
  } catch (error) {
    next(error)
  }
}

export async function addPostToCollectionHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const { id, postId } = req.params
    const result = await collectionService.addPostToCollection(id, postId, req.userId)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export async function removePostFromCollectionHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const { id, postId } = req.params
    const result = await collectionService.removePostFromCollection(id, postId, req.userId)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export async function deleteCollectionHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const { id } = req.params
    const result = await collectionService.deleteCollection(id, req.userId)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}
