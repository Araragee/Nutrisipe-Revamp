<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostAuthFlow } from '@/composables/usePostAuthFlow'
import SplashScreen from '@/components/common/SplashScreen.vue'
import loginBg from '@/assets/login-bg.jpeg'

const STATS = [
  { value: '15k+', label: 'Recipes' },
  { value: '4.9', label: 'Rating' },
  { value: '100%', label: 'Organic' },
] as const

const STEPS = [
  {
    num: '01',
    title: 'Discover',
    body: 'Browse 15k+ community recipes. Filter by craving, diet, or the macros you are chasing.',
  },
  {
    num: '02',
    title: 'Cook & tweak',
    body: 'Follow clear steps, scale servings, and swap what you don\'t have — the recipe adapts with you.',
  },
  {
    num: '03',
    title: 'Share your fork',
    body: 'Publish your spin. Watch it travel, get saved, and spark the next remix.',
  },
] as const

const TESTIMONIALS = [
  {
    quote: 'I forked a carbonara five times before nailing my dairy-free version. The original cook even saved it back.',
    name: 'Maya R.',
    role: 'Home cook',
  },
  {
    quote: 'The macro breakdown per serving sold me instantly. I plan my entire prep week without leaving the feed.',
    name: 'Daniel O.',
    role: 'Meal prepper',
  },
  {
    quote: 'Posted my lola\'s adobo and watched people remix it across the world. Unreal feeling.',
    name: 'Carlo V.',
    role: 'Recipe creator',
  },
] as const

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { runPostAuthFlow } = usePostAuthFlow()

const email = ref('')
const password = ref('')
const username = ref('')
const displayName = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)
const showSplash = ref(false)
const showPassword = ref(false)
const mode = ref<'signin' | 'signup'>('signin')

const pageRef = ref<HTMLElement | null>(null)
const cardRef = ref<HTMLElement | null>(null)

let revealObserver: IntersectionObserver | null = null

function moveGlow(e: PointerEvent) {
  const card = cardRef.value
  if (!card) return
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--gx', `${e.clientX - rect.left}px`)
  card.style.setProperty('--gy', `${e.clientY - rect.top}px`)
}

function resetGlow() {
  const card = cardRef.value
  if (!card) return
  card.style.setProperty('--gx', '-999px')
  card.style.setProperty('--gy', '-999px')
}

function scrollToSection(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
}

function scrollToLogin() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  cardRef.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
}

function setMode(newMode: 'signin' | 'signup') {
  mode.value = newMode
  error.value = null
  scrollToLogin()
}

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password'
    return
  }
  isLoading.value = true
  error.value = null
  try {
    await authStore.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/'
    showSplash.value = true
    await new Promise(resolve => setTimeout(resolve, 1400))
    await runPostAuthFlow(redirect)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}

async function handleSignup() {
  if (!email.value || !password.value || !username.value || !displayName.value) {
    error.value = 'Please fill out all fields'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.value)) {
    error.value = 'Username can only contain letters, numbers, and underscores'
    return
  }
  isLoading.value = true
  error.value = null
  try {
    await authStore.register(username.value, email.value, password.value, displayName.value)
    showSplash.value = true
    await new Promise(resolve => setTimeout(resolve, 1400))
    await runPostAuthFlow()
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Registration failed'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (mode.value === 'signin') {
    await handleLogin()
  } else {
    await handleSignup()
  }
}

async function handleGoogleLogin() {
  isLoading.value = true
  error.value = null
  try {
    const success = await authStore.loginWithGoogle({
      email: 'google-user@example.com',
      name: 'Google User',
      google_id: '123456789',
    })
    if (success) {
      const redirect = (route.query.redirect as string) || '/'
      showSplash.value = true
      await new Promise(resolve => setTimeout(resolve, 1400))
      await runPostAuthFlow(redirect)
    }
  } catch (err: any) {
    error.value = 'Google login failed'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (route.query.mode === 'signup') {
    mode.value = 'signup'
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible')
          revealObserver?.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.15 },
  )
  pageRef.value?.querySelectorAll('.reveal').forEach((el) => revealObserver?.observe(el))
})

onBeforeUnmount(() => revealObserver?.disconnect())
</script>

