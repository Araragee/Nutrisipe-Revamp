import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied. Admin role required.' })
    return
  }

  next()
}

export const moderatorOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
    res.status(403).json({ error: 'Access denied. Moderator or Admin role required.' })
    return
  }

  next()
}
