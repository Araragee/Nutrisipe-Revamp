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
  isFollowing?: boolean
}

export interface UserBasic {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  followerCount?: number
}
