import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { transformPost } from '../utils/modelTransformer'

interface PreferenceFilters {
  positive: string[]
  negative: string[]
}

async function getPreferenceFilters(userId: string): Promise<PreferenceFilters> {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } })
  if (!prefs) return { positive: [], negative: [] }
  const safeParse = (s: string): string[] => {
    try {
      const arr = JSON.parse(s)
      return Array.isArray(arr) ? arr.filter((x: any) => typeof x === 'string' && x.length > 0) : []
    } catch {
      return []
    }
  }
  const dietary = safeParse(prefs.dietary)
  const cuisines = safeParse(prefs.cuisines)
  const allergies = safeParse(prefs.allergies)
  const positive = [...dietary, ...cuisines].map((t) => t.toLowerCase())
  const negative = allergies.map((t) => t.toLowerCase())
  return { positive, negative }
}

function buildTagOrFilter(keywords: string[]) {
  if (keywords.length === 0) return undefined
  return {
    OR: keywords.flatMap((kw) => [
      { tags: { contains: kw, mode: 'insensitive' as const } },
      { tags: { contains: kw.toLowerCase(), mode: 'insensitive' as const } },
      { category: { contains: kw, mode: 'insensitive' as const } },
    ]),
  }
}

function interleave<T extends { id: string }>(...lists: T[][]): T[] {
  const result: T[] = []
  const seen = new Set<string>()
  const maxLen = Math.max(0, ...lists.map((l) => l.length))
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      const item = list[i]
      if (item && !seen.has(item.id)) {
        seen.add(item.id)
        result.push(item)
      }
    }
  }
  return result
}

function buildTagNotFilter(keywords: string[]) {
  if (keywords.length === 0) return undefined
  return {
    NOT: {
      OR: keywords.flatMap((kw) => [
        { tags: { contains: kw, mode: 'insensitive' as const } },
        { tags: { contains: kw.toLowerCase(), mode: 'insensitive' as const } },
      ]),
    },
  }
}

interface CreatePostData {
  title: string
  description?: string
  imageUrl: string
  category: string
  tags: string[]
  isPublic?: boolean
  recipe?: {
    servings?: number
    prepTime?: number
    cookTime?: number
    difficulty?: string
    ingredients: any
    instructions: any
    nutrition?: any
  }
}

