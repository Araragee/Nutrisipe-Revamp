import { httpClient } from '../client'
import type { ApiResponse } from '@/typescript/interface/ApiResponse'

export interface UserPreferences {
  cuisines: string[]
  allergies: string[]
  dietary: string[]
  notifications: Record<string, boolean>
  privacy: Record<string, boolean>
}

export const preferencesApi = {
  get: () => httpClient.get<ApiResponse<UserPreferences>>('/users/preferences'),
  update: (data: Partial<UserPreferences>) =>
    httpClient.post<ApiResponse<UserPreferences>>('/users/preferences', data),
}
