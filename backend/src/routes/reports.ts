import { Router } from 'express'
import { auth } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// Create a report
router.post('/', auth, async (req, res) => {
  try {
    const { type, reason, description, postId, commentId, reportedUserId } = req.body

    // Validate required fields
    if (!type || !reason) {
      return res.status(400).json({ error: 'Type and reason are required' })
    }

    // Validate type
    if (!['POST', 'COMMENT', 'USER'].includes(type)) {
      return res.status(400).json({ error: 'Invalid report type' })
    }

    // Validate reason
    const validReasons = ['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'COPYRIGHT', 'OTHER']
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' })
    }

    // Validate that the correct ID is provided for the type
    if (type === 'POST' && !postId) {
      return res.status(400).json({ error: 'Post ID is required for post reports' })
    }
    if (type === 'COMMENT' && !commentId) {
      return res.status(400).json({ error: 'Comment ID is required for comment reports' })
    }
    if (type === 'USER' && !reportedUserId) {
      return res.status(400).json({ error: 'User ID is required for user reports' })
    }

    // Check if user has already reported this item
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: req.user!.id,
        ...(postId && { postId }),
        ...(commentId && { commentId }),
        ...(reportedUserId && { reportedUserId }),
      },
    })

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this item' })
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId: req.user!.id,
        type,
        reason,
        description,
        postId: postId || null,
        commentId: commentId || null,
        reportedUserId: reportedUserId || null,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    res.status(201).json({ data: report })
  } catch (error) {
    console.error('Error creating report:', error)
    res.status(500).json({ error: 'Failed to create report' })
  }
})

// Get user's reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: {
          reporterId: req.user!.id,
        },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({
        where: {
          reporterId: req.user!.id,
        },
      }),
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

export default router
