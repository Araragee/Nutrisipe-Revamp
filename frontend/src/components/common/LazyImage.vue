<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  src: string
  alt: string
  placeholder?: string
  aspectRatio?: string
}>()

const imageRef = ref<HTMLImageElement | null>(null)
const isLoaded = ref(false)
const isInView = ref(false)
const hasError = ref(false)

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!imageRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isInView.value = true
          observer?.disconnect()
        }
      })
    },
    {
      rootMargin: '50px',
    }
  )

  observer.observe(imageRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

function handleLoad() {
  isLoaded.value = true
}

function handleError() {
  hasError.value = true
  isLoaded.value = true
}
</script>

<template>
  <div
    class="relative overflow-hidden bg-gray-200 dark:bg-gray-700"
    :style="aspectRatio ? { aspectRatio } : {}"
  >
    <div
      v-if="!isLoaded"
      class="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"
    ></div>

    <img
      v-if="isInView"
      ref="imageRef"
      :src="src"
      :alt="alt"
      @load="handleLoad"
      @error="handleError"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="isLoaded ? 'opacity-100' : 'opacity-0'"
      loading="lazy"
    />

    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
    >
      <div class="text-center text-gray-500 dark:text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p class="text-sm">Image not available</p>
      </div>
    </div>
  </div>
</template>
