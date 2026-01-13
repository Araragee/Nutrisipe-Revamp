<script setup lang="ts">
import { RouterLink } from 'vue-router'
import UserAvatar from './UserAvatar.vue'
import FollowButton from './FollowButton.vue'
import { formatNumber } from '@/utils/format'
import type { User } from '@/typescript/interface/User'

interface Props {
  user: User
}

defineProps<Props>()
</script>

<template>
  <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition">
    <RouterLink :to="`/profile/${user.id}`" class="flex items-center min-w-0 flex-1">
      <UserAvatar :user="user" size="md" />
      <div class="ml-3 min-w-0">
        <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">
          {{ user.displayName }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
          @{{ user.username }}
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500">
          {{ formatNumber(user.followerCount) }} followers
        </p>
      </div>
    </RouterLink>

    <div class="ml-2 shrink-0">
      <FollowButton :user-id="user.id" :is-following="user.isFollowing" />
    </div>
  </div>
</template>
