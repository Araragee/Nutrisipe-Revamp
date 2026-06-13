import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function usePostAuthFlow() {
  const router = useRouter()
  const authStore = useAuthStore()

  const runPostAuthFlow = async (fallbackRedirect = '/') => {
    if (!authStore.user) {
      await authStore.fetchUser()
    }
    
    if (authStore.user && !authStore.user.onboardingCompleted) {
      router.push('/onboarding')
    } else {
      router.push(fallbackRedirect)
    }
  }

  return { runPostAuthFlow }
}
