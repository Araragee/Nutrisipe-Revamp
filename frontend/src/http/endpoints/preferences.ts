import { httpClient } from '../client'
import type { ApiResponse } from '@/typescript/interface/ApiResponse'

export interface UserPreferences {
  cuisines: string[]
  allergies: string[]
  dietary: string[]
}

export const preferencesApi = {
  get: () => httpClient.get<ApiResponse<UserPreferences>>('/users/preferences'),
  update: (data: Partial<UserPreferences>) => 
    httpClient.post<ApiResponse<UserPreferences>>('/users/preferences', data),
}
