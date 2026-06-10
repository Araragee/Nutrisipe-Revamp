import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import * as mealPlanService from '../services/mealPlanService'

const slotEnum = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])

const createSchema = z.object({
  postId: z.string().min(1),
  date: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  slot: slotEnum,
  servings: z.number().int().min(1).max(50).optional(),
  notes: z.string().max(500).optional(),
})

const updateSchema = z.object({
  date: z.string().optional(),
  slot: slotEnum.optional(),
  servings: z.number().int().min(1).max(50).optional(),
  notes: z.string().max(500).nullable().optional(),
})

function parseRange(req: AuthRequest): { from: Date; to: Date } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const defaultFrom = new Date(today)
  defaultFrom.setDate(today.getDate() - 7)
  const defaultTo = new Date(today)
  defaultTo.setDate(today.getDate() + 21)

  const fromStr = req.query.from as string | undefined
  const toStr = req.query.to as string | undefined
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : defaultTo
  return { from, to }
}

export async function listHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const { from, to } = parseRange(req)
    const plans = await mealPlanService.listPlans(req.userId, from, to)
    res.json({ success: true, data: plans, range: { from, to } })
  } catch (error) {
    next(error)
  }
}

export async function createHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const validated = createSchema.parse(req.body)
    const plan = await mealPlanService.createPlan(req.userId, {
      postId: validated.postId,
      date: new Date(validated.date),
      slot: validated.slot,
      servings: validated.servings,
      notes: validated.notes,
    })
    res.status(201).json({ success: true, data: plan })
  } catch (error) {
    if (error instanceof z.ZodError) next(new AppError(400, error.errors[0].message))
    else next(error)
  }
}

export async function updateHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const validated = updateSchema.parse(req.body)
    const data: any = {}
    if (validated.date) data.date = new Date(validated.date)
    if (validated.slot) data.slot = validated.slot
    if (validated.servings != null) data.servings = validated.servings
    if (validated.notes !== undefined) data.notes = validated.notes
    const plan = await mealPlanService.updatePlan(req.userId, req.params.id, data)
    res.json({ success: true, data: plan })
  } catch (error) {
    if (error instanceof z.ZodError) next(new AppError(400, error.errors[0].message))
    else next(error)
  }
}

export async function deleteHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    await mealPlanService.deletePlan(req.userId, req.params.id)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function groceryHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const { from, to } = parseRange(req)
    const list = await mealPlanService.getGroceryList(req.userId, from, to)
    res.json({ success: true, data: list })
  } catch (error) {
    next(error)
  }
}
