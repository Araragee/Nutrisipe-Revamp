import { httpClient } from '../client'
import type { ApiResponse } from '@/typescript/interface/ApiResponse'

export const socialApi = {
  followUser: (userId: string) =>
    httpClient.post<ApiResponse<void>>(`/social/follow/${userId}`),

  unfollowUser: (userId: string) =>
    httpClient.delete<ApiResponse<void>>(`/social/follow/${userId}`),

  likePost: (postId: string) =>
    httpClient.post<ApiResponse<{ likeCount: number }>>(`/social/like/${postId}`),

  unlikePost: (postId: string) =>
    httpClient.delete<ApiResponse<{ likeCount: number }>>(`/social/like/${postId}`),

  savePost: (postId: string) =>
    httpClient.post<ApiResponse<{ saveCount: number }>>(`/social/save/${postId}`),

  unsavePost: (postId: string) =>
    httpClient.delete<ApiResponse<{ saveCount: number }>>(`/social/save/${postId}`),
}
