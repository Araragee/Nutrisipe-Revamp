import { Request, Response, NextFunction } from 'express'
import { env } from '../config/env'
import { logger } from '../utils/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (env.NODE_ENV === 'development') {
    logger.error('Error:', err)
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
    return
  }

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  })
}
