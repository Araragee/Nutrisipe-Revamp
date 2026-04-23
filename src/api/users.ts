import apiClient from './client'
import type { User, Recipe, PaginatedResponse } from '@/types'

export const usersApi = {
  getUser(id: number) {
    return apiClient.get<{ data: User }>(`/users/${id}`)
  },

  getUserRecipes(id: number, page?: number) {
    return apiClient.get<PaginatedResponse<Recipe>>(`/users/${id}/recipes`, {
      params: { page },
    })
  },

  getUserSavedRecipes(id: number, page?: number) {
    return apiClient.get<PaginatedResponse<Recipe>>(`/users/${id}/saved-recipes`, {
      params: { page },
    })
  },

  getFollowers(id: number) {
    return apiClient.get<{ data: User[] }>(`/users/${id}/followers`)
  },

  getFollowing(id: number) {
    return apiClient.get<{ data: User[] }>(`/users/${id}/following`)
  },

  followUser(id: number) {
    return apiClient.post(`/users/${id}/follow`)
  },

  unfollowUser(id: number) {
    return apiClient.delete(`/users/${id}/follow`)
  },

  isFollowing(id: number) {
    return apiClient.get<{ is_following: boolean }>(`/users/${id}/is-following`)
  },
}