<template>
  <div ref="pageRef" class="landing-page min-h-screen bg-[#0c0907] text-white">
    <SplashScreen :show="showSplash" />

    <!-- ════ HERO × LOGIN ════ -->
    <section class="relative min-h-[100dvh] flex flex-col overflow-hidden">

      <!-- Food photo background: dishes weighted left, slate dead space right -->
      <img :src="loginBg" class="absolute inset-0 w-full h-full object-cover object-left" alt="" aria-hidden="true" />
      <div class="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/55 pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0c0907] pointer-events-none"></div>

      <!-- Nav -->
      <nav class="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between px-6 py-6">
        <div class="flex items-center gap-2.5">
          <span class="logo-mark w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 shadow-lg shadow-orange/30">
            <svg viewBox="0 0 22 28" fill="none" class="w-[20px] h-[24px]">
              <path class="n-path" d="M 4,25 C 4,18 4,9 5,4 C 9,10 13,19 17,25 C 17,17 17,9 18,4"
                stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <div class="leading-none">
            <span class="font-montserrat font-black text-lg tracking-tight">Nutri<span class="text-orange-light">sipe</span></span>
            <p class="text-[9px] font-bold uppercase tracking-[0.32em] text-orange-light/80 mt-0.5">Culinary Labs</p>
          </div>
        </div>

        <div class="hidden md:flex items-center gap-7 text-[13px] font-semibold text-white/70">
          <button class="hover:text-white transition-colors" @click="scrollToSection('features')">Features</button>
          <button class="hover:text-white transition-colors" @click="scrollToSection('how-it-works')">How it works</button>
          <button class="hover:text-white transition-colors" @click="scrollToSection('community')">Community</button>
        </div>

        <button @click="setMode('signup')" class="social-btn rounded-xl px-4 py-2 text-[13px] font-semibold">
          Sign up free
        </button>
      </nav>

      <!-- Hero content -->
      <div class="relative z-10 flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_minmax(0,420px)] items-center gap-12 lg:gap-16 px-6 py-12 lg:py-8">

        <!-- Left: headline over the food -->
        <div class="max-w-xl">
          <p class="text-[11px] font-bold uppercase tracking-[0.32em] text-orange-light/90 mb-5">From pantry to plate</p>
          <h1 class="font-montserrat font-black text-5xl sm:text-6xl xl:text-7xl tracking-tight leading-[0.98] mb-6">
            Cook. Share.<br /><span class="italic font-serif font-medium text-orange-light">Inspire.</span>
          </h1>
          <p class="text-white/70 text-base sm:text-lg max-w-md leading-relaxed mb-10">
            Your personal space for recipes, organic meal plans, and the energetic food community that truly gets you.
          </p>

          <div class="flex items-center gap-7">
            <template v-for="(stat, i) in STATS" :key="stat.label">
              <div v-if="i > 0" class="h-9 w-px bg-white/15"></div>
              <div>
                <p class="font-montserrat font-extrabold text-2xl tabular-nums">{{ stat.value }}</p>
                <p class="text-[11px] text-white/55 font-bold uppercase tracking-widest mt-0.5">{{ stat.label }}</p>
              </div>
            </template>
          </div>
        </div>

        <!-- Right: portrait liquid-glass login card, sits over the slate dead space -->
        <div
          ref="cardRef"
          id="login-card"
          class="auth-card relative w-full max-w-[420px] mx-auto lg:mx-0 lg:justify-self-end rounded-[28px] p-8 sm:p-9"
          @pointermove="moveGlow"
          @pointerleave="resetGlow"
        >
          <h2 class="font-montserrat font-bold text-[26px] tracking-tight mb-1.5">{{ mode === 'signin' ? 'Welcome back' : 'Join the kitchen' }}</h2>
          <p class="text-sm text-orange-light/80 mb-7">{{ mode === 'signin' ? 'Pick up your spatula right where you left, and start sharing!' : 'Your next favorite recipe starts here.' }}</p>

          <Transition name="slide-down">
            <div v-if="error" class="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-xs font-semibold flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ error }}
            </div>
          </Transition>

          <!-- Social buttons -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <button
              @click="handleGoogleLogin"
              :disabled="isLoading"
              class="social-btn flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              disabled
              class="social-btn flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold opacity-45 cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple
            </button>
          </div>

          <div class="flex items-center gap-3 mb-6">
            <div class="flex-1 h-px bg-white/12"></div>
            <span class="text-[10px] text-white/45 whitespace-nowrap font-bold uppercase tracking-[0.18em]">or continue with email</span>
            <div class="flex-1 h-px bg-white/12"></div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <template v-if="mode === 'signup'">
              <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">Display name</label>
                <div class="relative">
                  <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    v-model="displayName"
                    type="text"
                    placeholder="Gordon Ramsay"
                    class="glass-input w-full rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-white/35 outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-white/80 mb-1.5">Username</label>
                <div class="relative">
                  <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <input
                    v-model="username"
                    type="text"
                    placeholder="gordon_r"
                    class="glass-input w-full rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-white/35 outline-none"
                  />
                </div>
              </div>
            </template>

            <div>
              <label class="block text-xs font-semibold text-white/80 mb-1.5">Email address</label>
              <div class="relative">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
                </svg>
                <input
                  v-model="email"
                  type="email"
                  placeholder="email@address.com"
                  class="glass-input w-full rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-white/35 outline-none"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-semibold text-white/80">Password</label>
                <button type="button" class="text-xs text-orange-light font-semibold hover:underline">Forgot password?</button>
              </div>
              <div class="relative">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="glass-input w-full rounded-xl pl-11 pr-11 py-3 text-[15px] text-white placeholder-white/35 outline-none"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white transition-colors"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <svg v-if="!showPassword" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" class="cta-btn w-full py-3.5 mt-2 rounded-xl font-bold text-[15px] text-white" :disabled="isLoading">
              <span v-if="isLoading" class="flex items-center justify-center gap-2">
                <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                {{ mode === 'signin' ? 'Signing in…' : 'Signing up…' }}
              </span>
              <span v-else>{{ mode === 'signin' ? 'Sign In' : 'Sign Up' }}</span>
            </button>
          </form>

          <p class="text-center mt-6 text-[13px] text-white/55">
            {{ mode === 'signin' ? "Don't have an account?" : "Already have an account?" }}
            <button @click="setMode(mode === 'signin' ? 'signup' : 'signin')" type="button" class="text-orange-light font-semibold hover:underline ml-1">
              {{ mode === 'signin' ? "Sign up free" : "Sign in" }}
            </button>
          </p>
        </div>
      </div>

      <!-- Scroll cue -->
      <button
        class="relative z-10 mx-auto mb-6 flex flex-col items-center gap-1.5 text-white/45 hover:text-white/80 transition-colors"
        aria-label="Scroll to explore"
        @click="scrollToSection('features')"
      >
        <span class="text-[10px] font-bold uppercase tracking-[0.28em]">Explore</span>
        <svg class="motion-safe:animate-bounce" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </section>

    <!-- ════ SECTION 1: FEATURES ════ -->
    <section id="features" class="section-features relative py-24 sm:py-28 overflow-hidden">
      <div class="max-w-6xl mx-auto px-6">
        <div class="reveal max-w-2xl mb-14">
          <p class="text-[11px] font-bold uppercase tracking-[0.32em] text-orange-light/90 mb-4">Why Nutrisipe</p>
          <h2 class="font-montserrat font-black text-4xl sm:text-5xl tracking-tight leading-tight mb-4">
            Everything your<br />kitchen <span class="italic font-serif font-medium text-orange-light">craves.</span>
          </h2>
          <p class="text-white/60 text-base leading-relaxed max-w-lg">
            Not another recipe dump. A living cookbook where every dish can be remixed, measured, and shared back.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="reveal feature-card rounded-3xl p-7">
            <span class="feature-icon w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="6" cy="5" r="2.6" /><circle cx="18" cy="5" r="2.6" /><circle cx="12" cy="19" r="2.6" />
                <path d="M6 8v1.5a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8" /><path d="M12 13.5v3" />
              </svg>
            </span>
            <h3 class="font-montserrat font-bold text-lg mb-2">Fork any recipe</h3>
            <p class="text-sm text-white/60 leading-relaxed">
              Remix dishes like code — swap ingredients, save your version, and credit flows back to the original cook.
            </p>
          </div>

          <div class="reveal delay-100 feature-card rounded-3xl p-7">
            <span class="feature-icon w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
            </span>
            <h3 class="font-montserrat font-bold text-lg mb-2">Nutrition, decoded</h3>
            <p class="text-sm text-white/60 leading-relaxed">
              Every recipe ships with macros per serving, calculated for you — so you know exactly what lands on your plate.
            </p>
          </div>

          <div class="reveal delay-200 feature-card rounded-3xl p-7">
            <span class="feature-icon w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </span>
            <h3 class="font-montserrat font-bold text-lg mb-2">A feed that feeds you</h3>
            <p class="text-sm text-white/60 leading-relaxed">
              Follow cooks you love, save dishes into collections, and let the community plate up daily inspiration.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════ SECTION 2: HOW IT WORKS ════ -->
    <section id="how-it-works" class="section-how relative py-24 sm:py-28 overflow-hidden">
      <div class="max-w-6xl mx-auto px-6">
        <div class="reveal max-w-2xl mb-14">
          <p class="text-[11px] font-bold uppercase tracking-[0.32em] text-orange-light/90 mb-4">How it works</p>
          <h2 class="font-montserrat font-black text-4xl sm:text-5xl tracking-tight leading-tight">
            Three steps to your<br />next <span class="italic font-serif font-medium text-orange-light">favourite dish.</span>
          </h2>
        </div>

        <div class="steps-row relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          <div
            v-for="(step, i) in STEPS"
            :key="step.num"
            class="reveal relative"
            :class="{ 'delay-100': i === 1, 'delay-200': i === 2 }"
          >
            <p class="step-num font-montserrat font-black text-6xl mb-4">{{ step.num }}</p>
            <h3 class="font-montserrat font-bold text-xl mb-2.5">{{ step.title }}</h3>
            <p class="text-sm text-white/60 leading-relaxed max-w-xs">{{ step.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════ SECTION 3: COMMUNITY + CTA ════ -->
    <section id="community" class="section-community relative py-24 sm:py-28 overflow-hidden">
      <div class="max-w-6xl mx-auto px-6">
        <div class="reveal max-w-2xl mb-14">
          <p class="text-[11px] font-bold uppercase tracking-[0.32em] text-orange-light/90 mb-4">Community</p>
          <h2 class="font-montserrat font-black text-4xl sm:text-5xl tracking-tight leading-tight">
            Cooks who came for recipes,<br /><span class="italic font-serif font-medium text-orange-light">stayed for the people.</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          <figure
            v-for="(t, i) in TESTIMONIALS"
            :key="t.name"
            class="reveal feature-card rounded-3xl p-7 flex flex-col"
            :class="{ 'delay-100': i === 1, 'delay-200': i === 2 }"
          >
            <svg class="text-orange-light/70 mb-4" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.6 5.2C6 7.1 3.8 10 3.8 13.7c0 3 1.9 5.1 4.4 5.1 2.2 0 3.9-1.7 3.9-3.9 0-2.1-1.5-3.6-3.5-3.6-.4 0-.9.1-1 .1.3-2 2-4 4-5.2L9.6 5.2Zm10 0C16 7.1 13.8 10 13.8 13.7c0 3 1.9 5.1 4.4 5.1 2.2 0 3.9-1.7 3.9-3.9 0-2.1-1.5-3.6-3.5-3.6-.4 0-.9.1-1 .1.3-2 2-4 4-5.2l-2-1Z" />
            </svg>
            <blockquote class="text-sm text-white/75 leading-relaxed flex-1">{{ t.quote }}</blockquote>
            <figcaption class="mt-5 pt-5 border-t border-white/10">
              <p class="font-montserrat font-bold text-sm">{{ t.name }}</p>
              <p class="text-xs text-white/50 mt-0.5">{{ t.role }}</p>
            </figcaption>
          </figure>
        </div>

        <!-- CTA banner -->
        <div class="reveal cta-banner relative rounded-[34px] px-8 py-14 sm:py-16 text-center overflow-hidden">
          <h2 class="relative font-montserrat font-black text-3xl sm:text-5xl tracking-tight leading-tight mb-4">
            Ready to stir<br class="sm:hidden" /> things up?
          </h2>
          <p class="relative text-white/65 text-base max-w-md mx-auto mb-9">
            Join thousands of cooks sharing, forking, and perfecting recipes together.
          </p>
          <div class="relative flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button @click="setMode('signup')" class="cta-btn rounded-xl px-8 py-3.5 font-bold text-[15px] text-white">
              Create free account
            </button>
            <button class="social-btn rounded-xl px-8 py-3.5 font-semibold text-[15px]" @click="setMode('signin')">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/10">
      <div class="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
        <p>© 2026 Nutrisipe Culinary Labs</p>
        <p>Made by cooks, for cooks.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.auth-card {
  background: rgba(28, 22, 17, 0.55);
  backdrop-filter: blur(28px) saturate(140%);
  -webkit-backdrop-filter: blur(28px) saturate(140%);
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.65);
  --gx: -999px;
  --gy: -999px;
}

/* iOS-26-style liquid-glass border: a bright specular spot rides the edge toward the cursor. */
.auth-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background:
    radial-gradient(240px circle at var(--gx) var(--gy),
      rgba(255, 255, 255, 0.95) 0%,
      rgba(255, 150, 80, 0.6) 22%,
      rgba(255, 107, 53, 0) 55%),
    linear-gradient(150deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.03) 38%, rgba(255, 255, 255, 0) 65%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  pointer-events: none;
}

