<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  color?: string
}>()

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}
</script>

<template>
  <div class="flex items-center justify-center">
    <div
      :class="[sizeClasses[size || 'md'], color || 'border-orange-500']"
      class="animate-spin rounded-full border-b-2"
    ></div>
  </div>
</template>
