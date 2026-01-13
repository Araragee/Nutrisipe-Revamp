import type { User } from './User'

export interface Comment {
  id: string
  userId: string
  postId: string
  content: string
  createdAt: string
  updatedAt: string
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}
