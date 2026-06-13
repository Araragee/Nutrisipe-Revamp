export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  followerCount: number
  followingCount: number
  createdAt: string
  role?: 'USER' | 'MODERATOR' | 'ADMIN'
  isFollowing?: boolean
  onboardingCompleted?: boolean
  settings?: {
    darkMode: boolean
  }
  preferences?: UserPreference
}

export interface UserPreference {
  id: string
  userId: string
  cuisines: string
  allergies: string
  dietary: string
  createdAt: string
  updatedAt: string
}

export interface UserBasic {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  followerCount?: number
  isFollowing?: boolean
}
