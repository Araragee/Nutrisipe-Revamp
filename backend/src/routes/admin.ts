import { Router } from 'express'
import { auth } from '../middleware/auth'
import { adminOnly } from '../middleware/roles'
import { prisma } from '../lib/prisma'

const router = Router()

// Admin dashboard statistics
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalPosts,
      totalComments,
      pendingReports,
      newUsersToday,
      newPostsToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true, isBanned: false } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        newToday: newUsersToday,
      },
      content: {
        posts: totalPosts,
        comments: totalComments,
        newPostsToday: newPostsToday,
      },
      moderation: {
        pendingReports: pendingReports,
      },
    }

    res.json({ data: stats })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    res.status(500).json({ error: 'Failed to fetch admin statistics' })
  }
})

// Get all users with pagination
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
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
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Update user role
router.put('/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
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
    console.error('Error updating user role:', error)
    res.status(500).json({ error: 'Failed to update user role' })
  }
})

// Ban user
router.post('/users/:id/ban', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Ban reason is required' })
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
    console.error('Error banning user:', error)
    res.status(500).json({ error: 'Failed to ban user' })
  }
})

// Unban user
router.post('/users/:id/unban', auth, adminOnly, async (req, res) => {
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
    console.error('Error unbanning user:', error)
    res.status(500).json({ error: 'Failed to unban user' })
  }
})

// Get all reports with pagination
router.get('/reports', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
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
    console.error('Error fetching reports:', error)
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

// Update report status
router.put('/reports/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { status, moderatorNote } = req.body

    if (!['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
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
    console.error('Error updating report:', error)
    res.status(500).json({ error: 'Failed to update report' })
  }
})

// Delete post (content moderation)
router.delete('/posts/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params

    await prisma.post.delete({
      where: { id },
    })

    res.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// Delete comment (content moderation)
router.delete('/comments/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params

    await prisma.comment.delete({
      where: { id },
    })

    res.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

export default router
