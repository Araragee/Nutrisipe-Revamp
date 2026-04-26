import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/http/endpoints/auth'
import { socketService } from '@/services/socket'
import type { User } from '@/typescript/interface/User'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN' || (user.value as any)?.is_admin || false)

  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.login({ email, password })
      token.value = response.data.data.token
      user.value = response.data.data.user
      localStorage.setItem('auth_token', response.data.data.token)

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
      const { user: userData, token: authToken } = response.data.data || response.data

      user.value = userData
      token.value = authToken
      localStorage.setItem('auth_token', authToken)

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
      const { user: userData, token: authToken } = response.data.data

      user.value = userData
      token.value = authToken
      localStorage.setItem('auth_token', authToken)

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
      token.value = response.data.data.token
      user.value = response.data.data.user
      localStorage.setItem('auth_token', response.data.data.token)

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
      if (token.value) {
        await authApi.logout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('auth_token')
      socketService.disconnect()
    }
  }

  async function logoutAll() {
    try {
      if (token.value) {
        await authApi.logoutAll()
      }
    } catch (err) {
      console.error('Logout all error:', err)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('auth_token')
      socketService.disconnect()
    }
  }

  async function fetchUser() {
    if (!token.value) {
      isInitialized.value = true
      return
    }
    
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
        logout()
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
    token,
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
