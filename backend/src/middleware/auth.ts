import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { AppError } from './errorHandler'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  userId?: string
}

export async function auth(
  req: Request,
  _res: Response,
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

      // Fetch user with role information
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
        },
      })

      if (!user) {
        throw new AppError(401, 'User not found')
      }

      req.user = user
      req.userId = payload.userId
      next()
    } catch (error) {
      throw new AppError(401, 'Unauthorized - Invalid token')
    }
  } catch (error) {
    next(error)
  }
}

// Alias for backwards compatibility
export const authenticate = auth
