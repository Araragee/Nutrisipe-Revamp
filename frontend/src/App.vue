<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { onMounted, onErrorCaptured, computed, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import LayoutBackground from '@/components/layout/LayoutBackground.vue'
import AppShell from '@/components/layout/AppShell.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const authStore = useAuthStore()
const route = useRoute()
useTheme()

// Routes that should NOT show the sidebar/navigation shell
const noShellRoutes = ['/login', '/onboarding']
const shouldShowAppShell = computed(() => {
  return authStore.isAuthenticated && !noShellRoutes.includes(route.path)
})

// ── Error boundary ────────────────────────────────────────────────────────
const appError = ref<string | null>(null)
// Incrementing this key forces RouterView to destroy + re-mount on retry
const appShellKey = ref(0)

onErrorCaptured((err, _vm, info) => {
  // Ignore vue-masonry-wall unmount race condition
  if (err instanceof TypeError && err.message.includes("reading 'children'")) {
    logger.warn('Ignored vue-masonry-wall unmount/render race condition', err)
    return false
  }

  logger.error('[App error boundary]', info, err)
  if (err instanceof Error) {
    appError.value = err.message
  }
  return false // don't propagate further
})

function retryApp() {
  appError.value = null
  appShellKey.value++
}

// Clear a latched error when the user navigates away — a stuck error page
// shouldn't survive a route change.
watch(() => route.path, () => {
  if (appError.value) {
    appError.value = null
    appShellKey.value++
  }
})

onMounted(async () => {
  // initialization hook reserved for future use
})
</script>

<template>
  <div>
    <!-- Global error boundary fallback -->
    <div
      v-if="appError"
      class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background p-8 text-center"
    >
      <BaseIcons name="exclamation-triangle" size="xl" class="mx-auto mb-4 text-text-dim" />
      <h1 class="font-montserrat font-extrabold text-2xl mb-2">Something went wrong</h1>
      <p class="text-text-muted text-sm mb-6 max-w-sm">{{ appError }}</p>
      <button
        class="btn-primary px-6 py-2.5 text-sm"
        @click="retryApp"
      >Try again</button>
    </div>

    <LayoutBackground v-else>
      <AppShell :show-shell="shouldShowAppShell">
        <RouterView :key="appShellKey" />
      </AppShell>

      <ToastContainer />
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
