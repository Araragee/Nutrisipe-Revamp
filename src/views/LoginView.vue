<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
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
    router.push('/')
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
        class="mb-6 p-4 bg-error-light dark:bg-error-dark text-error-base rounded-lg"
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
