import { httpClient } from '../client'
import type { Post } from '@/typescript/interface/Post'
import type { PaginatedResponse, ApiResponse } from '@/typescript/interface/ApiResponse'

export const postsApi = {
  getFeed: (page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<Post>>('/posts/feed', {
      params: { page, limit },
    }),

  getById: (id: string) => httpClient.get<ApiResponse<Post>>(`/posts/${id}`),

  getByUser: (userId: string, page = 1, limit = 20) =>
    httpClient.get<PaginatedResponse<Post>>(`/posts/user/${userId}`, {
      params: { page, limit },
    }),
}
