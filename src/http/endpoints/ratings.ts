import { httpClient } from '../client'

export interface Rating {
  id: string
  userId: string
  postId: string
  rating: number
  review?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  }
}

export interface RatingWithPost extends Rating {
  post: {
    id: string
    title: string
    imageUrl: string
    category: string
    user: {
      id: string
      username: string
      displayName: string
    }
  }
}

export interface PostRatingsResponse {
  ratings: Rating[]
  averageRating: number
  totalRatings: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UserRatingsResponse {
  ratings: RatingWithPost[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const ratingsApi = {
  // Create or update rating
  async createOrUpdateRating(postId: string, rating: number, review?: string) {
    const response = await httpClient.post('/ratings', {
      postId,
      rating,
      review
    })
    return response.data
  },

  // Get ratings for a post
  async getPostRatings(
    postId: string,
    page = 1,
    limit = 20,
    sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' = 'newest'
  ): Promise<PostRatingsResponse> {
    const response = await httpClient.get(`/ratings/post/${postId}`, {
      params: { page, limit, sortBy }
    })
    return response.data.data
  },

  // Get user's ratings
  async getUserRatings(userId: string, page = 1, limit = 20): Promise<UserRatingsResponse> {
    const response = await httpClient.get(`/ratings/user/${userId}`, {
      params: { page, limit }
    })
    return response.data.data
  },

  // Check if user rated a post
  async checkUserRating(postId: string): Promise<Rating | null> {
    try {
      const response = await httpClient.get(`/ratings/check/${postId}`)
      return response.data.data
    } catch (error) {
      return null
    }
  },

  // Delete rating
  async deleteRating(ratingId: string) {
    const response = await httpClient.delete(`/ratings/${ratingId}`)
    return response.data
  }
}
