<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import UserAvatar from '@/components/user/UserAvatar.vue'
import { formatTimeAgo } from '@/utils/format'

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const notificationsStore = useNotificationsStore()

function handleClickOutside(event: MouseEvent) {
  const dropdown = document.querySelector('.notification-dropdown')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function getNotificationText(notification: any) {
  switch (notification.type) {
    case 'like':
      return `liked your post "${notification.post?.title}"`
    case 'comment':
      return `commented on your post "${notification.post?.title}"`
    case 'follow':
      return 'started following you'
    default:
      return ''
  }
}

async function handleNotificationClick(notification: any) {
  if (!notification.isRead) {
    await notificationsStore.markAsRead(notification.id)
  }

  if (notification.type === 'follow') {
    router.push(`/profile/${notification.actorId}`)
  } else if (notification.postId) {
    router.push(`/post/${notification.postId}`)
  }

  emit('close')
}

async function handleMarkAllAsRead() {
  try {
    await notificationsStore.markAllAsRead()
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  }
}

async function handleDeleteNotification(event: Event, notificationId: string) {
  event.stopPropagation()
  try {
    await notificationsStore.deleteNotification(notificationId)
  } catch (error) {
    console.error('Failed to delete notification:', error)
  }
}
</script>

<template>
  <div
    class="notification-dropdown absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
  >
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
      <button
        v-if="notificationsStore.unreadCount > 0"
        @click="handleMarkAllAsRead"
        class="text-xs text-primary-base hover:text-primary-dark"
      >
        Mark all as read
      </button>
    </div>

    <div class="max-h-96 overflow-y-auto">
      <div v-if="notificationsStore.isLoading" class="p-4 text-center text-gray-500">
        Loading...
      </div>

      <div
        v-else-if="notificationsStore.notifications.length === 0"
        class="p-8 text-center text-gray-500"
      >
        No notifications yet
      </div>

      <div v-else>
        <div
          v-for="notification in notificationsStore.notifications"
          :key="notification.id"
          @click="handleNotificationClick(notification)"
          class="flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
          :class="{ 'bg-blue-50 dark:bg-blue-900/20': !notification.isRead }"
        >
          <UserAvatar :user="notification.actor" size="sm" />

          <div class="ml-3 flex-1 min-w-0">
            <p class="text-sm text-gray-900 dark:text-white">
              <span class="font-semibold">{{ notification.actor.displayName }}</span>
              {{ getNotificationText(notification) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ formatTimeAgo(notification.createdAt) }}
            </p>
          </div>

          <button
            @click="(e) => handleDeleteNotification(e, notification.id)"
            class="ml-2 p-1 text-gray-400 hover:text-error-base transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
