import { logger } from '../utils/logger'
import { Router } from 'express'
import { z } from 'zod'
import { auth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { parsePagination } from '../utils/pagination'

const router = Router()

const createReportSchema = z
  .object({
    type: z.enum(['POST', 'COMMENT', 'USER']),
    reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'COPYRIGHT', 'OTHER']),
    description: z.string().max(2000).optional(),
    postId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
    reportedUserId: z.string().uuid().optional(),
  })
  .refine(
    (d) =>
      (d.type === 'POST' && !!d.postId) ||
      (d.type === 'COMMENT' && !!d.commentId) ||
      (d.type === 'USER' && !!d.reportedUserId),
    { message: 'A matching target ID is required for the report type' }
  )

// Create a report
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const parsed = createReportSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { type, reason, description, postId, commentId, reportedUserId } = parsed.data

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
      res.status(400).json({ error: 'You have already reported this item' })
      return
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
    logger.error('Error creating report:', error)
    res.status(500).json({ error: 'Failed to create report' })
  }
})

// Get user's reports
router.get('/my-reports', auth, async (req: AuthRequest, res) => {
  try {
    const { page, limit } = parsePagination(req)

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
    logger.error('Error fetching reports:', error)
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

export default router
