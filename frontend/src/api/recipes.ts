import apiClient from './client'
import type { Recipe, PaginatedResponse, RecipeFormData } from '@/types'

export const recipesApi = {
  getRecipes(params?: {
    category?: string
    following?: boolean
    search?: string
    page?: number
  }) {
    return apiClient.get<PaginatedResponse<Recipe>>('/recipes', { params })
  },

  getRecipe(id: number) {
    return apiClient.get<{ data: Recipe }>(`/recipes/${id}`)
  },

  createRecipe(data: RecipeFormData) {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('description', data.description)
    formData.append('category', data.category)
    formData.append('yield_amount', data.yield_amount)

    if (data.image) {
      formData.append('image', data.image)
    }

    data.procedure.forEach((step, index) => {
      formData.append(`procedure[${index}]`, step)
    })

    data.ingredients.forEach((ingredient, index) => {
      formData.append(`ingredients[${index}][ingredient_id]`, ingredient.ingredient_id?.toString() || '')
      formData.append(`ingredients[${index}][name]`, ingredient.name)
      formData.append(`ingredients[${index}][amount]`, ingredient.amount.toString())
      formData.append(`ingredients[${index}][is_custom]`, ingredient.is_custom.toString())
    })

    return apiClient.post<{ data: Recipe }>('/recipes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  updateRecipe(id: number, data: Partial<RecipeFormData>) {
    const formData = new FormData()

    if (data.title) formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.category) formData.append('category', data.category)
    if (data.image) formData.append('image', data.image)

    if (data.procedure) {
      data.procedure.forEach((step, index) => {
        formData.append(`procedure[${index}]`, step)
      })
    }

    return apiClient.post<{ data: Recipe }>(`/recipes/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: { _method: 'PUT' },
    })
  },

  deleteRecipe(id: number) {
    return apiClient.delete(`/recipes/${id}`)
  },

  toggleHide(id: number) {
    return apiClient.post<{ message: string; is_hidden: boolean }>(`/recipes/${id}/toggle-hide`)
  },

  saveRecipe(id: number) {
    return apiClient.post(`/recipes/${id}/save`)
  },

  unsaveRecipe(id: number) {
    return apiClient.delete(`/recipes/${id}/save`)
  },

  getRelatedRecipes(id: number) {
    return apiClient.get<{ data: Recipe[] }>(`/recipes/${id}/related`)
  },
}