/* Soft interior sheen that follows the same cursor point for depth. */
.auth-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(420px circle at var(--gx) var(--gy), rgba(255, 255, 255, 0.07), transparent 60%);
  pointer-events: none;
}

.auth-card > * {
  position: relative;
  z-index: 1;
}

.logo-mark {
  background: var(--orange);
}

.glass-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.glass-input:focus {
  border-color: var(--orange);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.18);
}

.social-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}
.social-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.cta-btn {
  background: linear-gradient(180deg, var(--orange-light), var(--orange));
  box-shadow: 0 12px 30px -8px rgba(255, 107, 53, 0.55);
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}
.cta-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 36px -8px rgba(255, 107, 53, 0.7);
}
.cta-btn:active:not(:disabled) {
  transform: scale(0.99);
}
.cta-btn:disabled {
  opacity: 0.6;
}

/* ── Landing sections ── */
.section-features {
  background:
    radial-gradient(90% 70% at 85% 0%, rgba(255, 107, 53, 0.07), transparent 60%),
    #0c0907;
}

.section-how {
  background:
    radial-gradient(80% 80% at 8% 50%, rgba(120, 70, 40, 0.14), transparent 55%),
    #0c0907;
}

.section-community {
  background:
    radial-gradient(90% 70% at 50% 100%, rgba(255, 107, 53, 0.08), transparent 60%),
    #0c0907;
}

