<script setup lang="ts">
import { computed } from 'vue'

interface UserBasic {
  id: string
  displayName: string
  avatarUrl?: string | null
}

const props = withDefaults(
  defineProps<{
    users: UserBasic[]
    max?: number
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    max: 5,
    size: 'sm'
  }
)

const visibleUsers = computed(() => {
  return props.users.slice(0, props.max)
})

const remainingCount = computed(() => {
  return Math.max(0, props.users.length - props.max)
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'lg':
      return 'w-10 h-10 -ml-3'
    case 'md':
      return 'w-8 h-8 -ml-2'
    case 'sm':
    default:
      return 'w-6 h-6 -ml-1.5'
  }
})
</script>

<template>
  <div class="flex items-center">
    <div class="flex mr-2">
      <img
        v-for="(user, index) in visibleUsers"
        :key="user.id"
        :src="user.avatarUrl || '/default-avatar.png'"
        :alt="user.displayName"
        :title="user.displayName"
        :class="[
          'rounded-full border-2 border-white dark:border-zinc-800 object-cover shrink-0 transition-transform hover:-translate-y-0.5 first:ml-0',
          sizeClasses
        ]"
        :style="{ zIndex: visibleUsers.length - index }"
      />
    </div>
    <span v-if="remainingCount > 0" class="text-xs font-bold text-text-dim">
      +{{ remainingCount }}
    </span>
  </div>
</template>
