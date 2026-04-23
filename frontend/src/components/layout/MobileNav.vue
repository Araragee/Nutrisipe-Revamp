<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CreatePostModal from '@/components/post/CreatePostModal.vue'
import UserSearchModal from '@/components/user/UserSearchModal.vue'
import NotificationBell from '@/components/notifications/NotificationBell.vue'

const route = useRoute()
const authStore = useAuthStore()
const showCreateModal = ref(false)
const showSearchModal = ref(false)

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <!-- Mobile Bottom Navigation -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
    <div class="flex items-center justify-around h-16">
      <!-- Home -->
      <RouterLink
        to="/"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full transition-colors',
          isActive('/') ? 'text-orange-500' : 'text-gray-600 dark:text-gray-400'
        ]"
      >
        <svg class="w-6 h-6" :fill="isActive('/') ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-xs mt-1">Home</span>
      </RouterLink>

      <!-- Search -->
      <button
        @click="showSearchModal = true"
        class="flex flex-col items-center justify-center flex-1 h-full text-gray-600 dark:text-gray-400 transition-colors active:text-orange-500"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="text-xs mt-1">Search</span>
      </button>

      <!-- Create Post -->
      <button
        @click="showCreateModal = true"
        class="flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95"
      >
        <div class="w-12 h-12 -mt-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>

      <!-- Notifications -->
      <div class="flex flex-col items-center justify-center flex-1 h-full">
        <NotificationBell />
        <span class="text-xs mt-1 text-gray-600 dark:text-gray-400">Alerts</span>
      </div>

      <!-- Profile -->
      <RouterLink
        v-if="authStore.user"
        :to="`/profile/${authStore.user.id}`"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full transition-colors',
          route.path.startsWith('/profile') ? 'text-orange-500' : 'text-gray-600 dark:text-gray-400'
        ]"
      >
        <svg class="w-6 h-6" :fill="route.path.startsWith('/profile') ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-xs mt-1">Profile</span>
      </RouterLink>
    </div>

    <!-- Modals -->
    <CreatePostModal :show="showCreateModal" @close="showCreateModal = false" @created="showCreateModal = false" />
    <UserSearchModal :show="showSearchModal" @close="showSearchModal = false" />
  </nav>
</template>

<style scoped>
/* Safe area for devices with notches */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
