import { httpClient } from '../client'
import type { Post } from '@/typescript/interface/Post'
import type { PaginatedResponse, ApiResponse } from '@/typescript/interface/ApiResponse'

export const postsApi = {
  getFeed: (page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<Post>>('/posts/feed', {
      params: { page, limit },
    }),

  getFollowingFeed: (page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<Post>>('/posts/following', {
      params: { page, limit },
    }),

  getById: (id: string) => httpClient.get<ApiResponse<Post>>(`/posts/${id}`),

  getByUser: (userId: string, page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<Post>>(`/posts/user/${userId}`, {
      params: { page, limit },
    }),

  create: (data: Partial<Post>) => httpClient.post<ApiResponse<Post>>('/posts', data),

  update: (id: string, data: Partial<Post>) =>
    httpClient.patch<ApiResponse<Post>>(`/posts/${id}`, data),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<void>>(`/posts/${id}`),

  getRelated: (id: string) =>
    httpClient.get<ApiResponse<Post[]>>(`/posts/${id}/related`),

  search: (query: string, page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<Post>>('/posts/search', {
      params: { q: query, page, limit },
    }),

  getByTag: (tag: string, page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<Post>>(`/posts/tags/${tag}`, {
      params: { page, limit },
    }),

  getRecommendations: (page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<Post>>('/posts/recommendations', {
      params: { page, limit },
    }),
}
