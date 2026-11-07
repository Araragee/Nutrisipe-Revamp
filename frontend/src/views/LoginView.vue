<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostAuthFlow } from '@/composables/usePostAuthFlow'
import SplashScreen from '@/components/common/SplashScreen.vue'
import IngredientPlate from '@/components/landing/IngredientPlate.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import loginBg from '@/assets/login-bg.webp'

// ponytail: plain facts about the product, no invented counts; swap for live numbers once a public stats endpoint exists
const HIGHLIGHTS = [
  { value: 'Macros', label: 'per serving' },
  { value: 'Fork', label: 'any recipe' },
  { value: 'Plan', label: 'your week' },
] as const

const FEATURES = [
  {
    emoji: '🍝',
    band: 'from-orange/30 to-orange-deep/10',
    title: 'Fork any recipe',
    body: 'Remix dishes like code — swap ingredients, save your version, and credit flows back to the original cook.',
    chips: [{ label: 'Variations', tone: 'orange' }],
  },
  {
    emoji: '🥗',
    band: 'from-green/30 to-green-deep/10',
    title: 'Nutrition, decoded',
    body: 'Every recipe ships with macros per serving, calculated for you — so you know exactly what lands on your plate.',
    chips: [
      { label: '420 kcal', tone: 'orange' },
      { label: '32g protein', tone: 'green' },
    ],
  },
  {
    emoji: '🔥',
    band: 'from-orange-light/30 to-orange/10',
    title: 'A feed that feeds you',
    body: 'Follow cooks you love, save dishes into collections, and let the community plate up daily inspiration.',
    chips: [{ label: 'Collections', tone: 'orange' }],
  },
] as const

const STEPS = [
  {
    num: '01',
    chip: 'Browse',
    title: 'Discover',
    body: 'Browse community recipes. Filter by craving, diet, or the macros you are chasing.',
  },
  {
    num: '02',
    chip: 'Make it yours',
    title: 'Cook & tweak',
    body: 'Follow clear steps, scale servings, and swap what you don\'t have — the recipe adapts with you.',
  },
  {
    num: '03',
    chip: 'Pass it on',
    title: 'Share your fork',
    body: 'Publish your spin. Watch it travel, get saved, and spark the next remix.',
  },
] as const

// dev-only shortcuts: seeded demo logins and the unverified Google stub (backend route is dev-only too)
const IS_DEV = import.meta.env.DEV

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

// import.meta.env.DEV is a build-time constant, so these literals are stripped from production bundles
const TEST_ACCOUNTS: { label: string, email: string, isAdmin: boolean }[] = import.meta.env.DEV
  ? [
      { label: 'Admin', email: 'admin@nutrisipe.com', isAdmin: true },
      { label: 'Cook', email: 'cook@nutrisipe.com', isAdmin: false },
      { label: 'Chef', email: 'chef@nutrisipe.com', isAdmin: false },
      { label: 'Baker', email: 'baker@nutrisipe.com', isAdmin: false },
    ]
  : []

async function quickLogin(acct: (typeof TEST_ACCOUNTS)[number]) {
  if (isLoading.value || !import.meta.env.DEV) return
  mode.value = 'signin'
  email.value = acct.email
  password.value = 'password123'
  await handleLogin()
}

async function handleGoogleLogin() {
  if (!import.meta.env.DEV) return
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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduceMotion) return

  pageRef.value?.classList.add('anim-ready')

  const BOWL_STAGES = [
    '.pl-base .pl-item',
    '.pl-grain .pl-item',
    '.pl-top .pl-item, .pl-garnish .pl-item, .pl-fork',
  ]

  function revealBowlUpTo(stage: number) {
    for (let i = 0; i <= stage; i++) {
      document.querySelectorAll(BOWL_STAGES[i]).forEach(el => el.classList.add('revealed-pl'))
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('revealed', 'is-active')
      const stage = (entry.target as HTMLElement).dataset.stage
      if (stage !== undefined) {
        revealBowlUpTo(parseInt(stage))
      }
      observer.unobserve(entry.target)
    })
  }, { threshold: 0.3 })

  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    document.querySelectorAll('.how-step').forEach(el => observer.observe(el))
  }, 100)

})

</script>