export async function getFollowingFeed(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const followedUsers = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })

  const followedUserIds = followedUsers.map(f => f.followingId)

  if (followedUserIds.length === 0) {
    return {
      posts: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    }
  }

  const posts = await prisma.post.findMany({
    where: {
      userId: { in: followedUserIds },
      isPublic: true,
    },
    take: limit,
    skip,
    orderBy: { createdAt: 'desc' },
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

  const postIds = posts.map(p => p.id)

  const [likes, saves] = await Promise.all([
    prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
    prisma.save.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
  ])

  const likedPostIds = new Set(likes.map(l => l.postId))
  const savedPostIds = new Set(saves.map(s => s.postId))

  const postsWithEngagement = posts.map(post => {
    const transformed = transformPost(post)
    return {
      ...transformed,
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id),
    }
  })

  const total = await prisma.post.count({
    where: {
      userId: { in: followedUserIds },
      isPublic: true,
    },
  })

  return {
    posts: postsWithEngagement,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getRelatedPosts(postId: string, userId?: string, limit: number = 6) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { category: true, tags: true },
  })

  if (!post) {
    throw new AppError(404, 'Post not found')
  }

  const tags = JSON.parse(post.tags || '[]')

  const relatedPosts = await prisma.post.findMany({
    where: {
      id: { not: postId },
      isPublic: true,
      OR: [
        { category: post.category },
        ...tags.map((tag: string) => ({ tags: { contains: tag, mode: 'insensitive' as const } })),
      ],
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
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

  const postIds = relatedPosts.map(p => p.id)

  let likedPostIds = new Set<string>()
  let savedPostIds = new Set<string>()

  if (userId) {
    const [likes, saves] = await Promise.all([
      prisma.like.findMany({
        where: {
          userId,
          postId: { in: postIds },
        },
        select: { postId: true },
      }),
      prisma.save.findMany({
        where: {
          userId,
          postId: { in: postIds },
        },
        select: { postId: true },
      }),
    ])
    likedPostIds = new Set(likes.map(l => l.postId))
    savedPostIds = new Set(saves.map(s => s.postId))
  }

  return relatedPosts.map(p => ({
    ...transformPost(p),
    isLiked: likedPostIds.has(p.id),
    isSaved: savedPostIds.has(p.id),
  }))
}

export async function getFeed(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const [followedUsers, prefs] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
    getPreferenceFilters(userId),
  ])

  const followedUserIds = followedUsers.map(f => f.followingId)
  const hasPrefs = prefs.positive.length > 0

  const followedQuota = Math.ceil(limit * 0.6)
  const preferenceQuota = hasPrefs ? Math.ceil(limit * 0.25) : 0

  const allergyFilter = buildTagNotFilter(prefs.negative)
  const userIncludeBlock = {
    user: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    },
  } as const

  const notBanned = { user: { is: { isBanned: false } } }

  let followedPosts: any[] = []
  if (followedUserIds.length > 0) {
    followedPosts = await prisma.post.findMany({
      where: {
        userId: { in: followedUserIds },
        isPublic: true,
        ...(allergyFilter ?? {}),
        ...notBanned,
      },
      take: followedQuota,
      skip: Math.floor(skip * 0.6),
      orderBy: { createdAt: 'desc' },
      include: userIncludeBlock,
    })
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const excludeIds = followedPosts.map(p => p.id)

  let preferencePosts: any[] = []
  if (preferenceQuota > 0) {
    const tagFilter = buildTagOrFilter(prefs.positive)
    preferencePosts = await prisma.post.findMany({
      where: {
        isPublic: true,
        id: { notIn: excludeIds },
        ...(tagFilter ?? {}),
        ...(allergyFilter ?? {}),
        ...notBanned,
      },
      take: preferenceQuota,
      skip: Math.floor(skip * 0.25),
      orderBy: [
        { likeCount: 'desc' },
        { saveCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: userIncludeBlock,
    })
  }

  const fillNeeded = limit - followedPosts.length - preferencePosts.length
  let popularPosts: any[] = []
  if (fillNeeded > 0) {
    popularPosts = await prisma.post.findMany({
      where: {
        isPublic: true,
        createdAt: { gte: sevenDaysAgo },
        id: { notIn: [...excludeIds, ...preferencePosts.map(p => p.id)] },
        ...(allergyFilter ?? {}),
        ...notBanned,
      },
      take: fillNeeded,
      skip: Math.floor(skip * 0.15),
      orderBy: [
        { likeCount: 'desc' },
        { saveCount: 'desc' },
      ],
      include: userIncludeBlock,
    })
  }

  const allPosts = interleave(followedPosts, preferencePosts, popularPosts)

  const postIds = allPosts.map(p => p.id)

  const [likes, saves] = await Promise.all([
    prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
    prisma.save.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    }),
  ])

  const likedPostIds = new Set(likes.map(l => l.postId))
  const savedPostIds = new Set(saves.map(s => s.postId))

  const postsWithEngagement = allPosts.map(post => {
    const transformed = transformPost(post)
    return {
      ...transformed,
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id),
    }
  })

  // Count the actual pools that make up the feed so pagination metadata is accurate.
  const sevenDaysAgoForCount = new Date()
  sevenDaysAgoForCount.setDate(sevenDaysAgoForCount.getDate() - 7)

  const [followedTotal, popularTotal] = await Promise.all([
    followedUserIds.length > 0
      ? prisma.post.count({ where: { userId: { in: followedUserIds }, isPublic: true, ...notBanned } })
      : Promise.resolve(0),
    prisma.post.count({
      where: {
        isPublic: true,
        createdAt: { gte: sevenDaysAgoForCount },
        NOT: { userId: { in: followedUserIds } },
        ...notBanned,
      },
    }),
  ])
  const total = followedTotal + popularTotal

  return {
    posts: postsWithEngagement,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getPostById(postId: string, userId?: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          followerCount: true,
          followingCount: true,
        },
      },
      recipe: true,
    },
  })

  if (!post) {
    throw new AppError(404, 'Post not found')
  }

  if (!post.isPublic) {
    throw new AppError(403, 'Post is not public')
  }

  if (userId) {
    const isOwnPost = post.userId === userId
    const [isLiked, isSaved, follow] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_postId: { userId, postId: post.id },
        },
      }),
      prisma.save.findUnique({
        where: {
          userId_postId: { userId, postId: post.id },
        },
      }),
      // Whether the viewer already follows the post's author (skip for own posts).
      isOwnPost
        ? Promise.resolve(null)
        : prisma.follow.findUnique({
            where: {
              followerId_followingId: { followerId: userId, followingId: post.userId },
            },
          }),
    ])

    const transformed = transformPost(post)
    return {
      ...transformed,
      isLiked: !!isLiked,
      isSaved: !!isSaved,
      user: {
        ...transformed.user,
        isFollowing: !!follow,
      },
    }
  }

  return transformPost(post)
}

