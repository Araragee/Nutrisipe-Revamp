<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/user/UserAvatar.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import CreatePostModal from '@/components/post/CreatePostModal.vue'
import NotificationBell from '@/components/notifications/NotificationBell.vue'
import UserSearchModal from '@/components/user/UserSearchModal.vue'

const authStore = useAuthStore()
const showCreateModal = ref(false)
const showSearchModal = ref(false)

function handleLogout() {
  authStore.logout()
  window.location.href = '/login'
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Logo -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-primary-base">Nutrisipe</h1>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-2">
      <!-- Create Post Button -->
      <button
        @click="showCreateModal = true"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition shadow-md"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Create Post</span>
      </button>

      <RouterLink
        to="/"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Home</span>
      </RouterLink>

      <button
        @click="showSearchModal = true"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search Users</span>
      </button>

      <RouterLink
        v-if="authStore.user"
        :to="`/profile/${authStore.user.id}`"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Profile</span>
      </RouterLink>

      <div class="flex items-center gap-3 px-4 py-3">
        <NotificationBell />
        <span class="text-gray-700 dark:text-gray-300 font-medium">Notifications</span>
      </div>

      <RouterLink
        to="/settings"
        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Settings</span>
      </RouterLink>
    </nav>

    <!-- Modals -->
    <CreatePostModal :show="showCreateModal" @close="showCreateModal = false" @created="showCreateModal = false" />
    <UserSearchModal :show="showSearchModal" @close="showSearchModal = false" />

    <!-- Current User -->
    <div v-if="authStore.user" class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3 mb-3">
        <UserAvatar :user="authStore.user" size="md" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {{ authStore.user.displayName }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            @{{ authStore.user.username }}
          </p>
        </div>
      </div>

      <BaseButton variant="critical" size="sm" alignment="center" class="w-full" @click="handleLogout">
        Logout
      </BaseButton>
    </div>
  </div>
</template>
