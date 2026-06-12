<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BrandMeshBackground from '@/components/common/BrandMeshBackground.vue'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const displayName = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)
const showPassword = ref(false)

const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return { score: 0, label: '', color: '' }
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  const map = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Weak', color: 'bg-red-500' },
    { score: 2, label: 'Fair', color: 'bg-amber-500' },
    { score: 3, label: 'Good', color: 'bg-lime-500' },
    { score: 4, label: 'Strong', color: 'bg-green-500' },
  ]
  return map[score]
})

const perks = [
  { icon: '🍳', title: 'Save & organize', desc: 'Build collections of recipes you love' },
  { icon: '📅', title: 'Plan your week', desc: 'Drag recipes into a meal calendar' },
  { icon: '🛒', title: 'Auto grocery lists', desc: 'Ingredients added with one tap' },
  { icon: '👥', title: 'Follow creators', desc: 'A feed tuned to your taste' },
]

async function handleRegister() {
  if (!username.value || !email.value || !password.value || !displayName.value) {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await authStore.register(username.value, email.value, password.value, displayName.value)
    router.push('/onboarding')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Registration failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-root min-h-screen flex bg-background dark:bg-background overflow-hidden">

    <!-- ── Left: brand panel ── -->
    <div class="auth-hero hidden lg:flex lg:w-[48%] xl:w-[52%] relative flex-col overflow-hidden">
      <BrandMeshBackground variant="morning" :intensity="0.7" class="!absolute inset-0" />
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

        <!-- Headline + perks -->
        <div class="mt-auto mb-auto pt-12">
          <h1 class="font-montserrat font-black text-4xl xl:text-5xl tracking-tight leading-[1.05] text-text dark:text-text mb-3">
            Everything you need to<br /><span class="text-orange">eat better.</span>
          </h1>
          <p class="text-text-muted dark:text-text-muted text-base max-w-md leading-relaxed mb-10">
            Join thousands of home cooks and creators. Free forever.
          </p>

          <div class="space-y-4 max-w-md">
            <div
              v-for="perk in perks"
              :key="perk.title"
              class="perk-row flex items-center gap-4 bg-surface/70 dark:bg-surface/70 backdrop-blur border border-border rounded-2xl p-3.5"
            >
              <span class="w-11 h-11 rounded-xl bg-orange-soft flex items-center justify-center text-xl shrink-0">{{ perk.icon }}</span>
              <div>
                <p class="font-bold text-sm text-text dark:text-text">{{ perk.title }}</p>
                <p class="text-xs text-text-dim dark:text-text-dim mt-0.5">{{ perk.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right: form panel ── -->
    <div class="form-panel flex-1 flex flex-col justify-center items-center px-6 py-12 relative overflow-y-auto">
      <BrandMeshBackground variant="morning" :intensity="0.25" class="!absolute inset-0 lg:hidden" />

      <div class="relative z-10 w-full max-w-[420px]">

        <!-- Mobile logo -->
        <div class="flex items-center gap-2.5 mb-8 lg:hidden">
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

        <h2 class="font-montserrat font-bold text-[28px] tracking-tight mb-1 text-text dark:text-text">Create your account</h2>
        <p class="text-sm text-text-muted dark:text-text-muted mb-7">Takes less than a minute. No card required.</p>

        <Transition name="slide-down">
          <div v-if="error" class="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>
        </Transition>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-1.5">Username</label>
              <input
                v-model="username"
                type="text"
                placeholder="chef123"
                class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn px-3.5 py-3 text-[14px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-all"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-1.5">Display name</label>
              <input
                v-model="displayName"
                type="text"
                placeholder="John Doe"
                class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn px-3.5 py-3 text-[14px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-all"
              />
            </div>
          </div>

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
            <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-1.5">Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="At least 8 characters"
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

            <!-- Password strength -->
            <Transition name="slide-down">
              <div v-if="password" class="mt-2.5">
                <div class="flex gap-1.5">
                  <div
                    v-for="i in 4"
                    :key="i"
                    class="h-1 flex-1 rounded-full transition-all duration-300"
                    :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-border'"
                  ></div>
                </div>
                <p v-if="passwordStrength.label" class="text-[11px] font-semibold mt-1.5 text-text-dim">
                  Password strength: <span class="text-text">{{ passwordStrength.label }}</span>
                </p>
              </div>
            </Transition>
          </div>

          <button type="submit" class="btn-primary w-full py-3.5 mt-2 rounded-btn" :disabled="isLoading">
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Creating account…
            </span>
            <span v-else>Create account</span>
          </button>
        </form>

        <p class="text-[11px] text-text-dim dark:text-text-dim text-center mt-4 leading-relaxed">
          By signing up you agree to our
          <a href="#" class="text-text-muted hover:text-orange underline">Terms</a> and
          <a href="#" class="text-text-muted hover:text-orange underline">Privacy Policy</a>.
        </p>

        <p class="text-center mt-5 text-[13px] text-text-dim dark:text-text-dim">
          Already have an account?
          <router-link to="/login" class="text-orange font-semibold hover:underline ml-1">Sign in</router-link>
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
  background: linear-gradient(135deg, var(--orange) 0%, var(--orange-light) 100%);
  box-shadow: 0 4px 14px var(--orange-glow);
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

.perk-row {
  animation: perkIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}
.perk-row:nth-child(1) { animation-delay: 0.1s; }
.perk-row:nth-child(2) { animation-delay: 0.2s; }
.perk-row:nth-child(3) { animation-delay: 0.3s; }
.perk-row:nth-child(4) { animation-delay: 0.4s; }

@keyframes perkIn {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
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
</style>
