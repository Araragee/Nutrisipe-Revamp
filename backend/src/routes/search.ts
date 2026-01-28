import { Router } from 'express'
import { auth } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// Search posts, users, and recipes
router.get('/', auth, async (req, res) => {
  try {
    const query = req.query.q as string
    const type = req.query.type as string // 'posts', 'users', 'all'
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    if (!query || query.trim().length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' })
      return
    }

    const searchQuery = query.trim()

    let results: any = {
      posts: [],
      users: [],
    }

    // Search posts
    if (type === 'posts' || type === 'all' || !type) {
      const posts = await prisma.post.findMany({
        where: {
          isPublic: true,
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { category: { contains: searchQuery, mode: 'insensitive' } },
            { tags: { has: searchQuery.toLowerCase() } },
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
        ...post,
        isLiked: false, // Will be checked separately if needed
        isSaved: false,
      }))
    }

    // Search users
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

    // Get counts for pagination
    const counts = {
      posts: type === 'posts' ? await prisma.post.count({
        where: {
          isPublic: true,
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { category: { contains: searchQuery, mode: 'insensitive' } },
            { tags: { has: searchQuery.toLowerCase() } },
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
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Get trending/popular posts
router.get('/trending', auth, async (req, res) => {
  try {
    const period = req.query.period as string || '7days' // 24h, 7days, 30days, all
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

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
        ...(period !== 'all' && { createdAt: dateFilter }),
      },
    })

    res.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Trending posts error:', error)
    res.status(500).json({ error: 'Failed to fetch trending posts' })
  }
})

// Get posts by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const posts = await prisma.post.findMany({
      where: {
        isPublic: true,
        category: {
          equals: category,
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
        category: {
          equals: category,
          mode: 'insensitive',
        },
      },
    })

    res.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Category posts error:', error)
    res.status(500).json({ error: 'Failed to fetch category posts' })
  }
})

// Get all unique categories
router.get('/categories', auth, async (_req, res) => {
  try {
    const categories = await prisma.post.groupBy({
      by: ['category'],
      where: {
        isPublic: true,
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
    console.error('Categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Get posts by tag
router.get('/tag/:tag', auth, async (req, res) => {
  try {
    const { tag } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const posts = await prisma.post.findMany({
      where: {
        isPublic: true,
        tags: {
          has: tag.toLowerCase(),
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
        tags: {
          has: tag.toLowerCase(),
        },
      },
    })

    res.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Tag posts error:', error)
    res.status(500).json({ error: 'Failed to fetch tag posts' })
  }
})

export default router
