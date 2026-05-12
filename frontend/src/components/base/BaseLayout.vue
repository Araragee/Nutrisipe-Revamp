<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'constrained' | 'full' | 'narrow'
  gap?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'constrained',
  gap: 'md',
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'constrained': return 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
    case 'narrow': return 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'
    case 'full': return 'w-full px-4 sm:px-6 lg:px-8'
    default: return 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
  }
})

const gapClasses = computed(() => {
  switch (props.gap) {
    case 'none': return 'space-y-0'
    case 'sm': return 'space-y-4'
    case 'md': return 'space-y-8'
    case 'lg': return 'space-y-12'
    default: return 'space-y-8'
  }
})
</script>

<template>
  <div :class="[variantClasses, gapClasses]">
    <slot />
  </div>
</template>
