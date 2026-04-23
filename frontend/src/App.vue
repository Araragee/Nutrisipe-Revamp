<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LayoutBackground from '@/components/layout/LayoutBackground.vue'
import Navbar from '@/components/Navbar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import Toast from '@/components/ui/Toast.vue'

const authStore = useAuthStore()
const route = useRoute()

const hideNavbarRoutes = ['/login']
const shouldShowNavbar = computed(() => !hideNavbarRoutes.includes(route.path))

onMounted(async () => {
  if (authStore.token) {
    await authStore.fetchUser()
  }
})
</script>

<template>
  <LayoutBackground>
    <Navbar v-if="shouldShowNavbar" />
    <ToastContainer />
    <main class="overflow-hidden scrollbar-thin min-h-screen dark:text-zinc-50 dark:[color-scheme:dark]">
      <RouterView />
    </main>
    <Toast />
  </LayoutBackground>
</template>
