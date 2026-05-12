<script setup lang="ts">
import { computed } from 'vue'
import * as Icons from '@heroicons/vue/24/outline'
import * as SolidIcons from '@heroicons/vue/24/solid'

interface Props {
  name: string
  solid?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  customSize?: string
}

const props = withDefaults(defineProps<Props>(), {
  solid: false,
  size: 'md',
})

const iconComponent = computed(() => {
  const iconName = props.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Icon'

  const source = props.solid ? SolidIcons : Icons
  return (source as any)[iconName] || Icons.QuestionMarkCircleIcon
})

const sizeClasses = computed(() => {
  if (props.size === 'custom') return props.customSize || ''

  switch (props.size) {
    case 'xs': return 'w-3 h-3'
    case 'sm': return 'w-4 h-4'
    case 'md': return 'w-5 h-5'
    case 'lg': return 'w-6 h-6'
    case 'xl': return 'w-8 h-8'
    default: return 'w-5 h-5'
  }
})
</script>

<template>
  <component
    :is="iconComponent"
    :class="sizeClasses"
    aria-hidden="true"
  />
</template>
