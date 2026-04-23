import apiClient from './client'
import type { AuthResponse, User } from '@/types'

export const authApi = {
  googleLogin(googleData: {
    google_id: string
    name: string
    email: string
    image?: string
  }) {
    return apiClient.post<AuthResponse>('/auth/google', googleData)
  },

  getMe() {
    return apiClient.get<{ data: User }>('/auth/me')
  },

  logout() {
    return apiClient.post('/auth/logout')
  },

  logoutAll() {
    return apiClient.post('/auth/logout-all')
  },

  devLogin(email: string) {
    return apiClient.post<AuthResponse>('/auth/dev-login', { email })
  },
}
