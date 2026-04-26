export interface Activity {
  id: string
  type: 'comment' | 'like' | 'follow' | 'rating'
  date: string
  data: {
    content?: string
    postTitle?: string
    postId?: string
    username?: string
    displayName?: string
    userId?: string
    score?: number
  }
}
