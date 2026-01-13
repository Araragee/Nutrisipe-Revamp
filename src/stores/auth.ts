import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/http/endpoints/auth'
import type { User } from '@/typescript/interface/User'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.login({ email, password })
      token.value = response.data.data.token
      user.value = response.data.data.user
      localStorage.setItem('auth_token', response.data.data.token)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
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
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }

  async function fetchCurrentUser() {
    if (!token.value) return

    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.me()
      user.value = response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch user'
      logout()
    } finally {
      isLoading.value = false
    }
  }

  function setUser(updatedUser: User) {
    user.value = updatedUser
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    fetchCurrentUser,
    setUser,
  }
})