<template>
  <div ref="pageRef" class="landing-page relative min-h-screen bg-[#0c0907] text-white">
    <SplashScreen :show="showSplash" />

    <section class="relative z-10 min-h-[100dvh] flex flex-col overflow-hidden">

      <img :src="loginBg" fetchpriority="high" decoding="async" class="absolute inset-0 w-full h-full object-cover object-left" alt="" aria-hidden="true" />
      <div class="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/55 pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0c0907] pointer-events-none"></div>

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
        </div>

        <BaseButton size="sm" @click="setMode('signup')">Sign up free</BaseButton>
      </nav>

      <div class="relative z-10 flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_minmax(0,420px)] items-center gap-12 lg:gap-16 px-6 py-12 lg:py-8">

        <div class="max-w-xl">
          <p class="text-[11px] font-bold uppercase tracking-[0.32em] text-orange-light/90 mb-5">From pantry to plate</p>
          <h1 class="font-montserrat font-black text-5xl sm:text-6xl xl:text-7xl tracking-tight leading-[0.98] mb-6">
            Cook. Share.<br /><span class="italic font-serif font-medium text-orange-light">Inspire.</span>
          </h1>
          <p class="text-white/70 text-base sm:text-lg max-w-md leading-relaxed mb-10">
            Find something good to cook tonight, save it for later, and share your own spin with cooks who get it.
          </p>

          <ul class="flex items-center gap-4 sm:gap-7">
            <template v-for="(item, i) in HIGHLIGHTS" :key="item.value">
              <li v-if="i > 0" class="h-9 w-px bg-white/15" aria-hidden="true"></li>
              <li>
                <p class="font-montserrat font-extrabold text-2xl">{{ item.value }}</p>
                <p class="text-[11px] text-white/55 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">{{ item.label }}</p>
              </li>
            </template>
          </ul>
        </div>

        <div
          ref="cardRef"
          id="login-card"
          class="auth-card relative w-full max-w-[420px] mx-auto lg:mx-0 lg:justify-self-end rounded-[28px] p-8 sm:p-9"
          @pointermove="moveGlow"
          @pointerleave="resetGlow"
        >
          <h2 class="font-montserrat font-bold text-[26px] tracking-tight mb-1.5">{{ mode === 'signin' ? 'Welcome back' : 'Join the kitchen' }}</h2>
          <p class="text-sm text-orange-light/80 mb-7">{{ mode === 'signin' ? 'Pick up right where you left off.' : 'Your next favorite recipe starts here.' }}</p>

          <div v-if="IS_DEV" class="quick-login mb-6 rounded-xl p-3">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-light/70 mb-2.5">Dev only · test accounts</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="acct in TEST_ACCOUNTS"
                :key="acct.email"
                type="button"
                :disabled="isLoading"
                @click="quickLogin(acct)"
                class="quick-login-btn rounded-lg py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                :class="{ 'is-admin': acct.isAdmin }"
              >
                {{ acct.label }}
              </button>
            </div>
          </div>

          <Transition name="slide-down">
            <div v-if="error" id="auth-error" role="alert" class="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-xs font-semibold flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ error }}
            </div>
          </Transition>

          <div v-if="IS_DEV" class="mb-6">
            <button
              type="button"
              @click="handleGoogleLogin"
              :disabled="isLoading"
              class="social-btn flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google (dev stub)
            </button>
          </div>

          <div v-if="IS_DEV" class="flex items-center gap-3 mb-6">
            <div class="flex-1 h-px bg-white/12"></div>
            <span class="text-[10px] text-white/45 whitespace-nowrap font-bold uppercase tracking-[0.18em]">or continue with email</span>
            <div class="flex-1 h-px bg-white/12"></div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4" :aria-describedby="error ? 'auth-error' : undefined">
            <template v-if="mode === 'signup'">
              <div>
                <label for="auth-display-name" class="block text-xs font-semibold text-white/80 mb-1.5">Display name</label>
                <div class="relative">
                  <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    id="auth-display-name"
                    v-model="displayName"
                    type="text"
                    autocomplete="name"
                    required
                    placeholder="Gordon Ramsay"
                    class="glass-input w-full rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-white/35 outline-none"
                  />
                </div>
              </div>

              <div>
                <label for="auth-username" class="block text-xs font-semibold text-white/80 mb-1.5">Username</label>
                <div class="relative">
                  <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <input
                    id="auth-username"
                    v-model="username"
                    type="text"
                    autocomplete="username"
                    autocapitalize="none"
                    spellcheck="false"
                    pattern="[A-Za-z0-9_]+"
                    title="Letters, numbers and underscores only"
                    required
                    placeholder="gordon_r"
                    class="glass-input w-full rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-white/35 outline-none"
                  />
                </div>
              </div>
            </template>

            <div>
              <label for="auth-email" class="block text-xs font-semibold text-white/80 mb-1.5">Email address</label>
              <div class="relative">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
                </svg>
                <input
                  id="auth-email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  autocapitalize="none"
                  spellcheck="false"
                  required
                  placeholder="email@address.com"
                  class="glass-input w-full rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-white/35 outline-none"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="auth-password" class="text-xs font-semibold text-white/80">Password</label>
                <span v-if="mode === 'signup'" class="text-[11px] text-white/45">8+ characters</span>
              </div>
              <div class="relative">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="auth-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
                  :minlength="mode === 'signup' ? 8 : undefined"
                  required
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

            <BaseButton type="submit" size="lg" block :loading="isLoading" class="mt-2">
              {{ isLoading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Create account') }}
            </BaseButton>
          </form>

          <p class="text-center mt-6 text-[13px] text-white/55">
            {{ mode === 'signin' ? "Don't have an account?" : "Already have an account?" }}
            <button @click="setMode(mode === 'signin' ? 'signup' : 'signin')" type="button" class="text-orange-light font-semibold hover:underline ml-1">
              {{ mode === 'signin' ? "Sign up free" : "Sign in" }}
            </button>
          </p>
        </div>
      </div>

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

    <section id="features" class="section-features relative z-10 py-24 sm:py-28 overflow-hidden">
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
          <article
            v-for="(f, i) in FEATURES"
            :key="f.title"
            class="reveal recipe-card group rounded-3xl overflow-hidden flex flex-col"
            :class="{ 'delay-100': i === 1, 'delay-200': i === 2 }"
          >
            <div class="relative h-32 flex items-center justify-center bg-gradient-to-br overflow-hidden" :class="f.band">
              <span class="text-5xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">{{ f.emoji }}</span>
              <span class="absolute inset-0 bg-gradient-to-t from-[#15100c]/80 to-transparent"></span>
            </div>
            <div class="flex-1 p-6 -mt-6 relative">
              <div class="flex flex-wrap gap-1.5 mb-3">
                <span
                  v-for="chip in f.chips"
                  :key="chip.label"
                  class="macro-chip text-[11px] font-bold px-2.5 py-1 rounded-full"
                  :class="chip.tone === 'green' ? 'is-green' : 'is-orange'"
                >{{ chip.label }}</span>
              </div>
              <h3 class="font-montserrat font-bold text-lg mb-2">{{ f.title }}</h3>
              <p class="text-sm text-white/60 leading-relaxed">{{ f.body }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="section-how relative z-10 py-24 sm:py-28">
      <div class="max-w-6xl mx-auto px-6">
        <div class="reveal max-w-2xl mb-14">
          <p class="text-[11px] font-bold uppercase tracking-[0.32em] text-orange-light/90 mb-4">How it works</p>
          <h2 class="font-montserrat font-black text-4xl sm:text-5xl tracking-tight leading-tight">
            Watch your bowl<br />come <span class="italic font-serif font-medium text-orange-light">together.</span>
          </h2>
        </div>

        <div class="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          <div class="plate-stage md:sticky md:top-24">
            <div class="relative mx-auto w-full max-w-[380px] md:max-w-[520px] aspect-square">
              <div class="plate-glow"></div>
              <IngredientPlate class="relative" />
            </div>
          </div>

          <ol class="how-steps">
            <li
              v-for="(step, i) in STEPS"
              :key="step.num"
              :data-stage="i"
              class="how-step py-8 md:min-h-[56vh] flex flex-col justify-center"
            >
              <span class="how-chip inline-flex w-fit items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4">
                <span class="how-dot w-1.5 h-1.5 rounded-full"></span>{{ step.chip }}
              </span>
              <div class="flex items-baseline gap-4 mb-2.5">
                <span class="how-num font-montserrat font-black text-5xl sm:text-6xl">{{ step.num }}</span>
                <h3 class="font-montserrat font-bold text-2xl sm:text-3xl">{{ step.title }}</h3>
              </div>
              <p class="how-body text-base text-white/55 leading-relaxed max-w-md">{{ step.body }}</p>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <section id="get-started" class="section-community relative z-10 py-24 sm:py-28 overflow-hidden">
      <div class="max-w-6xl mx-auto px-6">
        <div class="reveal cta-banner relative rounded-[34px] px-8 py-16 sm:py-20 text-center overflow-hidden">
          <div class="cta-float" aria-hidden="true">
            <span>🍅</span><span>🥑</span><span>🌿</span><span>🧄</span><span>🥕</span><span>🍋</span>
          </div>
          <h2 class="relative font-montserrat font-black text-3xl sm:text-5xl tracking-tight leading-tight mb-4">
            Ready to stir<br class="sm:hidden" /> things up?
          </h2>
          <p class="relative text-white/70 text-base max-w-md mx-auto mb-9">
            Save what you love, fork what you’d cook differently, and plan the week around it. Free to join.
          </p>
          <div class="relative flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <BaseButton size="lg" class="px-8" @click="setMode('signup')">Create free account</BaseButton>
            <button class="social-btn rounded-xl px-8 py-3.5 font-semibold text-[15px]" @click="setMode('signin')">
              Sign in
            </button>
          </div>
        </div>
      </div>
    </section>

    <footer class="relative z-10 border-t border-white/10 bg-[#0c0907]/80">
      <div class="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
        <p>© {{ new Date().getFullYear() }} Nutrisipe Culinary Labs</p>
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

.quick-login {
  border: 1px dashed rgba(255, 150, 80, 0.35);
  background: rgba(255, 107, 53, 0.06);
}
.quick-login-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.85);
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}
.quick-login-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 150, 80, 0.5);
  transform: translateY(-1px);
}
.quick-login-btn.is-admin {
  background: rgba(255, 107, 53, 0.16);
  border-color: rgba(255, 107, 53, 0.4);
  color: var(--orange-light);
}
.quick-login-btn.is-admin:hover:not(:disabled) {
  background: rgba(255, 107, 53, 0.26);
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


.section-features {
  background: radial-gradient(90% 70% at 85% 0%, rgba(255, 107, 53, 0.10), transparent 60%);
}
.section-how {
  background: radial-gradient(80% 80% at 8% 50%, rgba(120, 70, 40, 0.18), transparent 55%);
}
.section-community {
  background: radial-gradient(90% 70% at 50% 100%, rgba(255, 107, 53, 0.10), transparent 60%);
}

.recipe-card {
  background: rgba(20, 15, 11, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
}
.recipe-card:hover {
  border-color: rgba(255, 150, 80, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 20px 44px -20px rgba(0, 0, 0, 0.8);
}
.macro-chip.is-orange {
  background: rgba(255, 107, 53, 0.16);
  color: var(--orange-light);
  border: 1px solid rgba(255, 107, 53, 0.3);
}
.macro-chip.is-green {
  background: rgba(16, 185, 129, 0.16);
  color: var(--green-light);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.plate-glow {
  position: absolute;
  inset: 6%;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 45%, rgba(255, 140, 66, 0.34), rgba(255, 107, 53, 0.05) 60%, transparent 72%);
  filter: blur(18px);
  pointer-events: none;
}
.how-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.55);
  transition: color 0.4s, border-color 0.4s, background 0.4s;
}
.how-dot {
  background: rgba(255, 255, 255, 0.4);
  transition: background 0.4s, box-shadow 0.4s;
}
.how-num {
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 150, 80, 0.4);
  transition: -webkit-text-stroke-color 0.4s;
}
.how-step {
  opacity: 0.4;
  transition: opacity 0.45s ease;
}
.how-step.is-active {
  opacity: 1;
}
.how-step.is-active .how-chip {
  background: rgba(255, 107, 53, 0.16);
  border-color: rgba(255, 107, 53, 0.5);
  color: var(--orange-light);
}
.how-step.is-active .how-dot {
  background: var(--orange-light);
  box-shadow: 0 0 10px 1px rgba(255, 140, 66, 0.8);
}
.how-step.is-active .how-num {
  -webkit-text-stroke-color: var(--orange);
}
@media (max-width: 767px) {
  .how-step {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.45s ease, transform 0.45s ease;
  }
  .how-step.revealed {
    opacity: 1;
    transform: none;
  }
  .how-step:nth-child(2) { transition-delay: 0.1s; }
  .how-step:nth-child(3) { transition-delay: 0.2s; }
}


