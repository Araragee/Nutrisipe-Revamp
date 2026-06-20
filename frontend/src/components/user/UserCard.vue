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
  <div
    class="flex items-center justify-between gap-3 rounded-2xl p-3 transition-colors duration-200 ease-revamp hover:bg-background-secondary"
  >
    <RouterLink :to="`/profile/${user.id}`" class="flex min-w-0 flex-1 items-center gap-3">
      <UserAvatar :user="user" size="md" />
      <div class="min-w-0">
        <p class="truncate font-montserrat text-sm font-bold text-text">{{ user.displayName }}</p>
        <p class="truncate text-xs text-text-dim">@{{ user.username }}</p>
        <p class="text-xs text-text-dim">
          <span class="tabular-nums">{{ formatNumber(user.followerCount) }}</span> followers
        </p>
      </div>
    </RouterLink>

    <div class="shrink-0">
      <FollowButton :user-id="user.id" :is-following="user.isFollowing" size="sm" />
    </div>
  </div>
</template>
