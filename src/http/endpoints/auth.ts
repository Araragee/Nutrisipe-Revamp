import { httpClient } from '../client'
import type { ApiResponse, AuthResponse } from '@/typescript/interface/ApiResponse'
import type { User } from '@/typescript/interface/User'

export const authApi = {
  register: (data: { username: string; email: string; password: string; displayName: string }) =>
    httpClient.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    httpClient.post<ApiResponse<AuthResponse>>('/auth/login', data),

  me: () => httpClient.get<ApiResponse<User>>('/auth/me'),
}
