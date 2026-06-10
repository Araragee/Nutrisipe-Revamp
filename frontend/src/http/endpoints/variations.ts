import { httpClient } from '../client'
import type { ApiResponse, PaginatedResponse } from '@/typescript/interface/ApiResponse'
import type { Post } from '@/typescript/interface/Post'

export interface Variation {
  id: string
  originalPostId: string
  variationPostId: string
  userId: string
  description?: string
  createdAt: string
  variationPost: Post
}

export interface VariationChainItem {
  post: Post
  variation?: any
}

export const variationsApi = {
  fork: (postId: string, data: any) =>
    httpClient.post<ApiResponse<any>>(`/variations/${postId}/fork`, data),
    
  getVariations: (postId: string, params?: any) =>
    httpClient.get<PaginatedResponse<Variation>>(`/variations/${postId}/variations`, { params }),
    
  getOriginal: (postId: string) =>
    httpClient.get<ApiResponse<{ originalPost: Post; variation: any }>>(`/variations/${postId}/original`),
    
  getChain: (postId: string) =>
    httpClient.get<ApiResponse<{ chain: any[]; depth: number }>>(`/variations/${postId}/chain`),

  delete: (variationId: string) =>
    httpClient.delete<ApiResponse<void>>(`/variations/${variationId}`),
}
