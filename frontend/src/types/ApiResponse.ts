export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AuthResponse {
  user: {
    id: string
    username: string
    email: string
    displayName: string
    avatarUrl: string | null
    bio: string | null
    followerCount: number
    followingCount: number
    createdAt: string
  }
  token: string
}
