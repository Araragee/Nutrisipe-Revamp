import { ref } from 'vue'
import { recipesApi } from '@/api'
import type { Recipe } from '@/types'

export function useRecipes() {
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const lastPage = ref(1)

  const loadRecipes = async (params?: {
    category?: string
    following?: boolean
    search?: string
    page?: number
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await recipesApi.getRecipes(params)
      recipes.value = response.data.data
      currentPage.value = response.data.meta.current_page
      lastPage.value = response.data.meta.last_page
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load recipes'
      console.error('Failed to load recipes:', err)
    } finally {
      loading.value = false
    }
  }

  const nextPage = () => {
    if (currentPage.value < lastPage.value) {
      return currentPage.value + 1
    }
    return currentPage.value
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      return currentPage.value - 1
    }
    return currentPage.value
  }

  return {
    recipes,
    loading,
    error,
    currentPage,
    lastPage,
    loadRecipes,
    nextPage,
    prevPage,
  }
}
