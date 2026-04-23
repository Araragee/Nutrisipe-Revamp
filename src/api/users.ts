import apiClient from './client'
import type { User, Recipe, PaginatedResponse } from '@/types'

export const usersApi = {
  getUser(id: string | number) {
    return apiClient.get<{ data: User }>(`/users/${id}`)
  },

  getUserRecipes(id: string | number, page?: number) {
    return apiClient.get<PaginatedResponse<Recipe>>(`/users/${id}/recipes`, {
      params: { page },
    })
  },

  getUserSavedRecipes(id: string | number, page?: number) {
    return apiClient.get<PaginatedResponse<Recipe>>(`/users/${id}/saved-recipes`, {
      params: { page },
    })
  },

  getFollowers(id: string | number) {
    return apiClient.get<{ data: User[] }>(`/users/${id}/followers`)
  },

  getFollowing(id: string | number) {
    return apiClient.get<{ data: User[] }>(`/users/${id}/following`)
  },

  followUser(id: string | number) {
    return apiClient.post(`/users/${id}/follow`)
  },

  unfollowUser(id: string | number) {
    return apiClient.delete(`/users/${id}/follow`)
  },

  isFollowing(id: string | number) {
    return apiClient.get<{ is_following: boolean }>(`/users/${id}/is-following`)
  },
}
