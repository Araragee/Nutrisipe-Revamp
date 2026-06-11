import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'

interface ListParams {
  search?: string
  category?: string
  page?: number
  limit?: number
  all?: boolean
}

interface IngredientInput {
  food_item: string
  alt_name?: string | null
  category?: string | null
  edible_portion?: number
  energy?: number
  protein?: number
  fat?: number
  carb?: number
  calcium?: number
  phos?: number
  iron?: number
  vit_a?: number
  thia?: number
  ribo?: number
  nia?: number
  vit_c?: number
  source?: string | null
}

export async function listIngredients(params: ListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50

  const where: Prisma.IngredientWhereInput = {}
  if (params.search) {
    where.OR = [
      { food_item: { contains: params.search, mode: 'insensitive' } },
      { alt_name: { contains: params.search, mode: 'insensitive' } },
    ]
  }
  if (params.category) {
    where.category = params.category
  }

  if (params.all) {
    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { food_item: 'asc' },
    })
    return {
      ingredients,
      pagination: {
        page: 1,
        limit: ingredients.length,
        total: ingredients.length,
        totalPages: 1,
      },
    }
  }

  const [ingredients, total] = await Promise.all([
    prisma.ingredient.findMany({
      where,
      orderBy: { food_item: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ingredient.count({ where }),
  ])

  return {
    ingredients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export function getIngredientById(id: string) {
  return prisma.ingredient.findUnique({ where: { id } })
}

export function createIngredient(data: IngredientInput) {
  return prisma.ingredient.create({ data })
}

export function updateIngredient(id: string, data: Partial<IngredientInput>) {
  return prisma.ingredient.update({ where: { id }, data })
}

export function deleteIngredient(id: string) {
  return prisma.ingredient.delete({ where: { id } })
}
