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
    console.log('Auth Token Extracted:', token.substring(0, 10) + '...')

    let payload;
    try {
      payload = verifyToken(token)
      console.log('JWT Payload Decoded:', payload)
    } catch (error) {
      console.error('JWT Verification Error:', error)
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
      },
    })

    if (!user) {
      console.warn('User not found in DB for ID:', payload.userId)
      throw new AppError(401, 'User not found')
    }

    console.log('Auth Success for User:', user.username)
    req.user = user
    req.userId = payload.userId
    next()
  } catch (error) {
    console.error('Auth Middleware Error:', error)
    next(error)
  }
}

// Alias for backwards compatibility
export const authenticate = auth
