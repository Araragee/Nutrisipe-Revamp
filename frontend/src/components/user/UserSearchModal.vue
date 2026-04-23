<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usersApi } from '@/http/endpoints/users'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/ui'
import { debounce } from '@/utils/debounce'
import UserAvatar from './UserAvatar.vue'
import type { User } from '@/typescript/interface/User'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const usersStore = useUsersStore()
const uiStore = useUiStore()

const searchQuery = ref('')
const searchResults = ref<User[]>([])
const isSearching = ref(false)

watch(() => props.show, (show) => {
  if (show) {
    searchQuery.value = ''
    searchResults.value = []
  }
})

const performSearch = debounce(async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const response = await usersApi.search(searchQuery.value.trim())
    searchResults.value = response.data.data
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}, 300)

watch(searchQuery, () => {
  performSearch()
})

function handleUserClick(userId: string) {
  router.push(`/profile/${userId}`)
  emit('close')
}

async function handleFollow(event: Event, userId: string) {
  event.stopPropagation()
  try {
    await usersStore.followUser(userId)
    const user = searchResults.value.find((u) => u.id === userId)
    if (user) {
      user.isFollowing = true
    }
    uiStore.showToast('Following user', 'success')
  } catch (error) {
    uiStore.showToast('Failed to follow user', 'error')
  }
}

async function handleUnfollow(event: Event, userId: string) {
  event.stopPropagation()
  try {
    await usersStore.unfollowUser(userId)
    const user = searchResults.value.find((u) => u.id === userId)
    if (user) {
      user.isFollowing = false
    }
    uiStore.showToast('Unfollowed user', 'success')
  } catch (error) {
    uiStore.showToast('Failed to unfollow user', 'error')
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20"
    @click="emit('close')"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4"
      @click.stop
    >
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search for users..."
            autofocus
            class="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <svg
            class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <div v-if="isSearching" class="p-8 text-center text-gray-500 dark:text-gray-400">
          Searching...
        </div>

        <div
          v-else-if="searchQuery && searchResults.length === 0"
          class="p-8 text-center text-gray-500 dark:text-gray-400"
        >
          No users found
        </div>

        <div
          v-else-if="!searchQuery"
          class="p-8 text-center text-gray-500 dark:text-gray-400"
        >
          Start typing to search for users
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
          <div
            v-for="user in searchResults"
            :key="user.id"
            @click="handleUserClick(user.id)"
            class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <UserAvatar :user="user" size="md" />

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 dark:text-white truncate">
                {{ user.displayName }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                @{{ user.username }}
              </p>
              <p v-if="user.bio" class="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                {{ user.bio }}
              </p>
            </div>

            <button
              v-if="user.isFollowing"
              @click="(e) => handleUnfollow(e, user.id)"
              class="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
            >
              Following
            </button>
            <button
              v-else
              @click="(e) => handleFollow(e, user.id)"
              class="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 rounded-full text-white transition-all"
            >
              Follow
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
