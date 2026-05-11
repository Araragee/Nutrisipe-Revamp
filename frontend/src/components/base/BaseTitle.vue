<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
  color?: 'default' | 'muted' | 'dim' | 'orange' | 'white'
  tracking?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'h2',
  weight: 'bold',
  color: 'default',
  tracking: 'tight',
})

const sizeClasses = computed(() => {
  if (props.size) {
    switch (props.size) {
      case 'xs': return 'text-xs'
      case 'sm': return 'text-sm'
      case 'base': return 'text-base'
      case 'lg': return 'text-lg'
      case 'xl': return 'text-xl'
      case '2xl': return 'text-2xl'
      case '3xl': return 'text-3xl'
      case '4xl': return 'text-4xl'
      case '5xl': return 'text-5xl'
    }
  }

  // Default sizes based on tag
  switch (props.as) {
    case 'h1': return 'text-4xl md:text-5xl'
    case 'h2': return 'text-3xl md:text-4xl'
    case 'h3': return 'text-2xl md:text-3xl'
    case 'h4': return 'text-xl md:text-2xl'
    case 'h5': return 'text-lg'
    case 'h6': return 'text-base'
    default: return 'text-base'
  }
})

const weightClasses = computed(() => {
  switch (props.weight) {
    case 'normal': return 'font-normal'
    case 'medium': return 'font-medium'
    case 'semibold': return 'font-semibold'
    case 'bold': return 'font-bold'
    case 'extrabold': return 'font-extrabold'
    case 'black': return 'font-black'
    default: return 'font-bold'
  }
})

const colorClasses = computed(() => {
  switch (props.color) {
    case 'default': return 'text-text'
    case 'muted': return 'text-text-muted'
    case 'dim': return 'text-text-dim'
    case 'orange': return 'text-orange'
    case 'white': return 'text-white'
    default: return 'text-text'
  }
})

const trackingClasses = computed(() => {
  switch (props.tracking) {
    case 'tighter': return 'tracking-tighter'
    case 'tight': return 'tracking-tight'
    case 'normal': return 'tracking-normal'
    case 'wide': return 'tracking-wide'
    case 'wider': return 'tracking-wider'
    default: return 'tracking-tight'
  }
})
</script>

<template>
  <component
    :is="as"
    class="font-montserrat"
    :class="[sizeClasses, weightClasses, colorClasses, trackingClasses]"
  >
    <slot />
  </component>
</template>
