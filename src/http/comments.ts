import { httpClient } from './client'
import type { Comment } from '@/typescript/interface/Comment'

interface CreateCommentData {
  postId: string
  content: string
}

interface CommentsResponse {
  success: boolean
  data: Comment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function createComment(data: CreateCommentData): Promise<Comment> {
  const response = await httpClient.post<{ success: boolean; data: Comment }>('/comments', data)
  return response.data.data
}

export async function getCommentsByPost(
  postId: string,
  page: number = 1,
  limit: number = 20
): Promise<CommentsResponse> {
  const response = await httpClient.get<CommentsResponse>(`/comments/post/${postId}`, {
    params: { page, limit },
  })
  return response.data
}

export async function deleteComment(commentId: string): Promise<void> {
  await httpClient.delete(`/comments/${commentId}`)
}

export async function updateComment(commentId: string, content: string): Promise<Comment> {
  const response = await httpClient.put<{ success: boolean; data: Comment }>(
    `/comments/${commentId}`,
    { content }
  )
  return response.data.data
}
