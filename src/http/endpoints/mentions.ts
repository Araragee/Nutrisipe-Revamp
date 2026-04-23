import { apiClient } from '../client'

export interface MentionUser {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
}

export interface Mention {
  id: string
  mentionedById: string
  mentionedId: string
  type: 'POST' | 'COMMENT'
  postId?: string
  commentId?: string
  createdAt: string
  mentionedBy: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
  comment?: {
    id: string
    content: string
    createdAt: string
    postId: string
  }
}

export interface MentionsResponse {
  mentions: Mention[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface SearchUsersResponse {
  users: MentionUser[]
}

export const mentionsApi = {
  // Get all mentions for authenticated user
  async getMentions(limit = 50, offset = 0): Promise<MentionsResponse> {
    const response = await apiClient.get('/mentions', {
      params: { limit, offset }
    })
    return response.data
  },

  // Search users for @mention autocomplete
  async searchUsers(query: string): Promise<SearchUsersResponse> {
    const response = await apiClient.get('/mentions/search', {
      params: { q: query }
    })
    return response.data
  },

  // Get mentions for a specific post
  async getPostMentions(postId: string): Promise<{ mentions: Mention[] }> {
    const response = await apiClient.get(`/mentions/post/${postId}`)
    return response.data
  },

  // Get mentions for a specific comment
  async getCommentMentions(commentId: string): Promise<{ mentions: Mention[] }> {
    const response = await apiClient.get(`/mentions/comment/${commentId}`)
    return response.data
  }
}
