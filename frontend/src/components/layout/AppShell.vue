<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { socketService } from '@/services/socket'
import UserAvatar from '@/components/user/UserAvatar.vue'
import NotificationDropdown from '@/components/notifications/NotificationDropdown.vue'

const props = defineProps<{
  showShell: boolean
}>()

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()
const isCollapsed = ref(false)
const showNotifs = ref(false)

const navItems = computed(() => {
  const items = [
    { id: 'home', icon: '🏠', label: 'Discover', path: '/' },
    { id: 'explore', icon: '🧭', label: 'Explore', path: '/explore' },
    { id: 'saved', icon: '🔖', label: 'Saved', path: '/saved' },
    { id: 'following', icon: '🫂', label: 'Feed', path: '/following' },
    { id: 'profile', icon: '👤', label: 'Profile', path: `/profile/${authStore.user?.id}` },
  ]

  if (authStore.isAdmin) {
    items.push({ id: 'admin', icon: '🛡️', label: 'Admin', path: '/admin' })
  }

  items.push({ id: 'settings', icon: '⚙️', label: 'Settings', path: '/settings' })
  return items
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

function handleNewNotification(notification: any) {
  notificationsStore.notifications.unshift(notification)
  notificationsStore.unreadCount++
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    notificationsStore.fetchNotifications()
    socketService.onNotificationNew(handleNewNotification)
  }
})

onUnmounted(() => {
  socketService.offNotificationNew(handleNewNotification)
})
</script>

