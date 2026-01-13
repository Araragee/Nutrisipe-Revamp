import { httpClient } from '../client'
import type { User, UserBasic } from '@/typescript/interface/User'
import type { Activity } from '@/typescript/interface/Activity'
import type { ApiResponse, PaginatedResponse } from '@/typescript/interface/ApiResponse'

export const usersApi = {
  search: (query: string, page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<User>>('/users/search', {
      params: { q: query, page, limit },
    }),

  getSuggestions: (limit = 15) =>
    httpClient.get<ApiResponse<User[]>>('/users/suggestions', {
      params: { limit },
    }),

  getById: (id: string) => httpClient.get<ApiResponse<User>>(`/users/${id}`),

  getFollowers: (id: string, page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<UserBasic>>(`/users/${id}/followers`, {
      params: { page, limit },
    }),

  getFollowing: (id: string, page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<UserBasic>>(`/users/${id}/following`, {
      params: { page, limit },
    }),

  getActivity: (id: string, limit = 20) =>
    httpClient.get<ApiResponse<Activity[]>>(`/users/${id}/activity`, {
      params: { limit },
    }),
}
