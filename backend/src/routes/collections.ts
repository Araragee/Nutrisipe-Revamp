import { Router } from 'express'
import { auth } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// Get all collections for the current user
router.get('/my-collections', auth, async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: {
        userId: req.user!.id,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
        posts: {
          take: 4,
          include: {
            post: {
              select: {
                id: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({ data: collections })
  } catch (error) {
    console.error('Get collections error:', error)
    res.status(500).json({ error: 'Failed to fetch collections' })
  }
})

// Get collections for a specific user (public only)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params
    const isOwnProfile = userId === req.user!.id

    const collections = await prisma.collection.findMany({
      where: {
        userId,
        ...(isOwnProfile ? {} : { isPublic: true }),
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
        posts: {
          take: 4,
          include: {
            post: {
              select: {
                id: true,
                imageUrl: true,
              },
            },
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({ data: collections })
  } catch (error) {
    console.error('Get user collections error:', error)
    res.status(500).json({ error: 'Failed to fetch collections' })
  }
})

// Get a single collection with all posts
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    // Check if user can view this collection
    if (!collection.isPublic && collection.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const [collectionPosts, total] = await Promise.all([
      prisma.collectionPost.findMany({
        where: {
          collectionId: id,
        },
        include: {
          post: {
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
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          addedAt: 'desc',
        },
      }),
      prisma.collectionPost.count({
        where: {
          collectionId: id,
        },
      }),
    ])

    const posts = collectionPosts.map(cp => cp.post)

    res.json({
      data: {
        collection,
        posts,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get collection error:', error)
    res.status(500).json({ error: 'Failed to fetch collection' })
  }
})

// Create a new collection
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Collection name is required' })
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Collection name must be less than 100 characters' })
    }

    const collection = await prisma.collection.create({
      data: {
        userId: req.user!.id,
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic ?? false,
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    res.status(201).json({ data: collection })
  } catch (error) {
    console.error('Create collection error:', error)
    res.status(500).json({ error: 'Failed to create collection' })
  }
})

// Update a collection
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, isPublic } = req.body

    const collection = await prisma.collection.findUnique({
      where: { id },
    })

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    if (collection.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    res.json({ data: updated })
  } catch (error) {
    console.error('Update collection error:', error)
    res.status(500).json({ error: 'Failed to update collection' })
  }
})

// Delete a collection
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    const collection = await prisma.collection.findUnique({
      where: { id },
    })

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    if (collection.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await prisma.collection.delete({
      where: { id },
    })

    res.json({ message: 'Collection deleted successfully' })
  } catch (error) {
    console.error('Delete collection error:', error)
    res.status(500).json({ error: 'Failed to delete collection' })
  }
})

// Add a post to a collection
router.post('/:id/posts/:postId', auth, async (req, res) => {
  try {
    const { id, postId } = req.params

    const collection = await prisma.collection.findUnique({
      where: { id },
    })

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    if (collection.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Check if already added
    const existing = await prisma.collectionPost.findUnique({
      where: {
        collectionId_postId: {
          collectionId: id,
          postId,
        },
      },
    })

    if (existing) {
      return res.status(400).json({ error: 'Post already in collection' })
    }

    const collectionPost = await prisma.collectionPost.create({
      data: {
        collectionId: id,
        postId,
      },
    })

    res.status(201).json({ data: collectionPost })
  } catch (error) {
    console.error('Add post to collection error:', error)
    res.status(500).json({ error: 'Failed to add post to collection' })
  }
})

// Remove a post from a collection
router.delete('/:id/posts/:postId', auth, async (req, res) => {
  try {
    const { id, postId } = req.params

    const collection = await prisma.collection.findUnique({
      where: { id },
    })

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    if (collection.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await prisma.collectionPost.delete({
      where: {
        collectionId_postId: {
          collectionId: id,
          postId,
        },
      },
    })

    res.json({ message: 'Post removed from collection' })
  } catch (error) {
    console.error('Remove post from collection error:', error)
    res.status(500).json({ error: 'Failed to remove post from collection' })
  }
})

export default router
