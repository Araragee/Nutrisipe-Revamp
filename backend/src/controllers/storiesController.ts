import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import * as storyService from '../services/storyService'

const createSchema = z.object({
  imageUrl: z.string().min(1),
  caption: z.string().max(280).optional(),
  postId: z.string().optional(),
})

export async function feedHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const data = await storyService.getFeed(req.userId)
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function createHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const validated = createSchema.parse(req.body)
    const story = await storyService.createStory({
      userId: req.userId,
      imageUrl: validated.imageUrl,
      caption: validated.caption,
      postId: validated.postId,
    })
    res.status(201).json({ success: true, data: story })
  } catch (error) {
    if (error instanceof z.ZodError) next(new AppError(400, error.errors[0].message))
    else next(error)
  }
}

export async function deleteHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    await storyService.deleteStory(req.userId, req.params.id)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function viewHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const storyId = req.params.id
    // Guard: verify story exists before incrementing view count
    const story = await storyService.getStoryById(storyId)
    if (!story) throw new AppError(404, 'Story not found')
    await storyService.recordView(storyId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
