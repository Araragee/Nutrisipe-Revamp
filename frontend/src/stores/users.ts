import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi } from '@/http/endpoints/users'
import { socialApi } from '@/http/endpoints/social'
import type { User } from '@/typescript/interface/User'

export const useUsersStore = defineStore('users', () => {
  const suggestedUsers = ref<User[]>([])
  const userCache = ref<Map<string, User>>(new Map())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSuggestions(limit = 15) {
    isLoading.value = true
    error.value = null

    try {
      const response = await usersApi.getSuggestions(limit)
      suggestedUsers.value = response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch suggestions'
    } finally {
      isLoading.value = false
    }
  }

  async function getUserById(userId: string) {
    if (userCache.value.has(userId)) {
      return userCache.value.get(userId)!
    }

    try {
      const response = await usersApi.getById(userId)
      const user = response.data.data
      userCache.value.set(userId, user)
      return user
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch user'
      throw err
    }
  }

  async function followUser(userId: string) {
    try {
      await socialApi.followUser(userId)

      const userInSuggestions = suggestedUsers.value.find((u) => u.id === userId)
      if (userInSuggestions) {
        userInSuggestions.isFollowing = true
        userInSuggestions.followerCount++
      }

      const cachedUser = userCache.value.get(userId)
      if (cachedUser) {
        cachedUser.isFollowing = true
        cachedUser.followerCount++
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to follow user'
      throw err
    }
  }

  async function unfollowUser(userId: string) {
    try {
      await socialApi.unfollowUser(userId)

      const userInSuggestions = suggestedUsers.value.find((u) => u.id === userId)
      if (userInSuggestions) {
        userInSuggestions.isFollowing = false
        userInSuggestions.followerCount--
      }

      const cachedUser = userCache.value.get(userId)
      if (cachedUser) {
        cachedUser.isFollowing = false
        cachedUser.followerCount--
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to unfollow user'
      throw err
    }
  }

  return {
    suggestedUsers,
    userCache,
    isLoading,
    error,
    fetchSuggestions,
    getUserById,
    followUser,
    unfollowUser,
  }
})
