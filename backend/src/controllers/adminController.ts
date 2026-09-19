import { logger } from '../utils/logger'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { parsePagination } from '../utils/pagination'
import type { Request,Response } from 'express'

export async function getStatsHandler(req: Request, res: Response) {
  try {
    const period = (req.query.period as string) || 'today'
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    let periodStart: Date | null
    switch (period) {
      case '7days':
        periodStart = new Date(now)
        periodStart.setDate(now.getDate() - 7)
        break
      case '30days':
        periodStart = new Date(now)
        periodStart.setDate(now.getDate() - 30)
        break
      case 'all':
        periodStart = null
        break
      case 'today':
      default:
        periodStart = startOfToday
    }

    const periodFilter = periodStart ? { createdAt: { gte: periodStart } } : {}

    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalPosts,
      totalComments,
      pendingReports,
      newUsersToday,
      newPostsToday,
      newUsersInPeriod,
      newPostsInPeriod,
      newCommentsInPeriod,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true, isBanned: false } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.post.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: periodFilter }),
      prisma.post.count({ where: periodFilter }),
      prisma.comment.count({ where: periodFilter }),
    ])

    const stats = {
      period,
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        newToday: newUsersToday,
        newInPeriod: newUsersInPeriod,
      },
      content: {
        posts: totalPosts,
        comments: totalComments,
        newPostsToday: newPostsToday,
        newPostsInPeriod: newPostsInPeriod,
        newCommentsInPeriod: newCommentsInPeriod,
      },
      moderation: {
        pendingReports: pendingReports,
      },
    }

    res.json({ data: stats })
  } catch (error) {
    logger.error('Error fetching admin stats:', error)
    res.status(500).json({ error: 'Failed to fetch admin statistics' })
  }
}

export async function listUsersHandler(req: AuthRequest, res: Response) {
  try {
    const { page, limit } = parsePagination(req)
    const search = req.query.search as string
    const role = req.query.role as string
    const status = req.query.status as string

    const where: any = {}

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role) {
      where.role = role
    }

    if (status === 'active') {
      where.isActive = true
      where.isBanned = false
    } else if (status === 'banned') {
      where.isBanned = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          isBanned: true,
          bannedAt: true,
          banReason: true,
          followerCount: true,
          followingCount: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

export async function updateUserRoleHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' })
      return
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
      },
    })

    res.json({ data: user })
  } catch (error) {
    logger.error('Error updating user role:', error)
    res.status(500).json({ error: 'Failed to update user role' })
  }
}

export async function banUserHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (!reason || reason.trim().length === 0) {
      res.status(400).json({ error: 'Ban reason is required' })
      return
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason,
        isActive: false,
      },
      select: {
        id: true,
        username: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
      },
    })

    res.json({ data: user })
  } catch (error) {
    logger.error('Error banning user:', error)
    res.status(500).json({ error: 'Failed to ban user' })
  }
}

export async function unbanUserHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        bannedAt: null,
        banReason: null,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        isBanned: true,
        isActive: true,
      },
    })

    res.json({ data: user })
  } catch (error) {
    logger.error('Error unbanning user:', error)
    res.status(500).json({ error: 'Failed to unban user' })
  }
}

export async function listReportsHandler(req: AuthRequest, res: Response) {
  try {
    const { page, limit } = parsePagination(req)
    const status = req.query.status as string
    const type = req.query.type as string

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          moderator: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where }),
    ])

    res.json({
      data: reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Error fetching reports:', error)
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
}

export async function updateReportHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { status, moderatorNote } = req.body

    if (!['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }

    const data: any = {
      status,
      moderatorId: req.user!.id,
    }

    if (moderatorNote) {
      data.moderatorNote = moderatorNote
    }

    if (status === 'RESOLVED' || status === 'DISMISSED') {
      data.resolvedAt = new Date()
    }

    const report = await prisma.report.update({
      where: { id },
      data,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    res.json({ data: report })
  } catch (error) {
    logger.error('Error updating report:', error)
    res.status(500).json({ error: 'Failed to update report' })
  }
}

export async function deletePostHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params

    await prisma.post.delete({
      where: { id },
    })

    res.json({ message: 'Post deleted successfully' })
  } catch (error) {
    logger.error('Error deleting post:', error)
    res.status(500).json({ error: 'Failed to delete post' })
  }
}

export async function deleteCommentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params

    await prisma.comment.delete({
      where: { id },
    })

    res.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    logger.error('Error deleting comment:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
}
