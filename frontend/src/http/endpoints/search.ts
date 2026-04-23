import { httpClient } from '../client'
import type { ApiResponse } from '@/types'

export const searchApi = {
  search: (params: { q: string; type?: string; page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<any>>('/search', { params }),

  getTrending: (params: { period?: string; page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<any[]>>('/search/trending', { params }),

  getByCategory: (category: string, params: { page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<any[]>>(`/search/category/${category}`, { params }),

  getByTag: (tag: string, params: { page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<any[]>>(`/search/tag/${tag}`, { params }),

  getCategories: () =>
    httpClient.get<ApiResponse<any[]>>('/search/categories'),
}
