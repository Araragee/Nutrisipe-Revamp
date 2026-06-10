import { httpClient } from '../client'
import type { ApiResponse } from '@/typescript/interface/ApiResponse'

export interface StoryItem {
  id: string
  imageUrl: string
  caption: string | null
  postId: string | null
  views: number
  createdAt: string
  expiresAt: string
}

export interface StoryGroup {
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  stories: StoryItem[]
}

export const storiesApi = {
  feed: () => httpClient.get<ApiResponse<StoryGroup[]>>('/stories/feed'),

  create: (data: { imageUrl: string; caption?: string; postId?: string }) =>
    httpClient.post<ApiResponse<any>>('/stories', data),

  view: (id: string) => httpClient.post<ApiResponse<void>>(`/stories/${id}/view`),

  delete: (id: string) => httpClient.delete<ApiResponse<void>>(`/stories/${id}`),
}
