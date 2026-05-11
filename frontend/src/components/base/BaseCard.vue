<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'glass' | 'solid' | 'flat' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'glass',
  padding: 'md',
  hover: false,
  rounded: '2xl',
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'glass':
      return 'bg-glass backdrop-blur-[24px] saturate-[120%] border border-glass-border shadow-sm dark:bg-[#0f0d15]/86 dark:border-white/10'
    case 'solid':
      return 'bg-surface-solid border border-glass-border shadow-md'
    case 'flat':
      return 'bg-background-secondary'
    case 'outline':
      return 'bg-transparent border-1.5 border-glass-border'
    default:
      return ''
  }
})

const paddingClasses = computed(() => {
  switch (props.padding) {
    case 'none': return 'p-0'
    case 'sm': return 'p-3'
    case 'md': return 'p-4'
    case 'lg': return 'p-6'
    default: return 'p-4'
  }
})

const roundedClasses = computed(() => {
  switch (props.rounded) {
    case 'sm': return 'rounded-sm'
    case 'md': return 'rounded-md'
    case 'lg': return 'rounded-lg'
    case 'xl': return 'rounded-xl'
    case '2xl': return 'rounded-[20px]'
    case '3xl': return 'rounded-[32px]'
    case 'full': return 'rounded-full'
    default: return 'rounded-[20px]'
  }
})

const hoverClasses = computed(() => {
  if (!props.hover) return ''
  return 'transition-all duration-revamp hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]'
})
</script>

<template>
  <div :class="[variantClasses, paddingClasses, roundedClasses, hoverClasses]">
    <slot />
  </div>
</template>
