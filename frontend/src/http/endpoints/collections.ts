import { httpClient } from '../client'
import type { ApiResponse } from '@/typescript/interface/ApiResponse'

export interface Collection {
  id: string
  userId: string
  name: string
  description?: string
  isPublic: boolean
  createdAt: string
  thumbnailUrl?: string
  postCount?: number
}

export const collectionsApi = {
  getUserCollections: (userId: string) => 
    httpClient.get<ApiResponse<Collection[]>>(`/collections/user/${userId}`),
  
  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    httpClient.post<ApiResponse<Collection>>('/collections', data),
    
  getById: (id: string) =>
    httpClient.get<ApiResponse<Collection & { posts: any[] }>>(`/collections/${id}`),
    
  delete: (id: string) =>
    httpClient.delete<ApiResponse<void>>(`/collections/${id}`),
    
  addPost: (collectionId: string, postId: string) =>
    httpClient.post<ApiResponse<any>>(`/collections/${collectionId}/posts/${postId}`),
    
  removePost: (collectionId: string, postId: string) =>
    httpClient.delete<ApiResponse<any>>(`/collections/${collectionId}/posts/${postId}`),
}
