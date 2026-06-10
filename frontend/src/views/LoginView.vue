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

async function loginWithDemo(demoEmail: string) {
  isLoading.value = true
  error.value = null
  try {
    const success = await authStore.loginWithDev(demoEmail)
    if (success) {
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    }
  } catch (err: any) {
    error.value = 'Demo login failed'
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
  <div class="auth-page h-screen flex items-center justify-center relative overflow-hidden bg-background">
    <BrandMeshBackground variant="sunset" :intensity="0.9" />

    <div class="auth-card relative z-[2] bg-glass backdrop-blur-2xl rounded-3xl p-12 px-11 w-[420px] shadow-[0_24px_64px_rgba(20,10,0,0.18)] dark:bg-[rgba(24,22,30,0.95)]">
      <div class="auth-logo font-montserrat font-extrabold text-xl mb-8">Nutri<span class="text-orange">sipe</span></div>
      <h2 class="auth-title font-montserrat font-extrabold text-[28px] tracking-tight mb-1.5">Welcome back</h2>
      <p class="auth-sub text-sm text-text-muted mb-8">Sign in to your Nutrisipe account.</p>

      <!-- Error Message -->
      <div v-if="error" class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-shake">
        {{ error }}
      </div>

      <div class="social-btns flex gap-3 mb-6">
        <button @click="handleGoogleLogin" class="social-btn flex-1 flex items-center justify-center gap-2.5 bg-surface border-1.5 border-[var(--glass-border)] rounded-[14px] p-3.5 cursor-pointer text-sm font-medium transition-all hover:border-orange hover:shadow-[0_4px_16px_var(--orange-glow)] dark:bg-[rgb(30,28,38)]">
          <span class="font-serif font-bold text-base text-[#4285F4]">G</span> Google
        </button>
        <button class="social-btn flex-1 flex items-center justify-center gap-2.5 bg-surface border-1.5 border-[var(--glass-border)] rounded-[14px] p-3.5 cursor-pointer text-sm font-medium transition-all opacity-50 cursor-not-allowed dark:bg-[rgb(30,28,38)]">
          <span class="text-base">🍎</span> Apple
        </button>
      </div>

      <div class="divider flex items-center gap-3 my-5">
        <div class="divider-line flex-1 h-px bg-[var(--glass-border)]"></div>
        <span class="divider-txt text-xs text-text-dim whitespace-nowrap">or continue with email</span>
        <div class="divider-line flex-1 h-px bg-[var(--glass-border)]"></div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="field">
          <label class="block text-xs font-bold text-text-muted tracking-widest uppercase mb-2">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" class="w-full bg-surface border-1.5 border-[var(--glass-border)] rounded-[14px] p-3.5 px-4.5 text-[15px] outline-none focus:border-orange transition-all dark:bg-[rgb(30,28,38)]" />
        </div>
        <div class="field">
          <label class="block text-xs font-bold text-text-muted tracking-widest uppercase mb-2">Password</label>
          <input v-model="password" type="password" placeholder="••••••••" class="w-full bg-surface border-1.5 border-[var(--glass-border)] rounded-[14px] p-3.5 px-4.5 text-[15px] outline-none focus:border-orange transition-all dark:bg-[rgb(30,28,38)]" />
        </div>

        <button type="submit" class="btn-primary w-full py-4 mt-2" :disabled="isLoading">
          {{ isLoading ? 'Signing in...' : 'Sign in →' }}
        </button>
      </form>

      <p class="auth-footer text-center mt-5 text-[13px] text-text-dim">
        Don't have an account? <router-link to="/register" class="text-orange font-bold cursor-pointer hover:underline">Sign up</router-link>
      </p>
    </div>
  </div>
</template>
