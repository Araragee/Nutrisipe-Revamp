<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { socketService } from '@/services/socket'
import UserAvatar from '@/components/user/UserAvatar.vue'
import NotificationDropdown from '@/components/notifications/NotificationDropdown.vue'

defineProps<{ showShell: boolean }>()

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()
const route = useRoute()
const showNotifs = ref(false)
const selectedCategory = computed(() => (route.query.tag as string) || 'All Recipes')

function handleCategoryClick(name: string) {
  if (name === 'All Recipes') {
    router.push({ path: '/', query: { ...route.query, tag: undefined } })
  } else {
    router.push({ path: '/', query: { ...route.query, tag: name } })
  }
}

const CATEGORIES = [
  { name: 'All Recipes', desc: 'Everything on the feed', count: '2.4K', icon: '🍽️', bg: 'bg-orange/10' },
  { name: 'Vegan', desc: '100% plant-powered', count: '342', icon: '🥗', bg: 'bg-green-100' },
  { name: 'High Protein', desc: 'Muscle-fuel meals', count: '189', icon: '💪', bg: 'bg-yellow-100' },
  { name: 'Keto', desc: 'Low carb, high fat', count: '156', icon: '🥑', bg: 'bg-green-50' },
  { name: 'Breakfast', desc: 'Start your day right', count: '98', icon: '🌅', bg: 'bg-blue-50' },
  { name: 'Quick & Easy', desc: 'Under 15 minutes', count: '234', icon: '⚡', bg: 'bg-yellow-50' },
  { name: 'Plant-Based', desc: 'Eco-friendly eats', count: '178', icon: '🌱', bg: 'bg-green-100' },
  { name: 'Dessert', desc: 'Guilt-free sweets', count: '112', icon: '🍰', bg: 'bg-red-50' },
  { name: 'Smoothie', desc: 'Blended drinks', count: '67', icon: '🥤', bg: 'bg-pink-50' },
]

interface NavIcon { d: string[]; fill?: string }
const ICONS: Record<string, string> = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>',
  users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
  user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
}

const navItems = computed(() => {
  const items: { id: string; icon: string; label: string; path: string }[] = [
    { id: 'home', icon: 'home', label: 'Discover', path: '/' },
    { id: 'explore', icon: 'compass', label: 'Explore', path: '/explore' },
    { id: 'saved', icon: 'bookmark', label: 'Saved', path: '/saved' },
    { id: 'following', icon: 'users', label: 'Feed', path: '/following' },
    { id: 'profile', icon: 'user', label: 'Profile', path: `/profile/${authStore.user?.id}` },
  ]
  if (authStore.isAdmin) items.push({ id: 'admin', icon: 'shield', label: 'Admin', path: '/admin' })
  items.push({ id: 'settings', icon: 'settings', label: 'Settings', path: '/settings' })
  return items
})

