import apiClient from './client'
import type { Ingredient, PaginatedResponse } from '@/types'

export const ingredientsApi = {
  getIngredients(params?: { search?: string; all?: boolean; page?: number }) {
    return apiClient.get<PaginatedResponse<Ingredient> | { data: Ingredient[] }>('/ingredients', {
      params,
    })
  },

  getIngredient(id: number) {
    return apiClient.get<{ data: Ingredient }>(`/ingredients/${id}`)
  },

  createIngredient(data: Omit<Ingredient, 'id'>) {
    return apiClient.post<{ data: Ingredient }>('/ingredients', data)
  },

  updateIngredient(id: number, data: Partial<Omit<Ingredient, 'id'>>) {
    return apiClient.put<{ data: Ingredient }>(`/ingredients/${id}`, data)
  },

  deleteIngredient(id: number) {
    return apiClient.delete(`/ingredients/${id}`)
  },
}
