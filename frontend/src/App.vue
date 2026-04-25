<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LayoutBackground from '@/components/layout/LayoutBackground.vue'
import AppShell from '@/components/layout/AppShell.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import Toast from '@/components/ui/Toast.vue'

const authStore = useAuthStore()
const route = useRoute()

// Routes that should NOT show the sidebar/navigation shell
const noShellRoutes = ['/login', '/signup', '/onboarding']
const shouldShowAppShell = computed(() => {
  return authStore.isAuthenticated && !noShellRoutes.includes(route.path)
})

// Authentication initialization is now handled in the router guard to prevent race conditions on refresh
onMounted(async () => {
  // Add any other non-auth initialization here
})
</script>

<template>
  <div :class="{ 'dark': authStore.user?.settings?.darkMode }">
    <LayoutBackground>
      <AppShell :show-shell="shouldShowAppShell">
        <RouterView />
      </AppShell>

      <ToastContainer />
      <Toast />
    </LayoutBackground>
  </div>
</template>

<style>
/* Global Transition for Theme Switching */
.dark body {
  background-color: var(--bg);
  color: var(--text);
}
</style>
