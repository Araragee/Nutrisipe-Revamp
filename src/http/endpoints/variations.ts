import api from '../api'

export interface ForkRecipeData {
  title: string
  description?: string
  variationDescription?: string
  recipeData?: {
    servings?: number
    prepTime?: number
    cookTime?: number
    totalTime?: number
    difficulty?: string
    ingredients?: any[]
    instructions?: any[]
    nutrition?: any
  }
}

export interface RecipeVariation {
  id: string
  originalPostId: string
  variationPostId: string
  userId: string
  description?: string
  createdAt: string
  variationPost: any
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
}

export interface VariationChainItem {
  post: any
  variation?: RecipeVariation
}

export const variationsEndpoints = {
  // Fork a recipe
  forkRecipe: async (postId: string, data: ForkRecipeData) => {
    const response = await api.post(`/variations/${postId}/fork`, data)
    return response.data
  },

  // Get all variations of a recipe
  getVariations: async (postId: string, page = 1, limit = 20) => {
    const response = await api.get(`/variations/${postId}/variations`, {
      params: { page, limit }
    })
    return response.data
  },

  // Get original recipe if this is a variation
  getOriginalRecipe: async (postId: string) => {
    const response = await api.get(`/variations/${postId}/original`)
    return response.data
  },

  // Get variation chain (full lineage)
  getVariationChain: async (postId: string) => {
    const response = await api.get(`/variations/${postId}/chain`)
    return response.data
  },

  // Delete variation relationship
  deleteVariation: async (variationId: string) => {
    const response = await api.delete(`/variations/${variationId}`)
    return response.data
  }
}
