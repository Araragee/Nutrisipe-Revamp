import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  userId?: string
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized - No token provided')
    }

    const token = authHeader.substring(7)

    try {
      const payload = verifyToken(token)
      req.userId = payload.userId
      next()
    } catch (error) {
      throw new AppError(401, 'Unauthorized - Invalid token')
    }
  } catch (error) {
    next(error)
  }
}
