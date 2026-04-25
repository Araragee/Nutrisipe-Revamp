import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as authService from '../services/authService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(100),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = registerSchema.parse(req.body)
    const result = await authService.register(
      validated.username,
      validated.email,
      validated.password,
      validated.displayName
    )

    res.status(201).json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError(400, error.errors[0].message))
    } else {
      next(error)
    }
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('Login attempt for email:', req.body.email)
    const validated = loginSchema.parse(req.body)
    const result = await authService.login(validated.email, validated.password)

    console.log('Login successful for user ID:', result.user.id)
    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Login Error:', error)
    if (error instanceof z.ZodError) {
      next(new AppError(400, error.errors[0].message))
    } else {
      next(error)
    }
  }
}

export async function meHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    console.log('Fetching current user for ID:', req.userId)
    if (!req.userId) {
      console.warn('meHandler called without req.userId')
      throw new AppError(401, 'Unauthorized')
    }

    const user = await authService.getCurrentUser(req.userId)
    console.log('Current user found:', user.username)

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('meHandler Error:', error)
    next(error)
  }
}
