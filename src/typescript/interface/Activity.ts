import type { ActivityType } from '../types/enums'
import type { UserBasic } from './User'

export interface ActivityLike {
  type: 'like'
  createdAt: string
  post: {
    id: string
    title: string
    imageUrl: string
    user: UserBasic
  }
}

export interface ActivityFollow {
  type: 'follow'
  createdAt: string
  user: UserBasic
}

export type Activity = ActivityLike | ActivityFollow