export async function getPostsByUser(targetUserId: string, currentUserId: string | undefined, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const posts = await prisma.post.findMany({
    where: {
      userId: targetUserId,
      isPublic: true,
    },
    take: limit,
    skip,
    orderBy: { createdAt: 'desc' },
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

  let postsWithEngagement = posts

  if (currentUserId) {
    const postIds = posts.map(p => p.id)

    const [likes, saves] = await Promise.all([
      prisma.like.findMany({
        where: {
          userId: currentUserId,
          postId: { in: postIds },
        },
      }),
      prisma.save.findMany({
        where: {
          userId: currentUserId,
          postId: { in: postIds },
        },
      }),
    ])

    const likedPostIds = new Set(likes.map(l => l.postId))
    const savedPostIds = new Set(saves.map(s => s.postId))

    postsWithEngagement = posts.map(post => {
      const transformed = transformPost(post)
      return {
        ...transformed,
        isLiked: likedPostIds.has(post.id),
        isSaved: savedPostIds.has(post.id),
      }
    })
  } else {
    postsWithEngagement = posts.map(post => transformPost(post))
  }

  const total = await prisma.post.count({
    where: {
      userId: targetUserId,
      isPublic: true,
    },
  })

  return {
    posts: postsWithEngagement,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function createPost(userId: string, data: CreatePostData) {
  const { recipe, ...postData } = data

  const post = await prisma.post.create({
    data: {
      userId,
      title: postData.title,
      description: postData.description,
      imageUrl: postData.imageUrl,
      category: postData.category,
      tags: JSON.stringify(postData.tags || []),
      isPublic: postData.isPublic ?? true,
      recipe: recipe ? {
        create: {
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          difficulty: recipe.difficulty,
          ingredients: JSON.stringify(recipe.ingredients || []),
          instructions: JSON.stringify(recipe.instructions || []),
          nutrition: recipe.nutrition ? JSON.stringify(recipe.nutrition) : undefined,
        }
      } : undefined
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
      recipe: true,
    },
  })

  return transformPost(post)
}

export async function updatePost(postId: string, userId: string, data: Partial<CreatePostData>) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { recipe: true }
  })

  if (!post) {
    throw new AppError(404, 'Post not found')
  }

  if (post.userId !== userId) {
    throw new AppError(403, 'Not authorized to update this post')
  }

  const { recipe, ...postData } = data

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      tags: postData.tags ? JSON.stringify(postData.tags) : undefined,
      recipe: recipe ? {
        upsert: {
          create: {
            servings: recipe.servings,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            difficulty: recipe.difficulty,
            ingredients: JSON.stringify(recipe.ingredients || []),
            instructions: JSON.stringify(recipe.instructions || []),
            nutrition: recipe.nutrition ? JSON.stringify(recipe.nutrition) : undefined,
          },
          update: {
            servings: recipe.servings,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            difficulty: recipe.difficulty,
            ingredients: recipe.ingredients ? JSON.stringify(recipe.ingredients) : undefined,
            instructions: recipe.instructions ? JSON.stringify(recipe.instructions) : undefined,
            nutrition: recipe.nutrition ? JSON.stringify(recipe.nutrition) : undefined,
          }
        }
      } : undefined
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
      recipe: true,
    },
  })

  return transformPost(updatedPost)
}

export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    throw new AppError(404, 'Post not found')
  }

  if (post.userId !== userId) {
    throw new AppError(403, 'Not authorized to delete this post')
  }

  await prisma.post.delete({
    where: { id: postId },
  })

  return { success: true }
}

