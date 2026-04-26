import type { User } from './User'

export interface Comment {
  id: string
  userId: string
  postId: string
  content: string
  parentId?: string | null
  createdAt: string
  updatedAt: string
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  _count?: {
    replies: number
  }
}
