import { httpClient } from '../client'
import type { Comment } from '@/typescript/interface/Comment'
import type { PaginatedResponse, ApiResponse } from '@/typescript/interface/ApiResponse'

export const commentsApi = {
  getByPost: (postId: string, page = 1, limit = 20, parentId?: string) =>
    httpClient.get<PaginatedResponse<Comment>>(`/comments/post/${postId}`, {
      params: { page, limit, parentId },
    }),

  create: (data: { postId: string; content: string; parentId?: string }) =>
    httpClient.post<ApiResponse<Comment>>('/comments', data),

  update: (id: string, content: string) =>
    httpClient.put<ApiResponse<Comment>>(`/comments/${id}`, { content }),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<void>>(`/comments/${id}`),
}
