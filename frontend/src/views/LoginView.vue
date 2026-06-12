<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseIcons from '@/components/base/BaseIcons.vue'
import BrandMeshBackground from '@/components/common/BrandMeshBackground.vue'

const FLOAT_CARDS = [
  { title: 'Quinoa Buddha Bowl', author: '@healthyvibes', tint: 'bg-orange-soft', kcal: 420, protein: 32, offset: '', delay: '0s' },
  { title: 'Pesto Pasta Delight', author: '@pastachef', tint: 'bg-amber-100 dark:bg-amber-400/10', kcal: 540, protein: 18, offset: 'translate-x-8', delay: '0.8s' },
  { title: 'Berry Smoothie Bowl', author: '@smoothiequeen', tint: 'bg-pink-100 dark:bg-pink-400/10', kcal: 310, protein: 12, offset: '', delay: '1.6s' },
] as const

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)
const showPassword = ref(false)

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
  <div class="auth-root min-h-screen flex bg-background dark:bg-background overflow-hidden">

    <!-- ── Left: brand panel ── -->
    <div class="auth-hero hidden lg:flex lg:w-[52%] xl:w-[58%] relative flex-col overflow-hidden">
      <BrandMeshBackground variant="warm" :intensity="0.7" class="!absolute inset-0" />
      <div class="relative z-10 flex flex-col h-full p-12 xl:p-16">

        <!-- Logo -->
        <div class="flex items-center gap-3">
          <span class="logo-mark w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 shadow-lg">
            <svg viewBox="0 0 22 28" fill="none" class="w-[22px] h-[26px]">
              <path class="n-path" d="M 4,25 C 4,18 4,9 5,4 C 9,10 13,19 17,25 C 17,17 17,9 18,4"
                stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="font-montserrat font-black text-xl tracking-tight text-text dark:text-text">
            Nutri<span class="text-orange">sipe</span>
          </span>
        </div>

        <!-- Headline -->
        <div class="mt-auto mb-auto pt-16">
          <h1 class="font-montserrat font-black text-5xl xl:text-6xl tracking-tight leading-[1.0] text-text dark:text-text mb-6">
            Cook.<br />Share.<br /><span class="text-orange">Inspire.</span>
          </h1>
          <p class="text-text-muted dark:text-text-muted text-lg max-w-sm leading-relaxed">
            Your personal space for recipes, meal plans, and the food community that gets you.
          </p>
        </div>

        <!-- Social proof strip -->
        <div class="mt-auto flex items-center gap-6 pt-10 border-t border-border">
          <div>
            <p class="font-montserrat font-extrabold text-2xl text-text dark:text-text">12K+</p>
            <p class="text-xs text-text-dim dark:text-text-dim font-medium mt-0.5">Recipes shared</p>
          </div>
          <div class="h-8 w-px bg-border"></div>
          <div>
            <p class="font-montserrat font-extrabold text-2xl text-text dark:text-text">4.8K</p>
            <p class="text-xs text-text-dim dark:text-text-dim font-medium mt-0.5">Active creators</p>
          </div>
          <div class="h-8 w-px bg-border"></div>
          <div>
            <p class="font-montserrat font-extrabold text-2xl text-text dark:text-text">98%</p>
            <p class="text-xs text-text-dim dark:text-text-dim font-medium mt-0.5">Love the app</p>
          </div>
        </div>
      </div>

      <!-- Floating recipe cards decoration -->
      <div class="absolute right-[-40px] top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-90 pointer-events-none">
        <div
          v-for="card in FLOAT_CARDS"
          :key="card.title"
          :class="['recipe-float-card w-52 bg-surface dark:bg-surface border border-border rounded-2xl p-3 shadow-modal', card.offset]"
          :style="{ animationDelay: card.delay }"
        >
          <div :class="['w-full h-24 rounded-xl mb-2.5 flex items-center justify-center', card.tint]">
            <BaseIcons name="photo" size="lg" class="text-text-dim opacity-50" />
          </div>
          <div class="flex flex-wrap gap-1 mb-1.5">
            <span class="px-2 py-0.5 rounded-full bg-orange-soft text-orange-deep dark:text-orange-light text-[10px] font-semibold tabular-nums">{{ card.kcal }} kcal</span>
            <span class="px-2 py-0.5 rounded-full bg-orange-soft text-orange-deep dark:text-orange-light text-[10px] font-medium tabular-nums">{{ card.protein }}P</span>
          </div>
          <p class="font-semibold text-xs text-text dark:text-text truncate">{{ card.title }}</p>
          <p class="text-[10px] text-text-dim dark:text-text-dim mt-0.5">by {{ card.author }}</p>
        </div>
      </div>
    </div>

    <!-- ── Right: form panel ── -->
    <div class="form-panel flex-1 flex flex-col justify-center items-center px-6 py-12 relative">
      <BrandMeshBackground variant="warm" :intensity="0.25" class="!absolute inset-0 lg:hidden" />

      <div class="relative z-10 w-full max-w-[400px]">

        <!-- Mobile logo -->
        <div class="flex items-center gap-2.5 mb-10 lg:hidden">
          <span class="logo-mark w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 22 28" fill="none" class="w-[20px] h-[24px]">
              <path class="n-path" d="M 4,25 C 4,18 4,9 5,4 C 9,10 13,19 17,25 C 17,17 17,9 18,4"
                stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="font-montserrat font-black text-lg tracking-tight text-text dark:text-text">
            Nutri<span class="text-orange">sipe</span>
          </span>
        </div>

        <h2 class="font-montserrat font-bold text-[28px] tracking-tight mb-1 text-text dark:text-text">Welcome back</h2>
        <p class="text-sm text-text-muted dark:text-text-muted mb-8">Sign in to your account to continue.</p>

        <!-- Error -->
        <Transition name="slide-down">
          <div v-if="error" class="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>
        </Transition>

        <!-- Social buttons -->
        <div class="flex gap-3 mb-6">
          <button
            @click="handleGoogleLogin"
            :disabled="isLoading"
            class="social-btn flex-1 flex items-center justify-center gap-2 bg-surface dark:bg-surface border border-border rounded-btn py-2.5 text-sm font-semibold text-text dark:text-text transition-all hover:border-orange hover:shadow-card-hover disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            disabled
            class="social-btn flex-1 flex items-center justify-center gap-2 bg-surface dark:bg-surface border border-border rounded-btn py-2.5 text-sm font-semibold text-text-dim opacity-40 cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple
          </button>
        </div>

        <div class="flex items-center gap-3 mb-6">
          <div class="flex-1 h-px bg-border"></div>
          <span class="text-xs text-text-dim dark:text-text-dim whitespace-nowrap font-medium">or continue with email</span>
          <div class="flex-1 h-px bg-border"></div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn px-4 py-3 text-[15px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-all"
            />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-semibold text-text-muted dark:text-text-muted">Password</label>
              <button type="button" class="text-xs text-orange font-semibold hover:underline">Forgot password?</button>
            </div>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn px-4 py-3 pr-11 text-[15px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-all"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-primary w-full py-3.5 mt-2 rounded-btn" :disabled="isLoading">
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Signing in…
            </span>
            <span v-else>Sign in</span>
          </button>
        </form>

        <p class="text-center mt-6 text-[13px] text-text-dim dark:text-text-dim">
          Don't have an account?
          <router-link to="/register" class="text-orange font-semibold hover:underline ml-1">Sign up free</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-root {
  min-height: 100dvh;
}

.logo-mark {
  background: var(--orange);
}

.n-path {
  stroke-dasharray: 72;
  stroke-dashoffset: 72;
  animation: drawN 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
}

@keyframes drawN {
  from { stroke-dashoffset: 72; }
  to { stroke-dashoffset: 0; }
}

.recipe-float-card {
  animation: floatCard 6s ease-in-out infinite;
}

@keyframes floatCard {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.social-btn {
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}
.social-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}
</style>
