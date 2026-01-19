<script setup lang="ts">
import { computed } from 'vue'
import type { UserBasic } from '@/typescript/interface/User'

interface Props {
  user: UserBasic
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  }
  return sizes[props.size]
})

const initials = computed(() => {
  if (!props.user.displayName) return '??'
  const names = props.user.displayName.split(' ')
  return names.length > 1
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0].substring(0, 2).toUpperCase()
})
</script>

<template>
  <div
    :class="[
      'rounded-full overflow-hidden flex items-center justify-center bg-primary-base text-white font-semibold border-2 border-primary-base shrink-0',
      sizeClasses,
    ]"
  >
    <img
      v-if="user.avatarUrl"
      :src="user.avatarUrl"
      :alt="user.displayName"
      class="w-full h-full object-cover"
    />
    <span v-else>{{ initials }}</span>
  </div>
</template>
