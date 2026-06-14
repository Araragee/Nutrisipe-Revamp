import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { AppError } from './errorHandler'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  userId?: string
  user?: any
  file?: any
  files?: any
}

export async function auth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized - No token provided')
    }

    const token = authHeader.substring(7)

    let payload;
    try {
      payload = verifyToken(token)
    } catch (error) {
      throw new AppError(401, 'Unauthorized - Invalid token')
    }

    // Fetch user with role information
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isBanned: true,
      },
    })

    if (!user) {
      throw new AppError(401, 'User not found')
    }

    if (user.isBanned) {
      throw new AppError(403, 'Your account has been banned')
    }

    req.user = user
    req.userId = payload.userId
    next()
  } catch (error) {
    next(error)
  }
}

export const authenticate = auth

export async function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, username: true, role: true, isBanned: true },
    })

    if (user && !user.isBanned) {
      req.user = user
      req.userId = payload.userId
    }
    
    next()
  } catch (error) {
    // Just continue without user
    next()
  }
}
