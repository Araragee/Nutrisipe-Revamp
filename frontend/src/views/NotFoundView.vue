<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseIcons from '@/components/base/BaseIcons.vue'

const router = useRouter()
</script>

<template>
  <div class="not-found-view min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 md:py-16">
    <div class="w-16 h-16 rounded-3xl bg-orange-soft text-orange flex items-center justify-center mb-6">
      <BaseIcons name="magnifying-glass" size="xl" />
    </div>
    <p class="font-montserrat font-black text-6xl tracking-tight text-text mb-2">404</p>
    <h1 class="font-montserrat font-extrabold text-2xl tracking-tight text-text mb-2">Page not found</h1>
    <p class="text-text-muted max-w-sm mb-8">That recipe, page, or link doesn't exist or may have moved.</p>
    <div class="flex items-center gap-3">
      <button
        @click="router.back()"
        class="h-11 px-5 rounded-full border border-border bg-surface dark:bg-zinc-800/40 text-text-muted hover:text-text hover:border-orange font-semibold text-sm transition-colors"
      >
        Go back
      </button>
      <RouterLink
        to="/"
        class="h-11 px-5 rounded-full bg-orange text-white hover:bg-orange-deep font-semibold text-sm flex items-center transition-colors"
      >
        Back to Discover
      </RouterLink>
    </div>
  </div>
</template>
