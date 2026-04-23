import prisma from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { createNotification } from './notificationService'

interface ForkRecipeData {
  title: string
  description?: string
  variationDescription?: string
  recipeData: any
}

export async function forkRecipe(
  userId: string,
  originalPostId: string,
  data: ForkRecipeData
) {
  const { title, description, variationDescription, recipeData } = data

  // Verify original post exists and has a recipe
  const originalPost = await prisma.post.findUnique({
    where: { id: originalPostId },
    include: {
      recipe: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      }
    }
  })

  if (!originalPost) {
    throw new AppError(404, 'Original recipe not found')
  }

  if (!originalPost.recipe) {
    throw new AppError(400, 'Post does not have a recipe to fork')
  }

  // Cannot fork your own recipe
  if (originalPost.userId === userId) {
    throw new AppError(400, 'Cannot fork your own recipe')
  }

  // Create new post and recipe in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create variation post
    const variationPost = await tx.post.create({
      data: {
        userId,
        title,
        description,
        imageUrl: originalPost.imageUrl, // Copy original image by default
        category: originalPost.category,
        tags: originalPost.tags,
        isVariation: true,
        isPublic: true
      }
    })

    // Create variation recipe with modified or original data
    const variationRecipe = await tx.recipe.create({
      data: {
        postId: variationPost.id,
        servings: recipeData.servings ?? originalPost.recipe!.servings,
        prepTime: recipeData.prepTime ?? originalPost.recipe!.prepTime,
        cookTime: recipeData.cookTime ?? originalPost.recipe!.cookTime,
        totalTime: recipeData.totalTime ?? originalPost.recipe!.totalTime,
        difficulty: recipeData.difficulty ?? originalPost.recipe!.difficulty,
        ingredients: recipeData.ingredients ?? originalPost.recipe!.ingredients,
        instructions: recipeData.instructions ?? originalPost.recipe!.instructions,
        nutrition: recipeData.nutrition ?? originalPost.recipe!.nutrition
      }
    })

    // Create variation relationship
    const variation = await tx.recipeVariation.create({
      data: {
        originalPostId,
        variationPostId: variationPost.id,
        userId,
        description: variationDescription
      }
    })

    // Update variation count on original post
    await tx.post.update({
      where: { id: originalPostId },
      data: {
        variationCount: { increment: 1 }
      }
    })

    return {
      variation,
      variationPost: {
        ...variationPost,
        recipe: variationRecipe
      }
    }
  })

  // Create notification for original post owner
  await createNotification({
    userId: originalPost.userId,
    actorId: userId,
    type: 'variation',
    postId: originalPostId
  })

  return result
}

export async function getVariations(
  postId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const [variations, total] = await Promise.all([
    prisma.recipeVariation.findMany({
      where: { originalPostId: postId },
      include: {
        variationPost: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            },
            recipe: true,
            _count: {
              select: {
                likes: true,
                comments: true,
                saves: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.recipeVariation.count({
      where: { originalPostId: postId }
    })
  ])

  return {
    variations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export async function getOriginalRecipe(postId: string) {
  // Check if this post is a variation
  const variation = await prisma.recipeVariation.findUnique({
    where: { variationPostId: postId },
    include: {
      originalPost: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          },
          recipe: true
        }
      }
    }
  })

  if (!variation) {
    return null
  }

  return {
    variation,
    originalPost: variation.originalPost
  }
}

export async function getVariationChain(postId: string) {
  const chain: any[] = []

  // Find if this is a variation and get the original
  let currentPost = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      variationOf: {
        include: {
          originalPost: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    }
  })

  if (!currentPost) {
    throw new AppError(404, 'Post not found')
  }

  // Traverse up to find the root
  while (currentPost.variationOf) {
    chain.unshift({
      post: currentPost.variationOf.originalPost,
      variation: currentPost.variationOf
    })

    currentPost = await prisma.post.findUnique({
      where: { id: currentPost.variationOf.originalPostId },
      include: {
        variationOf: {
          include: {
            originalPost: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!currentPost) break
  }

  // Add the current post at the end
  const finalPost = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    }
  })

  if (finalPost) {
    chain.push({ post: finalPost })
  }

  return {
    chain,
    depth: chain.length
  }
}

export async function deleteVariation(variationId: string, userId: string) {
  const variation = await prisma.recipeVariation.findUnique({
    where: { id: variationId },
    include: {
      variationPost: true
    }
  })

  if (!variation) {
    throw new AppError(404, 'Variation not found')
  }

  // Only the creator can delete the variation relationship
  if (variation.userId !== userId) {
    throw new AppError(403, 'You can only delete your own variations')
  }

  // Delete variation relationship and update count
  await prisma.$transaction([
    prisma.recipeVariation.delete({
      where: { id: variationId }
    }),
    prisma.post.update({
      where: { id: variation.originalPostId },
      data: {
        variationCount: { decrement: 1 }
      }
    }),
    prisma.post.update({
      where: { id: variation.variationPostId },
      data: {
        isVariation: false
      }
    })
  ])

  return { success: true }
}
