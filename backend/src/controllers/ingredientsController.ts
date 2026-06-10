import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as ingredientService from '../services/ingredientService'
import { AppError } from '../middleware/errorHandler'

const ingredientSchema = z.object({
  food_item: z.string().min(1).max(255),
  alt_name: z.string().max(255).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  edible_portion: z.number().min(0).max(100).optional(),
  energy: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  carb: z.number().min(0).optional(),
  calcium: z.number().min(0).optional(),
  phos: z.number().min(0).optional(),
  iron: z.number().min(0).optional(),
  vit_a: z.number().min(0).optional(),
  thia: z.number().min(0).optional(),
  ribo: z.number().min(0).optional(),
  nia: z.number().min(0).optional(),
  vit_c: z.number().min(0).optional(),
  source: z.string().max(255).nullable().optional(),
})

const updateSchema = ingredientSchema.partial()

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ingredientService.listIngredients({
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      all: req.query.all === '1' || req.query.all === 'true',
    })
    res.json({
      success: true,
      data: result.ingredients,
      pagination: result.pagination,
    })
  } catch (error) {
    next(error)
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const ingredient = await ingredientService.getIngredientById(req.params.id)
    if (!ingredient) throw new AppError(404, 'Ingredient not found')
    res.json({ success: true, data: ingredient })
  } catch (error) {
    next(error)
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = ingredientSchema.parse(req.body)
    const ingredient = await ingredientService.createIngredient(validated)
    res.status(201).json({ success: true, data: ingredient })
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, error.errors[0].message))
    } else {
      next(error)
    }
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = updateSchema.parse(req.body)
    const ingredient = await ingredientService.updateIngredient(req.params.id, validated)
    res.json({ success: true, data: ingredient })
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, error.errors[0].message))
    } else {
      next(error)
    }
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await ingredientService.deleteIngredient(req.params.id)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
