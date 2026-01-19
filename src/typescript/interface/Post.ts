import type { PostCategory } from '../types/enums'
import type { UserBasic } from './User'
import type { Recipe } from './Recipe'

export interface Post {
  id: string
  userId: string
  title: string
  description: string | null
  imageUrl: string
  category: PostCategory
  tags: string[]
  likeCount: number
  saveCount: number
  commentCount: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
  user: UserBasic
  isLiked?: boolean
  isSaved?: boolean
  recipe?: Recipe
}
