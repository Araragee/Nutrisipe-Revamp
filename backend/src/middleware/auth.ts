import { Request, Response, NextFunction } from 'express'
import { verifyToken, isTokenCurrent } from '../utils/jwt'
import { AppError } from './errorHandler'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  userId?: string
  user?: any
  file?: any
  files?: any
}

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.auth_token
      ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : undefined)

    if (!token) {
      throw new AppError(401, 'Unauthorized - No token provided')
    }

    let payload;
    try {
      payload = verifyToken(token)
    } catch (error) {
      throw new AppError(401, 'Unauthorized - Invalid token')
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isBanned: true,
        tokenVersion: true,
      },
    })

    if (!user) {
      throw new AppError(401, 'User not found')
    }

    if (!isTokenCurrent(payload, user.tokenVersion)) {
      throw new AppError(401, 'Unauthorized - Session expired')
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


export async function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.auth_token
      ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : undefined)

    if (!token) {
      return next()
    }
    const payload = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, username: true, role: true, isBanned: true, tokenVersion: true },
    })

    if (user && !user.isBanned && isTokenCurrent(payload, user.tokenVersion)) {
      req.user = user
      req.userId = payload.userId
    }
    
    next()
  } catch (error) {
    next()
  }
}
