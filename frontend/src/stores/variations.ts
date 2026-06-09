import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { variationsApi, type Variation } from '@/http/endpoints/variations'

export const useVariationsStore = defineStore('variations', () => {
  const variations = ref<Map<string, Variation[]>>(new Map())
  const variationChains = ref<Map<string, any[]>>(new Map())
  const originalRecipes = ref<Map<string, any>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fork a recipe
  const forkRecipe = async (postId: string, data: any) => {
    loading.value = true
    error.value = null

    try {
      const response = await variationsApi.fork(postId, data)

      // Clear cached variations for the original post
      variations.value.delete(postId)

      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fork recipe'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get variations for a post
  const getVariations = async (postId: string, page = 1, limit = 20) => {
    loading.value = true
    error.value = null

    try {
      const response = await variationsApi.getVariations(postId, { page, limit })
      variations.value.set(postId, response.data.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch variations'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get original recipe
  const getOriginalRecipe = async (postId: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await variationsApi.getOriginal(postId)
      if (response.data.data) {
        originalRecipes.value.set(postId, response.data.data)
      }
      return response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch original recipe'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get variation chain
  const getVariationChain = async (postId: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await variationsApi.getChain(postId)
      variationChains.value.set(postId, response.data.data.chain)
      return response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch variation chain'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete variation
  const deleteVariation = async (variationId: string, originalPostId: string) => {
    loading.value = true
    error.value = null

    try {
      // TODO(audit:F-12) [LOW] Delete is a stub — cache is cleared but the variation is never deleted server-side, so it reappears on reload. Implement variationsApi.deleteVariation or remove the action.
      // Need to add delete to variationsApi if needed, but for now just stub
      // await variationsApi.deleteVariation(variationId)

      // Clear cached data
      variations.value.delete(originalPostId)

      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete variation'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get cached variations for a post
  const getPostVariations = computed(() => (postId: string) => {
    return variations.value.get(postId) || []
  })

  // Get cached variation chain
  const getPostVariationChain = computed(() => (postId: string) => {
    return variationChains.value.get(postId) || []
  })

  // Get cached original recipe
  const getPostOriginalRecipe = computed(() => (postId: string) => {
    return originalRecipes.value.get(postId)
  })

  return {
    variations,
    variationChains,
    originalRecipes,
    loading,
    error,
    forkRecipe,
    getVariations,
    getOriginalRecipe,
    getVariationChain,
    deleteVariation,
    getPostVariations,
    getPostVariationChain,
    getPostOriginalRecipe
  }
})