<template>
  <div v-if="showShell" class="app-shell flex h-screen overflow-hidden bg-background">
    <!-- Desktop Sidebar -->
    <aside
      :class="[
        'sidebar hidden md:flex flex-col h-full bg-surface-solid border-r-1.5 border-glass-border transition-all duration-revamp relative z-40',
        isCollapsed ? 'w-0 opacity-0 pointer-events-none -translate-x-4' : 'w-64'
      ]"
    >
      <div class="sidebar-header-row flex items-center justify-between p-6 pb-5">
        <div class="sidebar-logo font-montserrat font-extrabold text-xl">
          Nutri<span class="text-orange">sipe</span>
        </div>
        <div class="relative">
          <button
            @click="showNotifs = !showNotifs"
            class="sidebar-bell w-8.5 h-8.5 rounded-xl border-1.5 border-glass-border flex items-center justify-center text-text-muted hover:border-orange hover:text-orange hover:bg-orange-soft transition-all relative"
          >
            <span class="text-lg">🔔</span>
            <span v-if="notificationsStore.unreadCount > 0" class="badge absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange text-white text-[8px] font-extrabold flex items-center justify-center border-2 border-background">{{ notificationsStore.unreadCount }}</span>
          </button>
          <NotificationDropdown v-if="showNotifs" @close="showNotifs = false" class="absolute left-0 mt-2 z-50" />
        </div>
      </div>

      <nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.id"
          :to="item.path"
          class="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:bg-orange-soft hover:text-orange transition-all"
          active-class="bg-orange-soft text-orange font-bold"
        >
          <span class="text-lg">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="sidebar-spacer flex-1"></div>

      <!-- Personalized Tags -->
      <div v-if="authStore.user?.preferences" class="px-6 mb-6">
        <h3 class="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-3">Quick Filters</h3>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="tag in JSON.parse(authStore.user.preferences.dietary || '[]').slice(0, 5)"
            :key="tag"
            :to="`/?scope=all&tag=${tag}`"
            class="px-2.5 py-1 rounded-lg bg-background-secondary text-[11px] font-semibold text-text-muted hover:text-orange hover:bg-orange-soft transition-all"
          >
            #{{ tag }}
          </RouterLink>
        </div>
      </div>
      <div v-if="authStore.user" class="sidebar-user p-4 m-4 rounded-2xl hover:bg-background-secondary transition-all cursor-pointer">
        <div class="flex items-center gap-3">
          <UserAvatar :user="authStore.user" size="md" class="border-2 border-orange" />
          <div class="flex-1 min-w-0">
            <p class="font-bold text-[13px] text-text truncate">{{ authStore.user.displayName }}</p>
            <p class="text-[11px] text-text-dim truncate">@{{ authStore.user.username }}</p>
          </div>
          <button @click="handleLogout" class="text-text-dim hover:text-orange">🚪</button>
        </div>
      </div>

      <button
        @click="toggleSidebar"
        class="sidebar-collapse-btn absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-surface-solid border-1.5 border-glass-border rounded-full flex items-center justify-center text-text-dim hover:bg-orange-soft hover:text-orange hover:w-7 transition-all z-50 shadow-sm"
        :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <span>{{ isCollapsed ? '›' : '‹' }}</span>
      </button>
    </aside>

    <!-- Floating Dock (when sidebar is collapsed) -->
    <div
      v-if="isCollapsed"
      class="floating-dock fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-4 p-3 bg-surface/90 backdrop-blur-xl border-1.5 border-glass-border rounded-full shadow-modal animate-revamp"
    >
      <RouterLink
        v-for="item in navItems"
        :key="item.id"
        :to="item.path"
        class="w-11 h-11 flex items-center justify-center rounded-full text-text-muted hover:bg-orange-soft hover:text-orange transition-all"
        active-class="bg-orange text-white shadow-card"
        :title="item.label"
      >
        <span class="text-lg">{{ item.icon }}</span>
      </RouterLink>
      <div class="h-px bg-glass-border mx-2"></div>
      <button @click="isCollapsed = false" class="w-11 h-11 flex items-center justify-center rounded-full text-text-muted hover:bg-orange-soft hover:text-orange">
        <span>›</span>
      </button>
    </div>

    <!-- Main Content Area -->
    <main
      :class="[
        'main-content flex-1 overflow-y-auto relative transition-all duration-revamp',
      ]"
    >
      <slot />
    </main>

    <!-- Mobile Top App Bar -->
    <div class="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-glass-border flex items-center justify-between px-5 z-40">
      <div class="font-montserrat font-extrabold text-lg">Nutri<span class="text-orange">sipe</span></div>
      <button @click="showNotifs = !showNotifs" class="w-9 h-9 rounded-full bg-orange-soft text-orange flex items-center justify-center relative">
        <span>🔔</span>
        <span v-if="notificationsStore.unreadCount > 0" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange text-white text-[9px] font-bold flex items-center justify-center border-2 border-surface">{{ notificationsStore.unreadCount }}</span>
      </button>
      <NotificationDropdown v-if="showNotifs" @close="showNotifs = false" class="fixed top-16 right-4 z-50 w-[calc(100vw-32px)] max-w-sm" />
    </div>

    <!-- Mobile Bottom Nav -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-8 z-40 pointer-events-none">
      <div class="bottom-nav-inner bg-surface/90 backdrop-blur-2xl border-1.5 border-glass-border rounded-3xl flex items-center justify-around p-2 shadow-modal pointer-events-auto">
        <RouterLink
          v-for="item in navItems.slice(0, 2)"
          :key="item.id"
          :to="item.path"
          class="flex flex-col items-center gap-1 p-2 text-text-dim"
          active-class="text-orange"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="text-[10px] font-bold">{{ item.label }}</span>
        </RouterLink>

        <button @click="router.push('/recipes/create')" class="bottom-nav-plus w-14 h-14 rounded-full bg-gradient-to-br from-orange to-orange-light text-white flex items-center justify-center shadow-lg -translate-y-4 border-4 border-background transition-transform active:scale-95">
          <span class="text-2xl">+</span>
        </button>

        <RouterLink
          v-for="item in navItems.slice(2, 4)"
          :key="item.id"
          :to="item.path"
          class="flex flex-col items-center gap-1 p-2 text-text-dim"
          active-class="text-orange"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="text-[10px] font-bold">{{ item.label }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
  <div v-else class="h-full">
    <slot />
  </div>
</template>

<style scoped>
.sidebar-bell .badge {
  box-shadow: 0 0 0 2px var(--bg);
}
.duration-revamp {
  transition-duration: 0.38s;
}
.animate-revamp {
  animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes slideIn {
  from { opacity: 0; transform: translate(-20px, -50%); }
  to { opacity: 1; transform: translate(0, -50%); }
}
</style>
