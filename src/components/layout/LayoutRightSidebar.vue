<script setup lang="ts">
import { onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import UserCard from '@/components/user/UserCard.vue'
import { usersApi } from '@/http/endpoints/users'
import { formatTimeAgo } from '@/utils/format'
import type { Activity } from '@/typescript/interface/Activity'
import { ref } from 'vue'

const usersStore = useUsersStore()
const authStore = useAuthStore()
const activities = ref<Activity[]>([])

onMounted(async () => {
  await usersStore.fetchSuggestions(10)

  if (authStore.user) {
    try {
      const response = await usersApi.getActivity(authStore.user.id, 10)
      activities.value = response.data.data
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    }
  }
})
</script>

<template>
  <div class="p-4">
    <!-- Suggested Users -->
    <div class="mb-8">
      <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Suggested Users</h2>

      <div v-if="usersStore.isLoading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="animate-pulse flex items-center p-3">
          <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
          <div class="ml-3 flex-1 space-y-2">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <div v-else-if="usersStore.suggestedUsers.length === 0" class="text-center py-8 text-gray-500">
        No suggestions available
      </div>

      <div v-else class="space-y-2">
        <UserCard
          v-for="user in usersStore.suggestedUsers.slice(0, 10)"
          :key="user.id"
          :user="user"
        />
      </div>
    </div>

    <!-- Recent Activity -->
    <div v-if="activities.length > 0">
      <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
      <div class="space-y-3">
        <div
          v-for="(activity, index) in activities"
          :key="index"
          class="text-sm text-gray-600 dark:text-gray-400"
        >
          <template v-if="activity.type === 'like'">
            <p>
              You liked
              <span class="font-semibold text-gray-900 dark:text-white">{{ activity.post.title }}</span>
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatTimeAgo(activity.createdAt) }}</p>
          </template>
          <template v-else-if="activity.type === 'follow'">
            <p>
              You followed
              <span class="font-semibold text-gray-900 dark:text-white">{{ activity.user.displayName }}</span>
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatTimeAgo(activity.createdAt) }}</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