export async function searchPosts(
  query: string,
  userId?: string,
  category?: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const where: any = {
    isPublic: true,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { contains: query, mode: 'insensitive' } },
    ],
  }

  if (category) {
    where.category = category
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        recipe: true,
      },
    }),
    prisma.post.count({ where }),
  ])

  let likedPostIds = new Set<string>()
  let savedPostIds = new Set<string>()

  if (userId) {
    const postIds = posts.map((p) => p.id)
    const [likes, saves] = await Promise.all([
      prisma.like.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
      prisma.save.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ])
    likedPostIds = new Set(likes.map((l) => l.postId))
    savedPostIds = new Set(saves.map((s) => s.postId))
  }

  return {
    posts: posts.map((post) => ({
      ...transformPost(post),
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getAllIngredients() {
  const recipes = await prisma.recipe.findMany({
    select: { ingredients: true },
  })

  const ingredientNames = new Set<string>()

  recipes.forEach((recipe) => {
    try {
      const ingredients = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients
      if (Array.isArray(ingredients)) {
        ingredients.forEach((ing: any) => {
          if (ing && typeof ing.name === 'string') {
            ingredientNames.add(ing.name.toLowerCase().trim())
          }
        })
      }
    } catch (e) {
      // Ignore invalid JSON
    }
  })

  return Array.from(ingredientNames).sort()
}

export async function getPostsByTag(tag: string, userId?: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  const where: any = {
    isPublic: true,
    tags: { contains: tag, mode: 'insensitive' },
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        recipe: true,
      },
    }),
    prisma.post.count({ where }),
  ])

  let likedPostIds = new Set<string>()
  let savedPostIds = new Set<string>()

  if (userId) {
    const postIds = posts.map((p) => p.id)
    const [likes, saves] = await Promise.all([
      prisma.like.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
      prisma.save.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ])
    likedPostIds = new Set(likes.map((l) => l.postId))
    savedPostIds = new Set(saves.map((s) => s.postId))
  }


  return {
    posts: posts.map((post) => ({
      ...transformPost(post),
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getRecommendations(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit

  // 1. Get user preferences
  const preferences = await prisma.userPreference.findUnique({
    where: { userId },
  })

  const prefTags = preferences ? JSON.parse(preferences.dietary || '[]') : []
  const prefCuisines = preferences ? JSON.parse(preferences.cuisines || '[]') : []
  const dislikedIngredients = preferences ? JSON.parse(preferences.allergies || '[]') : []

  // 2. Fetch public posts that don't contain disliked ingredients
  const allPublicPosts = await prisma.post.findMany({
    where: {
      isPublic: true,
      NOT: { userId }, // Don't recommend own posts
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
      recipe: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Pull a candidate set
  })

  // 3. Score and rank posts
  const scoredPosts = allPublicPosts.map((post) => {
    let score = 0
    const tags = post.tags ? (typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags) : []
    const ingredients = post.recipe ? (typeof post.recipe.ingredients === 'string' ? JSON.parse(post.recipe.ingredients) : post.recipe.ingredients) : []
    const ingredientNames = Array.isArray(ingredients) ? ingredients.map((i: any) => i.name.toLowerCase()) : []

    // Tag match (Weight: 1.5)
    const tagMatch = Array.isArray(tags) ? tags.filter((t: string) => prefTags.includes(t)).length : 0
    score += tagMatch * 1.5

    // Cuisine match (Weight: 1.0)
    if (prefCuisines.includes(post.category)) {
      score += 2.0 // Category matches one of preferred cuisines
    }

    // Average rating (Weight: 1.0)
    score += (post.averageRating || 0) * 1.0

    // Recent bonus (Weight: 0.5 per day up to 5 days)
    const daysOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysOld < 5) score += (5 - daysOld) * 0.5

    // Disliked penalty
    if (ingredientNames.some((i: string) => dislikedIngredients.includes(i))) {
      score -= 50
    }

    return { ...post, score }
  })

  const sortedPosts = scoredPosts
    .filter((p) => p.score > -10) // Filter out hard dislikes
    .sort((a, b) => b.score - a.score)
    .slice(skip, skip + limit)

  // 4. Transform and check engagement
  const postIds = sortedPosts.map((p) => p.id)
  const [likes, saves] = await Promise.all([
    prisma.like.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    }),
    prisma.save.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    }),
  ])

  const likedPostIds = new Set(likes.map((l) => l.postId))
  const savedPostIds = new Set(saves.map((s) => s.postId))

  return {
    posts: sortedPosts.map((post) => ({
      ...transformPost(post),
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id),
      relevanceScore: post.score,
    })),
    pagination: {
      page,
      limit,
      total: scoredPosts.length,
      totalPages: Math.ceil(scoredPosts.length / limit),
    },
  }
}

