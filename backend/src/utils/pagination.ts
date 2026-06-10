import { Request } from 'express'

export function parsePagination(
  req: Request,
  defaultLimit = 20,
  maxLimit = 100,
): { page: number; limit: number } {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string) || defaultLimit))
  return { page, limit }
}
