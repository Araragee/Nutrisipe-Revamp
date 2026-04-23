import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import * as variationService from '../services/variationService'

export async function forkRecipeHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { postId } = req.params
    const { title, description, variationDescription, ...recipeData } = req.body

    const result = await variationService.forkRecipe(req.userId, postId, {
      title,
      description,
      variationDescription,
      recipeData
    })

    res.status(201).json({
      success: true,
      message: 'Recipe variation created successfully',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export async function getVariationsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await variationService.getVariations(postId, page, limit)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export async function getOriginalRecipeHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId } = req.params

    const result = await variationService.getOriginalRecipe(postId)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export async function getVariationChainHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId } = req.params

    const result = await variationService.getVariationChain(postId)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteVariationHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Unauthorized')
    }

    const { variationId } = req.params

    await variationService.deleteVariation(variationId, req.userId)

    res.json({
      success: true,
      message: 'Variation relationship deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}
