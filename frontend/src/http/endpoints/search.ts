import { httpClient } from '../client'
import type { ApiResponse } from '@/types'
import type { Post } from '@/typescript/interface/Post'
import type { UserBasic } from '@/typescript/interface/User'

export interface TrendingTag {
  name: string
  count: number
}

export interface SearchResults {
  posts?: Post[]
  users?: UserBasic[]
}

export interface CategoryCount {
  category: string
  count: number
}

type SearchScope = 'all' | 'recipes' | 'users'

export const searchApi = {
  search: (params: { q: string; type?: SearchScope; page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<SearchResults>>('/search', { params }),

  getTrending: (params: { period?: string; page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<Post[]>>('/search/trending', { params }),

  getByCategory: (category: string, params: { page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<Post[]>>(`/search/category/${category}`, { params }),

  getByTag: (tag: string, params: { page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<Post[]>>(`/search/tag/${tag}`, { params }),

  getCategories: () =>
    httpClient.get<ApiResponse<CategoryCount[]>>('/search/categories'),

  getTrendingTags: (limit = 20) =>
    httpClient.get<ApiResponse<TrendingTag[]>>('/search/trending-tags', {
      params: { limit },
    }),
}
