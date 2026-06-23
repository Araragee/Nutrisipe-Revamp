import { logger } from '@/utils/logger'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/http/endpoints/auth'
import { socketService } from '@/services/socket'
import type { User } from '@/typescript/interface/User'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN' || false)

  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.login({ email, password })
      user.value = response.data.data.user

      // Initialize socket connection
      socketService.connect()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loginWithGoogle(googleData: {
    google_id: string
    name: string
    email: string
    image?: string
  }) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.googleLogin(googleData)
      const userData = response.data.data.user

      user.value = userData

      // Initialize socket connection
      socketService.connect()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function loginWithDev(email: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.devLogin({ email })
      const userData = response.data.data.user

      user.value = userData

      // Initialize socket connection
      socketService.connect()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Dev login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function register(
    username: string,
    email: string,
    password: string,
    displayName: string
  ) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.register({ username, email, password, displayName })
      user.value = response.data.data.user

      // Initialize socket connection
      socketService.connect()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      if (user.value) {
        await authApi.logout()
      }
    } catch (err) {
      logger.error('Logout error:', err)
    } finally {
      user.value = null
      socketService.disconnect()
    }
  }

  async function logoutAll() {
    try {
      if (user.value) {
        await authApi.logoutAll()
      }
    } catch (err) {
      logger.error('Logout all error:', err)
    } finally {
      user.value = null
      socketService.disconnect()
    }
  }

  async function fetchUser() {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.me()
      user.value = response.data.data

      // Initialize socket connection if user is authenticated
      if (user.value) {
        socketService.connect()
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        user.value = null
        socketService.disconnect()
      }
      error.value = err.response?.data?.message || 'Failed to fetch user'
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  // Alias for compatibility
  const fetchCurrentUser = fetchUser

  function setUser(updatedUser: User) {
    user.value = updatedUser
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    isInitialized,
    error,
    login,
    loginWithGoogle,
    loginWithDev,
    register,
    logout,
    logoutAll,
    fetchUser,
    fetchCurrentUser,
    setUser,
  }
})
