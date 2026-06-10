<script setup lang="ts">
import { ref } from 'vue'
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

async function handleRegister() {
  if (!username.value || !email.value || !password.value || !displayName.value) {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await authStore.register(username.value, email.value, password.value, displayName.value)
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Registration failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page h-screen flex items-center justify-center relative overflow-hidden bg-background">
    <BrandMeshBackground variant="warm" :intensity="0.9" />

    <div class="auth-card relative z-[2] bg-glass backdrop-blur-2xl border-1.5 border-[var(--glass-border)] rounded-[32px] p-10 px-11 w-[440px] shadow-[0_24px_64px_rgba(20,10,0,0.18)] dark:bg-[rgba(24,22,30,0.95)]">
      <div class="auth-logo font-montserrat font-extrabold text-xl mb-6">Nutri<span class="text-orange">sipe</span></div>
      <h2 class="auth-title font-montserrat font-extrabold text-[28px] tracking-tight mb-1.5">Join the community</h2>
      <p class="auth-sub text-sm text-text-muted mb-6">Create your Nutrisipe account today.</p>

      <div v-if="error" class="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
        {{ error }}
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="field">
            <label class="block text-xs font-bold text-text-muted tracking-widest uppercase mb-2">Username</label>
            <input v-model="username" type="text" placeholder="chef123" class="w-full bg-surface border-1.5 border-[var(--glass-border)] rounded-[14px] p-3 text-[14px] outline-none focus:border-orange transition-all dark:bg-[rgb(30,28,38)]" />
          </div>
          <div class="field">
            <label class="block text-xs font-bold text-text-muted tracking-widest uppercase mb-2">Display Name</label>
            <input v-model="displayName" type="text" placeholder="John Doe" class="w-full bg-surface border-1.5 border-[var(--glass-border)] rounded-[14px] p-3 text-[14px] outline-none focus:border-orange transition-all dark:bg-[rgb(30,28,38)]" />
          </div>
        </div>
        
        <div class="field">
          <label class="block text-xs font-bold text-text-muted tracking-widest uppercase mb-2">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" class="w-full bg-surface border-1.5 border-[var(--glass-border)] rounded-[14px] p-3 text-[14px] outline-none focus:border-orange transition-all dark:bg-[rgb(30,28,38)]" />
        </div>
        
        <div class="field">
          <label class="block text-xs font-bold text-text-muted tracking-widest uppercase mb-2">Password</label>
          <input v-model="password" type="password" placeholder="••••••••" class="w-full bg-surface border-1.5 border-[var(--glass-border)] rounded-[14px] p-3 text-[14px] outline-none focus:border-orange transition-all dark:bg-[rgb(30,28,38)]" />
        </div>

        <button type="submit" class="btn-primary w-full py-3.5 mt-2" :disabled="isLoading">
          {{ isLoading ? 'Creating account...' : 'Create Account →' }}
        </button>
      </form>

      <p class="auth-footer text-center mt-5 text-[13px] text-text-dim">
        Already have an account? <router-link to="/login" class="text-orange font-bold cursor-pointer hover:underline">Sign in</router-link>
      </p>
    </div>
  </div>
</template>
