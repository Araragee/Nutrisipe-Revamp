import apiClient from './client'
import type { Comment } from '@/types'

export const commentsApi = {
  getComments(recipeId: number) {
    return apiClient.get<{ data: Comment[] }>(`/recipes/${recipeId}/comments`)
  },

  createComment(recipeId: number, comment: string) {
    return apiClient.post<{ data: Comment }>(`/recipes/${recipeId}/comments`, { comment })
  },

  deleteComment(id: number) {
    return apiClient.delete(`/comments/${id}`)
  },
}
