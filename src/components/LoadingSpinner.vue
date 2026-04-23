<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  message: 'Loading...',
})

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <div
      :class="[sizeClasses[size], 'animate-spin rounded-full border-b-2 border-primary-base']"
    ></div>
    <p v-if="message" class="text-gray-600 mt-4">{{ message }}</p>
  </div>
</template>
