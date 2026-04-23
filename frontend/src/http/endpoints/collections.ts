import { httpClient } from '../client'
import type { ApiResponse } from '@/types'

interface CreateCollectionData {
  name: string
  description?: string
  isPublic?: boolean
}

export const collectionsApi = {
  getMyCollections: () =>
    httpClient.get<ApiResponse<any[]>>('/collections/my-collections'),

  getUserCollections: (userId: string) =>
    httpClient.get<ApiResponse<any[]>>(`/collections/user/${userId}`),

  getCollection: (id: string, params?: { page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<any>>(`/collections/${id}`, { params }),

  createCollection: (data: CreateCollectionData) =>
    httpClient.post<ApiResponse<any>>('/collections', data),

  updateCollection: (id: string, data: Partial<CreateCollectionData>) =>
    httpClient.put<ApiResponse<any>>(`/collections/${id}`, data),

  deleteCollection: (id: string) =>
    httpClient.delete(`/collections/${id}`),

  addPostToCollection: (collectionId: string, postId: string) =>
    httpClient.post(`/collections/${collectionId}/posts/${postId}`),

  removePostFromCollection: (collectionId: string, postId: string) =>
    httpClient.delete(`/collections/${collectionId}/posts/${postId}`),
}
