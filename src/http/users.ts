import { httpClient } from './client'
import type { User } from '@/typescript/interface/User'

export interface UpdateProfileData {
  displayName?: string
  bio?: string
  avatarUrl?: string
}

export async function updateProfile(data: UpdateProfileData) {
  const response = await httpClient.put<{ success: boolean; data: User }>('/users/profile', data)
  return response.data.data
}

export async function getUserById(userId: string) {
  const response = await httpClient.get<{ success: boolean; data: User }>(`/users/${userId}`)
  return response.data.data
}