.cta-banner {
  isolation: isolate;
  background:
    radial-gradient(70% 120% at 50% 0%, rgba(255, 107, 53, 0.18), transparent 65%),
    rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 150, 80, 0.22);
}
.cta-float {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.cta-float span {
  position: absolute;
  font-size: 26px;
  opacity: 0.5;
  animation: ctaFloat 7s ease-in-out infinite;
}
.cta-float span:nth-child(1) { left: 8%;  top: 28%; animation-delay: 0s; }
.cta-float span:nth-child(2) { left: 17%; top: 64%; animation-delay: 1.1s; font-size: 32px; }
.cta-float span:nth-child(3) { left: 85%; top: 22%; animation-delay: 2.2s; }
.cta-float span:nth-child(4) { left: 90%; top: 62%; animation-delay: 0.6s; }
.cta-float span:nth-child(5) { left: 74%; top: 78%; animation-delay: 1.7s; font-size: 30px; }
.cta-float span:nth-child(6) { left: 30%; top: 14%; animation-delay: 2.8s; }
@keyframes ctaFloat {
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50% { transform: translateY(-16px) rotate(8deg); }
}

.reveal { opacity: 1; }
.anim-ready .reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.anim-ready .reveal.revealed {
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
  .how-step { opacity: 1; }
  .cta-float span { animation: none; }
}
</style>