.feature-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  transition: border-color 0.25s, background 0.25s, transform 0.25s;
}
.feature-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 150, 80, 0.35);
  transform: translateY(-3px);
}

.feature-icon {
  background: rgba(255, 107, 53, 0.14);
  color: var(--orange-light);
}

.step-num {
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 150, 80, 0.55);
}

/* Connector line behind the step numbers on wide screens */
@media (min-width: 768px) {
  .steps-row::before {
    content: '';
    position: absolute;
    top: 30px;
    left: 4%;
    right: 4%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 150, 80, 0.3) 15%, rgba(255, 150, 80, 0.3) 85%, transparent);
  }
}

.cta-banner {
  background:
    radial-gradient(70% 120% at 50% 0%, rgba(255, 107, 53, 0.18), transparent 65%),
    rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 150, 80, 0.22);
}

/* Scroll-reveal */
.reveal {
  opacity: 0;
  transform: translateY(26px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal-visible {
  opacity: 1;
  transform: none;
}

.n-path {
  stroke-dasharray: 72;
  stroke-dashoffset: 72;
  animation: drawN 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
}
@keyframes drawN {
  to { stroke-dashoffset: 0; }
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

@media (prefers-reduced-motion: reduce) {
  .n-path { animation: none; stroke-dashoffset: 0; }
  .reveal { opacity: 1; transform: none; transition: none; }
}
</style>
