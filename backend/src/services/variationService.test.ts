import { forkRecipe } from './variationService'
import prisma from '../lib/prisma'

jest.mock('../lib/prisma', () => {
  const client: any = {
    post: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    recipe: {
      create: jest.fn(),
    },
    recipeVariation: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    notification: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(client)),
  }
  return { __esModule: true, default: client, prisma: client }
})

jest.mock('./notificationService', () => ({
  createNotification: jest.fn(),
}))

describe('variationService - forkRecipe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fork a recipe successfully', async () => {
    const mockOriginalPost = {
      id: 'original-post-id',
      userId: 'other-user-id',
      title: 'Original Recipe',
      description: 'Original Description',
      imageUrl: 'image.jpg',
      category: 'Recipe',
      tags: '["tag1"]',
      recipe: {
        id: 'original-recipe-id',
        postId: 'original-post-id',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        totalTime: 30,
        difficulty: 'medium',
        ingredients: '[{"name":"salt","quantity":"1 tsp"}]',
        instructions: '[{"step":1,"text":"mix"}]',
        nutrition: '{"calories":100}',
      },
      user: {
        id: 'other-user-id',
        username: 'otheruser',
        displayName: 'Other User',
      },
    }

    ;(prisma.post.findUnique as jest.Mock).mockResolvedValue(mockOriginalPost)

    const mockCreatedPost = {
      id: 'forked-post-id',
      userId: 'user-id',
      title: 'Forked Recipe',
      description: 'Forked Description',
      imageUrl: 'image.jpg',
      category: 'Recipe',
      tags: '["tag1"]',
      isVariation: true,
      isPublic: true,
    }
    ;(prisma.post.create as jest.Mock).mockResolvedValue(mockCreatedPost)

    const mockCreatedRecipe = {
      id: 'forked-recipe-id',
      postId: 'forked-post-id',
      servings: 4,
      prepTime: 10,
      cookTime: 20,
      totalTime: 30,
      difficulty: 'medium',
      ingredients: '[{"name":"salt","quantity":"1 tsp"}]',
      instructions: '[{"step":1,"text":"mix"}]',
      nutrition: '{"calories":100}',
    }
    ;(prisma.recipe.create as jest.Mock).mockResolvedValue(mockCreatedRecipe)

    const mockVariation = {
      id: 'variation-id',
      originalPostId: 'original-post-id',
      variationPostId: 'forked-post-id',
      userId: 'user-id',
      description: 'Inspired by the original',
    }
    ;(prisma.recipeVariation.create as jest.Mock).mockResolvedValue(mockVariation)

    const data = {
      title: 'Forked Recipe',
      description: 'Forked Description',
      variationDescription: 'Inspired by the original',
      recipeData: {
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        totalTime: 30,
        difficulty: 'medium',
        ingredients: [{ name: 'salt', quantity: '1 tsp' }],
        instructions: [{ step: 1, text: 'mix' }],
        nutrition: { calories: 100 },
      },
    }

    const result = await forkRecipe('user-id', 'original-post-id', data)

    expect(result.variation).toEqual(mockVariation)
    expect(result.variationPost.id).toEqual('forked-post-id')
    expect(result.variationPost.recipe.ingredients).toEqual([{ name: 'salt', quantity: '1 tsp' }])
  })

  it('should fall back to original recipe details if recipeData has missing/null fields', async () => {
    const mockOriginalPost = {
      id: 'original-post-id',
      userId: 'other-user-id',
      title: 'Original Recipe',
      description: 'Original Description',
      imageUrl: 'image.jpg',
      category: 'Recipe',
      tags: '["tag1"]',
      recipe: {
        id: 'original-recipe-id',
        postId: 'original-post-id',
        servings: 4,
        prepTime: 10,
        cookTime: 20,
        totalTime: 30,
        difficulty: 'medium',
        ingredients: '[{"name":"salt","quantity":"1 tsp"}]',
        instructions: '[{"step":1,"text":"mix"}]',
        nutrition: '{"calories":100}',
      },
      user: {
        id: 'other-user-id',
        username: 'otheruser',
        displayName: 'Other User',
      },
    }

    ;(prisma.post.findUnique as jest.Mock).mockResolvedValue(mockOriginalPost)
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'forked-post-id' })
    ;(prisma.recipe.create as jest.Mock).mockImplementation(({ data }) => {
      return {
        ...data,
        id: 'forked-recipe-id',
      }
    })
    ;(prisma.recipeVariation.create as jest.Mock).mockResolvedValue({ id: 'var-id' })

    const data = {
      title: 'Forked Recipe',
      recipeData: {}, // Empty recipeData, should fall back
    }

    await forkRecipe('user-id', 'original-post-id', data)

    // Check what was passed to prisma.recipe.create
    const createRecipeCall = (prisma.recipe.create as jest.Mock).mock.calls[0][0]
    expect(createRecipeCall.data.servings).toBe(4)
    expect(createRecipeCall.data.ingredients).toBe('[{"name":"salt","quantity":"1 tsp"}]')
  })
})
