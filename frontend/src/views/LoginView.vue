<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/base/BaseButton.vue'
import { decodeCredential } from 'vue3-google-login'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)

const demoAccounts = [
  { email: 'jackroberts@nutrisipe.com', label: 'Demo 1' },
  { email: 'wyattmitchell1@nutrisipe.com', label: 'Demo 2' },
  { email: 'wyattmitchell2@nutrisipe.com', label: 'Demo 3' },
]

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await authStore.login(email.value, password.value)
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}

function loginWithDemo(demoEmail: string) {
  email.value = demoEmail
  password.value = 'password123'
  handleLogin()
}

const handleGoogleLogin = async (response: any) => {
  isLoading.value = true
  error.value = null

  try {
    const decoded: any = decodeCredential(response.credential)

    const success = await authStore.loginWithGoogle({
      google_id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      image: decoded.picture,
    })

    if (success) {
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    } else {
      error.value = authStore.error || 'Login failed'
    }
  } catch (err: any) {
    error.value = err.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}

const handleGoogleError = () => {
  error.value = 'Google login failed. Please try again.'
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary-base mb-2">Nutrisipe</h1>
        <p class="text-gray-600 dark:text-gray-400">Sign in to your account</p>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
      >
        {{ error }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="••••••••"
          />
        </div>

        <BaseButton
          type="submit"
          variant="primary"
          size="base"
          alignment="center"
          class="w-full"
          :loading="isLoading"
        >
          Sign In
        </BaseButton>
      </form>

      <div class="relative my-8">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
        </div>
      </div>

      <!-- Google Login -->
      <div class="flex justify-center">
        <GoogleLogin
          :callback="handleGoogleLogin"
          :error="handleGoogleError"
          prompt
        >
          <template #default="{ handleClick }">
            <button
              @click="handleClick"
              :disabled="isLoading"
              class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span class="font-medium text-gray-700 dark:text-gray-200">
                Google
              </span>
            </button>
          </template>
        </GoogleLogin>
      </div>

      <!-- Demo Accounts -->
      <div class="mt-8">
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
          Quick demo login (password: password123)
        </p>
        <div class="grid grid-cols-3 gap-2">
          <BaseButton
            v-for="demo in demoAccounts"
            :key="demo.email"
            variant="primaryOutlined"
            size="sm"
            alignment="center"
            @click="loginWithDemo(demo.email)"
          >
            {{ demo.label }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
