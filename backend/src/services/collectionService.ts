import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { transformPost } from '../utils/modelTransformer'

export async function createCollection(userId: string, data: { name: string; description?: string; isPublic?: boolean }) {
  const collection = await prisma.collection.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      isPublic: data.isPublic ?? false,
    },
  })
  return collection
}

export async function getCollections(userId: string, currentUserId?: string) {
  const isOwner = userId === currentUserId

  const collections = await prisma.collection.findMany({
    where: {
      userId,
      OR: isOwner ? undefined : [{ isPublic: true }],
    },
    include: {
      _count: {
        select: { posts: true },
      },
      posts: {
        take: 1,
        include: {
          post: {
            select: { imageUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return collections.map(c => ({
    ...c,
    thumbnailUrl: c.posts[0]?.post?.imageUrl || null,
    postCount: c._count.posts,
  }))
}

export async function getCollectionById(collectionId: string, currentUserId?: string) {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      posts: {
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
            },
          },
        },
      },
    },
  })

  if (!collection) {
    throw new AppError(404, 'Collection not found')
  }

  if (!collection.isPublic && collection.userId !== currentUserId) {
    throw new AppError(403, 'Access denied')
  }

  return {
    ...collection,
    posts: collection.posts.map(p => transformPost(p.post)),
  }
}

export async function addPostToCollection(collectionId: string, postId: string, userId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  })

  if (!collection) {
    throw new AppError(404, 'Collection not found')
  }

  if (collection.userId !== userId) {
    throw new AppError(403, 'Not authorized')
  }

  const collectionPost = await prisma.collectionPost.upsert({
    where: {
      collectionId_postId: { collectionId, postId },
    },
    create: { collectionId, postId },
    update: {}, // Already exists
  })

  return collectionPost
}

export async function removePostFromCollection(collectionId: string, postId: string, userId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  })

  if (!collection) {
    throw new AppError(404, 'Collection not found')
  }

  if (collection.userId !== userId) {
    throw new AppError(403, 'Not authorized')
  }

  await prisma.collectionPost.delete({
    where: {
      collectionId_postId: { collectionId, postId },
    },
  })

  return { success: true }
}

export async function deleteCollection(collectionId: string, userId: string) {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  })

  if (!collection) {
    throw new AppError(404, 'Collection not found')
  }

  if (collection.userId !== userId) {
    throw new AppError(403, 'Not authorized')
  }

  await prisma.collection.delete({
    where: { id: collectionId },
  })

  return { success: true }
}
