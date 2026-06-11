<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BrandMeshBackground from '@/components/common/BrandMeshBackground.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)

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

async function handleGoogleLogin() {
  // Simplified Google login simulation since vue3-google-login integration
  // normally happens via a specialized button component or useGoogleLogin hook.
  // For now, we'll simulate the call to the backend.
  isLoading.value = true
  error.value = null
  try {
    const success = await authStore.loginWithGoogle({
      email: 'google-user@example.com',
      name: 'Google User',
      google_id: '123456789'
    })
    if (success) {
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    }
  } catch (err: any) {
    error.value = 'Google login failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page relative min-h-screen flex items-center justify-center bg-background dark:bg-background px-4 overflow-hidden">
    <BrandMeshBackground variant="warm" :intensity="0.5" />

    <div class="auth-card relative z-10 bg-surface dark:bg-surface border border-border rounded-card p-10 px-9 w-[420px] shadow-card">
      <div class="auth-logo font-montserrat font-extrabold text-xl mb-8 text-text dark:text-text">Nutri<span class="text-orange">sipe</span></div>
      <h2 class="auth-title font-montserrat font-bold text-[26px] tracking-tight mb-1.5 text-text dark:text-text">Welcome back</h2>
      <p class="auth-sub text-sm text-text-muted dark:text-text-muted mb-8">Sign in to your Nutrisipe account.</p>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-xs font-semibold">
        {{ error }}
      </div>

      <div class="social-btns flex gap-3 mb-6">
        <button @click="handleGoogleLogin" class="social-btn flex-1 flex items-center justify-center gap-2.5 bg-surface dark:bg-surface border border-border rounded-btn p-3 cursor-pointer text-sm font-medium text-text dark:text-text transition-colors hover:border-orange">
          <span class="font-serif font-bold text-base text-[#4285F4]">G</span> Google
        </button>
        <button class="social-btn flex-1 flex items-center justify-center gap-2.5 bg-surface dark:bg-surface border border-border rounded-btn p-3 text-sm font-medium text-text dark:text-text opacity-50 cursor-not-allowed" disabled>
          Apple
        </button>
      </div>

      <div class="divider flex items-center gap-3 my-5">
        <div class="divider-line flex-1 h-px bg-border"></div>
        <span class="divider-txt text-xs text-text-dim dark:text-text-dim whitespace-nowrap">or continue with email</span>
        <div class="divider-line flex-1 h-px bg-border"></div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="field">
          <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-2">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn p-3 px-4 text-[15px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-colors" />
        </div>
        <div class="field">
          <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-2">Password</label>
          <input v-model="password" type="password" placeholder="••••••••" class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn p-3 px-4 text-[15px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-colors" />
        </div>

        <button type="submit" class="btn-primary w-full py-3.5 mt-2" :disabled="isLoading">
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="auth-footer text-center mt-5 text-[13px] text-text-dim dark:text-text-dim">
        Don't have an account? <router-link to="/register" class="text-orange font-semibold cursor-pointer hover:underline">Sign up</router-link>
      </p>
    </div>
  </div>
</template>
