<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import LayoutBackground from '@components/layout/LayoutBackground.vue'
import Toast from '@/components/ui/Toast.vue'
</script>

<template>
  <LayoutBackground>
    <main class="overflow-hidden scrollbar-thin min-h-screen dark:text-zinc-50 dark:[color-scheme:dark]">
      <RouterView />
    </main>
    <Toast />
  </LayoutBackground>
</template>
