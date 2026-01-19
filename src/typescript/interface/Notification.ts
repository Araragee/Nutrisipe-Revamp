import type { User } from './User'
import type { Post } from './Post'

export interface Notification {
  id: string
  userId: string
  actorId: string
  type: 'like' | 'comment' | 'follow'
  postId?: string
  commentId?: string
  isRead: boolean
  createdAt: string
  actor: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
  post?: Pick<Post, 'id' | 'title' | 'imageUrl'>
}
