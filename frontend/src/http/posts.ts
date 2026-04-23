import { httpClient } from './client'
import type { Post } from '@/typescript/interface/Post'

export interface CreatePostData {
  title: string
  description?: string
  imageUrl: string
  category: string
  tags: string[]
  isPublic?: boolean
}

export async function createPost(data: CreatePostData) {
  const response = await httpClient.post<{ success: boolean; data: Post }>('/posts', data)
  return response.data.data
}

export async function updatePost(postId: string, data: Partial<CreatePostData>) {
  const response = await httpClient.put<{ success: boolean; data: Post }>(`/posts/${postId}`, data)
  return response.data.data
}

export async function deletePost(postId: string) {
  const response = await httpClient.delete<{ success: boolean; message: string }>(`/posts/${postId}`)
  return response.data
}

export async function searchPosts(query: string, category?: string, page: number = 1) {
  const params: any = { q: query, page, limit: 20 }
  if (category) params.category = category

  const response = await httpClient.get<{
    success: boolean
    data: Post[]
    pagination: any
  }>('/posts/search', { params })

  return response.data
}

export async function getPostById(postId: string) {
  const response = await httpClient.get<{ success: boolean; data: Post }>(`/posts/${postId}`)
  return response.data.data
}