interface SuggestedCreator { id: string; name: string; handle: string; avatar: string; why: string }
const suggestedCreators = ref<SuggestedCreator[]>([
  { id: 's1', name: 'James Rivera',  handle: '@jamesgrills', avatar: 'https://picsum.photos/80/80?random=12', why: 'You liked his salmon recipe' },
  { id: 's2', name: 'Yuki Tanaka',   handle: '@yukikitchen', avatar: 'https://picsum.photos/80/80?random=14', why: 'Popular in Plant-Based' },
  { id: 's3', name: 'Sofia Reyes',   handle: '@sofiafit',    avatar: 'https://picsum.photos/80/80?random=15', why: 'Trending in Smoothies' },
  { id: 's4', name: 'Marco Bruno',   handle: '@chefmarco',   avatar: 'https://picsum.photos/80/80?random=16', why: 'Top Keto creator' },
])
const followedSet = ref<Set<string>>(new Set())
const toggleFollow = (id: string) => {
  const next = new Set(followedSet.value)
  next.has(id) ? next.delete(id) : next.add(id)
  followedSet.value = next
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
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
  <div v-if="showShell" class="app-shell flex h-screen overflow-hidden bg-background relative">
    <!-- ── Left sidebar (web): glass cards stack ── -->
    <aside class="left-sidebar hidden md:flex w-[220px] shrink-0 flex-col gap-3 p-3 overflow-y-auto scrollbar-hide z-40">
      <!-- Card 1: Logo + Nav -->
      <div class="ls-card overflow-hidden rounded-[20px]">
        <div class="flex items-center gap-2.5 px-3 pt-3 pb-2.5 border-b border-glass-border">
          <RouterLink to="/" class="logo-mark w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 cursor-pointer" aria-label="Home">
            <svg viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-[22px] h-[26px]">
              <path class="n-path" d="M 4,25 C 4,18 4,9 5,4 C 9,10 13,19 17,25 C 17,17 17,9 18,4"
                stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
          <div class="font-montserrat font-black text-base tracking-tight text-text">
            Nutri<span class="text-orange">sipe</span>
          </div>
        </div>
        <nav class="p-2 flex flex-col gap-0.5">
          <RouterLink
            v-for="item in navItems" :key="item.id"
            :to="item.path"
            class="ls-nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-[13px] text-text-muted hover:bg-orange/10 hover:text-orange transition-all"
            active-class="bg-orange/10 text-orange font-bold"
          >
            <span class="w-[17px] h-[17px] inline-flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[item.icon]"></svg>
            </span>
            <span class="text-[13px] font-medium">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <!-- Card 2: Suggested creators -->
      <div class="ls-card overflow-hidden rounded-[20px] px-3 py-3">
        <div class="font-montserrat font-extrabold text-[11px] text-text mb-2.5 tracking-wider">Suggested for You</div>
        <div>
          <div v-for="c in suggestedCreators" :key="c.id" class="flex items-center gap-2 py-2 border-b border-glass-border last:border-0 last:pb-0">
            <RouterLink :to="`/profile/${c.id}`" class="flex items-center gap-2 flex-1 min-w-0 group">
              <div class="w-[34px] h-[34px] rounded-full overflow-hidden border-2 border-glass-border group-hover:border-orange transition-all shrink-0">
                <img :src="c.avatar" :alt="c.name" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-bold text-text truncate group-hover:text-orange transition-colors">{{ c.name }}</div>
                <div class="text-[10px] text-text-dim truncate mt-0.5">{{ c.why }}</div>
              </div>
            </RouterLink>
            <button
              @click="toggleFollow(c.id)"
              :class="[
                'shrink-0 px-2.5 py-1 rounded-full border-1.5 border-orange font-montserrat font-bold text-[10px] transition-all',
                followedSet.has(c.id) ? 'bg-orange text-white' : 'bg-transparent text-orange hover:bg-orange hover:text-white',
              ]"
            >{{ followedSet.has(c.id) ? '✓' : 'Follow' }}</button>
          </div>
        </div>
      </div>

      <!-- Card 3 (account/logout) -->
      <div v-if="authStore.user" class="ls-card overflow-hidden rounded-[20px] p-3">
        <div class="flex items-center gap-2.5">
          <UserAvatar :user="authStore.user" size="sm" class="border-2 border-orange shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-bold text-[12px] text-text truncate">{{ authStore.user.displayName }}</p>
            <p class="text-[10px] text-text-dim truncate">@{{ authStore.user.username }}</p>
          </div>
          <button @click="handleLogout" class="w-7 h-7 rounded-lg text-text-dim hover:text-orange hover:bg-orange/10 flex items-center justify-center transition-all" aria-label="Logout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS.logout"></svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Main Content ── -->
    <main class="main-content flex-1 overflow-y-auto relative scrollbar-hide">
      <slot />
    </main>

    <!-- ── Right panel (web): actions + bell ── -->
    <aside class="right-panel hidden lg:flex w-[280px] shrink-0 flex-col gap-3 p-3 overflow-y-auto scrollbar-hide z-30">
      <div class="ls-card rounded-[32px] p-3.5 flex items-center gap-2">
        <button
          @click="router.push('/recipes/create')"
          class="flex-1 px-2.5 py-2.5 rounded-3xl bg-gradient-to-br from-orange to-orange-light text-white font-montserrat font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-[0_4px_14px_var(--orange-glow)] hover:opacity-90 hover:-translate-y-0.5 transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" v-html="ICONS.plus"></svg>
          Share Recipe
        </button>
        <div class="relative">
          <button
            @click="showNotifs = !showNotifs"
            :class="[
              'w-9 h-9 rounded-[11px] border-1.5 border-glass-border flex items-center justify-center transition-all relative',
              showNotifs ? 'border-orange text-orange bg-orange/10' : 'text-text-muted hover:border-orange hover:text-orange hover:bg-orange/10',
            ]"
            aria-label="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS.bell"></svg>
            <span v-if="notificationsStore.unreadCount > 0" class="absolute -top-1 -right-1 w-[15px] h-[15px] rounded-full bg-orange text-white text-[8px] font-extrabold flex items-center justify-center border-2 border-background">{{ notificationsStore.unreadCount }}</span>
          </button>
          <NotificationDropdown v-if="showNotifs" @close="showNotifs = false" class="absolute right-0 top-12 z-50" />
        </div>
        <RouterLink v-if="authStore.user" :to="`/profile/${authStore.user.id}`" class="w-[34px] h-[34px] rounded-full overflow-hidden border-2 border-orange hover:scale-110 transition-transform shrink-0">
          <UserAvatar :user="authStore.user" size="sm" class="!w-full !h-full" />
        </RouterLink>
      </div>

      <!-- Categories Section -->
      <div class="ls-card rounded-[32px] p-3 flex flex-col gap-3">
        <h3 class="font-montserrat font-extrabold text-xl text-text">Categories</h3>
        <div class="flex flex-col gap-1.5">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.name"
            @click="handleCategoryClick(cat.name)"
            :class="[
              'flex items-center gap-3.5 p-3.5 rounded-3xl transition-all border-1.5',
              selectedCategory === cat.name
                ? 'bg-orange/5 border-orange shadow-[0_4px_12px_rgba(255,107,53,0.12)]'
                : 'bg-transparent border-transparent hover:bg-background-secondary'
            ]"
          >
            <div :class="['w-11 h-11 rounded-[15px] flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110', cat.bg]">
              {{ cat.icon }}
            </div>
            <div class="flex-1 text-left min-w-0">
              <div class="flex gap-1.5 flex-nowrap justify-between">
                <span class="text-[14px] font-bold text-text truncate tracking-tight break-keep">
                  {{ cat.name }}
                </span>
                 <div :class="[
              'px-2.5 py-1 rounded-full text-[10px] font-extrabold tabular-nums ',
              selectedCategory === cat.name ? 'bg-orange/20 text-orange bg-orange-600/10' : 'bg-background-secondary text-text-dim'
            ]">
              {{ cat.count }}
            </div>
              </div>
              <div class="text-[11px] text-text-dim mt-0.5">{{ cat.desc }}</div>
            </div>
           
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Mobile Top App Bar ── -->
    <div class="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-glass-border flex items-center justify-between px-5 z-40">
      <RouterLink to="/" class="flex items-center gap-2">
        <span class="logo-mark w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 22 28" fill="none" class="w-[20px] h-[24px]">
            <path class="n-path" d="M 4,25 C 4,18 4,9 5,4 C 9,10 13,19 17,25 C 17,17 17,9 18,4"
              stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="font-montserrat font-extrabold text-lg">Nutri<span class="text-orange">sipe</span></span>
      </RouterLink>
      <button @click="showNotifs = !showNotifs" class="w-9 h-9 rounded-full bg-orange/10 text-orange flex items-center justify-center relative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS.bell"></svg>
        <span v-if="notificationsStore.unreadCount > 0" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange text-white text-[9px] font-bold flex items-center justify-center border-2 border-surface">{{ notificationsStore.unreadCount }}</span>
      </button>
      <NotificationDropdown v-if="showNotifs" @close="showNotifs = false" class="fixed top-16 right-4 z-50 w-[calc(100vw-32px)] max-w-sm" />
    </div>

    <!-- ── Mobile Bottom Nav ── -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-8 z-40 pointer-events-none">
      <div class="bg-surface/90 backdrop-blur-2xl border-1.5 border-glass-border rounded-3xl flex items-center justify-around p-2 shadow-modal pointer-events-auto">
        <RouterLink
          v-for="item in navItems.slice(0, 2)" :key="item.id"
          :to="item.path"
          class="flex flex-col items-center gap-1 p-2 text-text-dim"
          active-class="text-orange"
        >
          <span class="w-[22px] h-[22px] inline-flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[item.icon]"></svg>
          </span>
          <span class="text-[10px] font-bold">{{ item.label }}</span>
        </RouterLink>

        <button @click="router.push('/recipes/create')" class="w-14 h-14 rounded-full bg-gradient-to-br from-orange to-orange-light text-white flex items-center justify-center shadow-lg -translate-y-4 border-4 border-background transition-transform active:scale-95">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" v-html="ICONS.plus"></svg>
        </button>

        <RouterLink
          v-for="item in navItems.slice(2, 4)" :key="item.id"
          :to="item.path"
          class="flex flex-col items-center gap-1 p-2 text-text-dim"
          active-class="text-orange"
        >
          <span class="w-[22px] h-[22px] inline-flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[item.icon]"></svg>
          </span>
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
.ls-card {
  background: var(--glass);
  backdrop-filter: blur(24px) saturate(120%);
  -webkit-backdrop-filter: blur(24px) saturate(120%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
}
:global(.dark) .ls-card {
  background: rgba(15,13,21,0.86);
  border-color: rgba(255,255,255,0.10);
}

/* Animated N logo mark */
.logo-mark {
  background: linear-gradient(135deg, var(--orange) 0%, var(--orange-light) 100%);
  box-shadow: 0 4px 14px var(--orange-glow);
  animation: markPop 0.5s var(--transition) forwards;
}
@keyframes markPop {
  from { transform: scale(0.7); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes drawN {
  from { stroke-dashoffset: 72; }
  to { stroke-dashoffset: 0; }
}
@keyframes rewriteN {
  0%, 60%, 100% { stroke-dashoffset: 0; }
  65% { stroke-dashoffset: 72; }
}
.n-path {
  stroke-dasharray: 72;
  stroke-dashoffset: 72;
  animation:
    drawN 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s forwards,
    rewriteN 7s ease-in-out 1.5s infinite;
}
</style>
