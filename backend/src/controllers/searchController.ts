import { logger } from '../utils/logger'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { transformPost } from '../utils/modelTransformer'
import { parsePagination } from '../utils/pagination'
import type { Response } from 'express'

export async function searchHandler(req: AuthRequest, res: Response) {
  try {
    const query = req.query.q as string
    const type = req.query.type as string
    const { page, limit } = parsePagination(req)

    if (!query || query.trim().length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' })
      return
    }

    const searchQuery = query.trim().replace(/[%_\\]/g, '\\$&')

    let results: any = {
      posts: [],
      users: [],
    }

    if (type === 'posts' || type === 'all' || !type) {
      const posts = await prisma.post.findMany({
        where: {
          isPublic: true,
          user: { isBanned: false },
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { category: { contains: searchQuery, mode: 'insensitive' } },
            { tags: { contains: searchQuery.toLowerCase(), mode: 'insensitive' } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              saves: true,
            },
          },
        },
        skip: type === 'posts' ? (page - 1) * limit : 0,
        take: type === 'posts' ? limit : 10,
        orderBy: [
          { likeCount: 'desc' },
          { createdAt: 'desc' },
        ],
      })

      results.posts = posts.map(post => ({
        ...transformPost(post),
        isLiked: false,
        isSaved: false,
      }))
    }

    if (type === 'users' || type === 'all' || !type) {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          isBanned: false,
          OR: [
            { username: { contains: searchQuery, mode: 'insensitive' } },
            { displayName: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          followerCount: true,
          followingCount: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
        skip: type === 'users' ? (page - 1) * limit : 0,
        take: type === 'users' ? limit : 10,
        orderBy: [
          { followerCount: 'desc' },
          { createdAt: 'desc' },
        ],
      })

      results.users = users
    }

    const counts = {
      posts: type === 'posts' ? await prisma.post.count({
        where: {
          isPublic: true,
          user: { isBanned: false },
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { category: { contains: searchQuery, mode: 'insensitive' } },
            { tags: { contains: searchQuery.toLowerCase(), mode: 'insensitive' } },
          ],
        },
      }) : results.posts.length,
      users: type === 'users' ? await prisma.user.count({
        where: {
          isActive: true,
          isBanned: false,
          OR: [
            { username: { contains: searchQuery, mode: 'insensitive' } },
            { displayName: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
      }) : results.users.length,
    }

    res.json({
      data: results,
      pagination: type && type !== 'all' ? {
        page,
        limit,
        total: counts[type as 'posts' | 'users'],
        pages: Math.ceil(counts[type as 'posts' | 'users'] / limit),
      } : undefined,
      counts,
    })
  } catch (error) {
    logger.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
}

export async function getTrendingHandler(req: AuthRequest, res: Response) {
  try {
    const period = req.query.period as string || '7days'
    const { page, limit } = parsePagination(req)

    let dateFilter: any = {}

    const now = new Date()
    if (period === '24h') {
      dateFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    } else if (period === '7days') {
      dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
    } else if (period === '30days') {
      dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    }

    const posts = await prisma.post.findMany({
      where: {
        isPublic: true,
        user: { isBanned: false },
        ...(period !== 'all' && { createdAt: dateFilter }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            saves: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { likeCount: 'desc' },
        { saveCount: 'desc' },
        { commentCount: 'desc' },
      ],
    })

    const total = await prisma.post.count({
      where: {
        isPublic: true,
        user: { isBanned: false },
        ...(period !== 'all' && { createdAt: dateFilter }),
      },
    })

    res.json({
      data: posts.map(post => transformPost(post)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Trending posts error:', error)
    res.status(500).json({ error: 'Failed to fetch trending posts' })
  }
}

export async function getByCategoryHandler(req: AuthRequest, res: Response) {
  try {
    const { category } = req.params
    const { page, limit } = parsePagination(req)

    const posts = await prisma.post.findMany({
      where: {
        isPublic: true,
        user: { isBanned: false },
        category: {
          equals: category,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            saves: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.post.count({
      where: {
        isPublic: true,
        user: { isBanned: false },
        category: {
          equals: category,
        },
      },
    })

    res.json({
      data: posts.map(post => transformPost(post)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Category posts error:', error)
    res.status(500).json({ error: 'Failed to fetch category posts' })
  }
}

export async function getCategoriesHandler(_req: AuthRequest, res: Response) {
  try {
    const categories = await prisma.post.groupBy({
      by: ['category'],
      where: {
        isPublic: true,
        user: { isBanned: false },
      },
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    })

    res.json({
      data: categories.map(cat => ({
        name: cat.category,
        count: cat._count.category,
      })),
    })
  } catch (error) {
    logger.error('Categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
}

export async function getByTagHandler(req: AuthRequest, res: Response) {
  try {
    const { tag } = req.params
    const { page, limit } = parsePagination(req)

    const posts = await prisma.post.findMany({
      where: {
        isPublic: true,
        user: { isBanned: false },
        tags: {
          contains: tag.toLowerCase(),
          mode: 'insensitive',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            saves: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.post.count({
      where: {
        isPublic: true,
        user: { isBanned: false },
        tags: {
          contains: tag.toLowerCase(),
          mode: 'insensitive',
        },
      },
    })

    res.json({
      data: posts.map(post => transformPost(post)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Tag posts error:', error)
    res.status(500).json({ error: 'Failed to fetch tag posts' })
  }
}

export async function getTrendingTagsHandler(req: AuthRequest, res: Response) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
    const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 14))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const posts = await prisma.post.findMany({
      where: { isPublic: true, user: { isBanned: false }, createdAt: { gte: since } },
      select: { tags: true },
      take: 1000,
    })

    const counts: Record<string, number> = {}
    for (const p of posts) {
      try {
        const arr = JSON.parse(p.tags)
        if (!Array.isArray(arr)) continue
        for (const raw of arr) {
          const tag = String(raw ?? '').trim()
          if (!tag) continue
          const key = tag.toLowerCase()
          counts[key] = (counts[key] || 0) + 1
        }
      } catch {
      }
    }

    const top = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))

    res.json({ data: top })
  } catch (error) {
    logger.error('Trending tags error:', error)
    res.status(500).json({ error: 'Failed to fetch trending tags' })
  }
}
