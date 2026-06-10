<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import UserAvatar from '@/components/user/UserAvatar.vue'
import { formatTimeAgo } from '@/utils/format'
import { resolveImage } from '@/utils/imageUrl'

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const notificationsStore = useNotificationsStore()
const activeTab = ref<'all' | 'unread'>('all')

const filteredNotifications = computed(() => {
  if (activeTab.value === 'unread') {
    return notificationsStore.notifications.filter(n => !n.isRead)
  }
  return notificationsStore.notifications
})

function handleClickOutside(event: MouseEvent) {
  const dropdown = document.querySelector('.notification-dropdown')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  notificationsStore.fetchNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

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

const getActionIcon = (type: string) => {
  switch (type) {
    case 'like': return '❤️'
    case 'comment': return '💬'
    case 'follow': return '👤'
    case 'save': return '🔖'
    default: return '🔔'
  }
}

const getActionBg = (type: string) => {
  switch (type) {
    case 'like': return 'bg-red-500'
    case 'comment': return 'bg-blue-500'
    case 'follow': return 'bg-green-500'
    case 'save': return 'bg-orange'
    default: return 'bg-gray-500'
  }
}
</script>

<template>
  <div class="notification-dropdown absolute right-0 mt-2 w-[420px] bg-white/95 dark:bg-background-secondary/95 backdrop-blur-xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-glass-border z-50 overflow-hidden animate-revamp">
    <!-- Header -->
    <div class="p-6 pb-4 flex items-center justify-between">
      <h3 class="font-montserrat font-extrabold text-2xl text-text">Notifications</h3>
      <button 
        @click="handleMarkAllAsRead"
        class="text-sm font-bold text-orange hover:text-orange-dark transition-colors"
      >
        Mark all read
      </button>
    </div>

    <!-- Tabs -->
    <div class="px-6 flex gap-6 border-b border-glass-border">
      <button 
        @click="activeTab = 'all'"
        :class="['pb-3 text-sm font-bold transition-all relative', activeTab === 'all' ? 'text-text' : 'text-text-dim hover:text-text']"
      >
        All
        <div v-if="activeTab === 'all'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange rounded-full"></div>
      </button>
      <button 
        @click="activeTab = 'unread'"
        :class="['pb-3 text-sm font-bold transition-all relative flex items-center gap-2', activeTab === 'unread' ? 'text-text' : 'text-text-dim hover:text-text']"
      >
        Unread
        <span v-if="notificationsStore.unreadCount > 0" class="px-2 py-0.5 rounded-full bg-orange text-white text-[10px] font-black">
          {{ notificationsStore.unreadCount }}
        </span>
        <div v-if="activeTab === 'unread'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange rounded-full"></div>
      </button>
    </div>

    <!-- Content -->
    <div class="max-h-[500px] overflow-y-auto scrollbar-hide py-2">
      <div v-if="notificationsStore.isLoading && notificationsStore.notifications.length === 0" class="p-10 text-center">
        <div class="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-text-dim text-sm font-medium">Fetching updates...</p>
      </div>

      <div v-else-if="filteredNotifications.length === 0" class="p-16 text-center">
        <div class="text-4xl mb-4 opacity-20">🔔</div>
        <p class="text-text-dim font-bold">All caught up!</p>
        <p class="text-text-dim/60 text-xs mt-1">No new notifications for you right now.</p>
      </div>

      <div v-else>
        <div 
          v-for="n in filteredNotifications" 
          :key="n.id"
          @click="handleNotificationClick(n)"
          class="group flex items-start gap-4 p-5 hover:bg-orange/5 cursor-pointer transition-all border-b border-glass-border/50 last:border-0 relative"
        >
          <!-- Unread Dot -->
          <div v-if="!n.isRead" class="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange rounded-full"></div>

          <!-- Avatar + Icon -->
          <div class="relative shrink-0">
            <UserAvatar :user="n.actor" size="md" class="border-2 border-glass-border shadow-sm" />
            <div :class="['absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-md border-2 border-white dark:border-background-secondary', getActionBg(n.type)]">
              {{ getActionIcon(n.type) }}
            </div>
          </div>

          <!-- Text -->
          <div class="flex-1 min-w-0">
            <p class="text-[13px] leading-snug text-text">
              <span class="font-extrabold">{{ n.actor.displayName }}</span>
              <span class="text-text-muted mx-1">
                {{ n.type === 'like' ? 'liked your recipe' : n.type === 'comment' ? 'commented on' : n.type === 'follow' ? 'started following you' : n.type === 'mention' ? 'mentioned you in' : n.type === 'rating' ? 'rated your recipe' : n.type === 'variation' ? 'forked your recipe' : 'interacted with' }}
              </span>
              <span v-if="n.post" class="font-extrabold">{{ n.post.title }}</span>
            </p>
            <p class="text-[11px] text-text-dim mt-1 font-medium">{{ formatTimeAgo(n.createdAt) }}</p>
          </div>

          <!-- Post Thumbnail -->
          <div v-if="n.post" class="shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-glass-border">
            <img :src="resolveImage(n.post.imageUrl, n.post.id)" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 bg-background-secondary/50 text-center border-t border-glass-border">
      <button @click="emit('close')" class="text-xs font-bold text-text-dim hover:text-orange transition-all">Close</button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { scrollbar-width: none; }

@keyframes revamp {
  from { opacity: 0; transform: translateY(10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-revamp {
  animation: revamp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
