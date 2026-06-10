import { httpClient } from '../client'
import type { ApiResponse } from '@/typescript/interface/ApiResponse'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealPlan {
  id: string
  userId: string
  postId: string
  date: string
  slot: MealSlot
  servings: number
  notes: string | null
  createdAt: string
  updatedAt: string
  post: any
}

export type GroceryCategory =
  | 'produce'
  | 'protein'
  | 'dairy'
  | 'grain'
  | 'pantry'
  | 'frozen'
  | 'beverage'
  | 'spice'
  | 'other'

export interface GroceryItem {
  name: string
  unit: string
  total: string | null
  raw: string[]
  sources: { postId: string; title: string; servings: number; baseServings: number | null }[]
  category: GroceryCategory
  categoryLabel: string
}

export interface GroceryList {
  range: { from: string; to: string }
  items: GroceryItem[]
  planCount: number
  categoriesOrder: GroceryCategory[]
  categoryLabels: Record<GroceryCategory, string>
}

export const mealPlansApi = {
  list: (from?: string, to?: string) =>
    httpClient.get<ApiResponse<MealPlan[]> & { range: { from: string; to: string } }>('/meal-plans', {
      params: { from, to },
    }),

  create: (data: {
    postId: string
    date: string
    slot: MealSlot
    servings?: number
    notes?: string
  }) => httpClient.post<ApiResponse<MealPlan>>('/meal-plans', data),

  update: (
    id: string,
    data: { date?: string; slot?: MealSlot; servings?: number; notes?: string | null },
  ) => httpClient.put<ApiResponse<MealPlan>>(`/meal-plans/${id}`, data),

  delete: (id: string) => httpClient.delete<ApiResponse<void>>(`/meal-plans/${id}`),

  grocery: (from?: string, to?: string) =>
    httpClient.get<ApiResponse<GroceryList>>('/meal-plans/grocery', {
      params: { from, to },
    }),
}
