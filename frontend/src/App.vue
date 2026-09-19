<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { onMounted, onErrorCaptured, computed, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import LayoutBackground from '@/components/layout/LayoutBackground.vue'
import AppShell from '@/components/layout/AppShell.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const authStore = useAuthStore()
const route = useRoute()
useTheme()

const noShellRoutes = ['/login', '/onboarding']
const shouldShowAppShell = computed(() => {
  return authStore.isAuthenticated && !noShellRoutes.includes(route.path)
})

const appError = ref<string | null>(null)
const appShellKey = ref(0)

onErrorCaptured((err, _vm, info) => {
  if (err instanceof TypeError && err.message.includes("reading 'children'")) {
    logger.warn('Ignored vue-masonry-wall unmount/render race condition', err)
    return false
  }

  logger.error('[App error boundary]', info, err)
  if (err instanceof Error) {
    appError.value = err.message
  }
  return false
})

function retryApp() {
  appError.value = null
  appShellKey.value++
}

watch(() => route.path, () => {
  if (appError.value) {
    appError.value = null
    appShellKey.value++
  }
})

onMounted(async () => {
})
</script>

<template>
  <div>
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
.dark body {
  background-color: var(--bg);
  color: var(--text);
}
</style>
