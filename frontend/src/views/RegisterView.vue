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
  <div class="auth-page relative min-h-screen flex items-center justify-center bg-background dark:bg-background px-4 overflow-hidden">
    <BrandMeshBackground variant="warm" :intensity="0.5" />

    <div class="auth-card relative z-10 bg-surface dark:bg-surface border border-border rounded-card p-10 px-9 w-[440px] shadow-card">
      <div class="auth-logo font-montserrat font-extrabold text-xl mb-6 text-text dark:text-text">Nutri<span class="text-orange">sipe</span></div>
      <h2 class="auth-title font-montserrat font-bold text-[26px] tracking-tight mb-1.5 text-text dark:text-text">Join the community</h2>
      <p class="auth-sub text-sm text-text-muted dark:text-text-muted mb-6">Create your Nutrisipe account today.</p>

      <div v-if="error" class="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 text-xs font-semibold">
        {{ error }}
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="field">
            <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-2">Username</label>
            <input v-model="username" type="text" placeholder="chef123" class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn p-3 text-[14px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-colors" />
          </div>
          <div class="field">
            <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-2">Display Name</label>
            <input v-model="displayName" type="text" placeholder="John Doe" class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn p-3 text-[14px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-colors" />
          </div>
        </div>
        
        <div class="field">
          <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-2">Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn p-3 text-[14px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-colors" />
        </div>
        
        <div class="field">
          <label class="block text-xs font-semibold text-text-muted dark:text-text-muted mb-2">Password</label>
          <input v-model="password" type="password" placeholder="••••••••" class="w-full bg-background dark:bg-background-secondary border border-border rounded-btn p-3 text-[14px] text-text dark:text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-colors" />
        </div>

        <button type="submit" class="btn-primary w-full py-3.5 mt-2" :disabled="isLoading">
          {{ isLoading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="auth-footer text-center mt-5 text-[13px] text-text-dim dark:text-text-dim">
        Already have an account? <router-link to="/login" class="text-orange font-semibold cursor-pointer hover:underline">Sign in</router-link>
      </p>
    </div>
  </div>
</template>
