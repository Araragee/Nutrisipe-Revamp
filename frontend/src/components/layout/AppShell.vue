<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { socketService } from '@/services/socket'
import { usersApi } from '@/http/endpoints/users'
import { socialApi } from '@/http/endpoints/social'
import { resolveImage } from '@/utils/imageUrl'
import UserAvatar from '@/components/user/UserAvatar.vue'
import BaseIcons from '@/components/base/BaseIcons.vue'
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
  { name: 'All Recipes', count: '2.4K', icon: 'squares-2x2', style: 'bg-orange-soft text-orange' },
  { name: 'Vegan', count: '342', icon: 'sparkles', style: 'bg-green-100 text-green-600 dark:bg-green-400/10 dark:text-green-400' },
  { name: 'High Protein', count: '189', icon: 'fire', style: 'bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400' },
  { name: 'Keto', count: '156', icon: 'scale', style: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400' },
  { name: 'Breakfast', count: '98', icon: 'sun', style: 'bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400' },
  { name: 'Quick & Easy', count: '234', icon: 'clock', style: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400' },
  { name: 'Plant-Based', count: '178', icon: 'globe-alt', style: 'bg-teal-100 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400' },
  { name: 'Dessert', count: '112', icon: 'cake', style: 'bg-pink-100 text-pink-600 dark:bg-pink-400/10 dark:text-pink-400' },
  { name: 'Smoothie', count: '67', icon: 'beaker', style: 'bg-purple-100 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400' },
]

interface NavIcon { d: string[]; fill?: string }
const ICONS: Record<string, string> = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  basket: '<path d="M3 6h18l-2 13a2 2 0 01-2 2H7a2 2 0 01-2-2L3 6z"/><path d="M8 6V4a4 4 0 018 0v2"/>',
  users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
  user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
}

const MOBILE_PRIMARY_IDS = ['home', 'saved', 'plan', 'profile'] as const
const showMoreDrawer = ref(false)

const navItems = computed(() => {
  const items: { id: string; icon: string; label: string; path: string }[] = [
    { id: 'home', icon: 'home', label: 'Discover', path: '/' },
    { id: 'explore', icon: 'compass', label: 'Explore', path: '/explore' },
    { id: 'saved', icon: 'bookmark', label: 'Saved', path: '/saved' },
    { id: 'plan', icon: 'calendar', label: 'Plan', path: '/plan' },
    { id: 'groceries', icon: 'basket', label: 'Groceries', path: '/groceries' },
    { id: 'following', icon: 'users', label: 'Feed', path: '/following' },
    { id: 'profile', icon: 'user', label: 'Profile', path: `/profile/${authStore.user?.id}` },
  ]
  if (authStore.isAdmin) items.push({ id: 'admin', icon: 'shield', label: 'Admin', path: '/admin' })
  items.push({ id: 'settings', icon: 'settings', label: 'Settings', path: '/settings' })
  return items
})

const mobilePrimary = computed(() =>
  MOBILE_PRIMARY_IDS.map((id) => navItems.value.find((n) => n.id === id)).filter(
    (x): x is NonNullable<typeof x> => !!x,
  ),
)

const mobileSecondary = computed(() =>
  navItems.value.filter((n) => !MOBILE_PRIMARY_IDS.includes(n.id as any)),
)

interface SuggestedCreator { id: string; name: string; handle: string; avatar: string; why: string }
const suggestedCreators = ref<SuggestedCreator[]>([])
const followedSet = ref<Set<string>>(new Set())

async function loadSuggestions() {
  try {
    const response = await usersApi.getSuggestions(4)
    suggestedCreators.value = response.data.data.map((u) => ({
      id: u.id,
      name: u.displayName,
      handle: `@${u.username}`,
      avatar: resolveImage(u.avatarUrl, u.id),
      why: u.followerCount > 0 ? `${u.followerCount} followers` : 'New creator',
    }))
  } catch (error) {
    logger.error('Load suggestions error:', error)
  }
}

async function toggleFollow(id: string) {
  const wasFollowed = followedSet.value.has(id)
  const next = new Set(followedSet.value)
  wasFollowed ? next.delete(id) : next.add(id)
  followedSet.value = next
  try {
    if (wasFollowed) await socialApi.unfollowUser(id)
    else await socialApi.followUser(id)
  } catch (error) {
    const revert = new Set(followedSet.value)
    wasFollowed ? revert.add(id) : revert.delete(id)
    followedSet.value = revert
  }
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
    loadSuggestions()
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
        <div class="flex items-center gap-2.5 px-3 pt-3 pb-2.5 border-b border-border">
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
              <!-- TODO(audit:F-15) [MEDIUM] v-html with dynamic ICONS[key] (repeated ~8x in this file) — safe today because ICONS is hardcoded, but a risky pattern; replace with icon components. -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[item.icon]"></svg>
            </span>
            <span class="text-[13px] font-medium">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <!-- Card 2: Suggested creators -->
      <div v-if="suggestedCreators.length > 0" class="ls-card overflow-hidden rounded-[20px] px-3 py-3">
        <div class="font-montserrat font-extrabold text-[11px] text-text mb-2.5 tracking-wider">Suggested for You</div>
        <div>
          <div v-for="c in suggestedCreators" :key="c.id" class="flex items-center gap-2 py-2 border-b border-border last:border-0 last:pb-0">
            <RouterLink :to="`/profile/${c.id}`" class="flex items-center gap-2 flex-1 min-w-0 group">
              <div class="w-[34px] h-[34px] rounded-full overflow-hidden border-2 border-border group-hover:border-orange transition-all shrink-0">
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
      <div class="ls-card rounded-card p-3 flex items-center gap-2">
        <button
          @click="router.push('/recipes/create')"
          class="flex-1 px-2.5 py-2.5 rounded-btn bg-orange text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-orange-deep transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" v-html="ICONS.plus"></svg>
          Share Recipe
        </button>
        <div class="relative">
          <button
            @click="showNotifs = !showNotifs"
            :class="[
              'w-9 h-9 rounded-btn border border-border flex items-center justify-center transition-colors relative',
              showNotifs ? 'border-orange text-orange bg-orange-soft' : 'text-text-muted hover:border-orange hover:text-orange',
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
      <div class="ls-card rounded-card p-3 flex flex-col gap-2">
        <h3 class="font-montserrat font-bold text-sm text-text dark:text-text px-2 pt-1">Categories</h3>
        <div class="flex flex-col gap-0.5">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.name"
            @click="handleCategoryClick(cat.name)"
            :class="[
              'flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors',
              selectedCategory === cat.name
                ? 'bg-orange-soft text-orange'
                : 'hover:bg-background-secondary dark:hover:bg-background-secondary'
            ]"
          >
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cat.style]">
              <BaseIcons :name="cat.icon" size="sm" />
            </div>
            <span
              :class="[
                'flex-1 text-left text-[13px] truncate',
                selectedCategory === cat.name ? 'font-semibold text-orange' : 'font-medium text-text dark:text-text',
              ]"
            >
              {{ cat.name }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums shrink-0',
                selectedCategory === cat.name
                  ? 'bg-orange text-white'
                  : 'bg-background-secondary text-text-dim dark:bg-background-secondary dark:text-text-dim',
              ]"
            >
              {{ cat.count }}
            </span>
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Mobile Top App Bar ── -->
    <div class="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface dark:bg-surface border-b border-border flex items-center justify-between px-5 z-40">
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
      <div class="bg-surface dark:bg-surface border border-border rounded-card flex items-center justify-around p-2 shadow-modal pointer-events-auto">
        <RouterLink
          v-for="item in mobilePrimary.slice(0, 2)" :key="item.id"
          :to="item.path"
          class="flex flex-col items-center gap-1 p-2 text-text-dim"
          active-class="text-orange"
        >
          <span class="w-[22px] h-[22px] inline-flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[item.icon]"></svg>
          </span>
          <span class="text-[10px] font-bold">{{ item.label }}</span>
        </RouterLink>

        <button @click="router.push('/recipes/create')" class="w-14 h-14 rounded-full bg-orange text-white flex items-center justify-center shadow-card-hover -translate-y-4 border-4 border-background transition-transform active:scale-95">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" v-html="ICONS.plus"></svg>
        </button>

        <RouterLink
          v-for="item in mobilePrimary.slice(2, 4)" :key="item.id"
          :to="item.path"
          class="flex flex-col items-center gap-1 p-2 text-text-dim"
          active-class="text-orange"
        >
          <span class="w-[22px] h-[22px] inline-flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[item.icon]"></svg>
          </span>
          <span class="text-[10px] font-bold">{{ item.label }}</span>
        </RouterLink>

        <button
          @click="showMoreDrawer = true"
          class="flex flex-col items-center gap-1 p-2 text-text-dim hover:text-orange transition-all"
          aria-label="More"
        >
          <span class="w-[22px] h-[22px] inline-flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS.more"></svg>
          </span>
          <span class="text-[10px] font-bold">More</span>
        </button>
      </div>
    </div>

    <!-- Mobile More drawer -->
    <Transition name="more-drawer">
      <div
        v-if="showMoreDrawer"
        class="md:hidden fixed inset-0 z-50 flex items-end"
        @click.self="showMoreDrawer = false"
      >
        <div class="absolute inset-0 bg-black/55"></div>
        <div class="relative w-full bg-surface dark:bg-surface border-t border-border rounded-t-3xl p-6 pb-10 shadow-modal">
          <div class="w-10 h-1 rounded-full bg-border mx-auto mb-6"></div>
          <h3 class="font-montserrat font-extrabold text-lg mb-4">More</h3>
          <div class="grid grid-cols-3 gap-3">
            <RouterLink
              v-for="item in mobileSecondary"
              :key="item.id"
              :to="item.path"
              @click="showMoreDrawer = false"
              class="flex flex-col items-center gap-2 p-4 rounded-2xl border-1.5 border-border bg-background-secondary/60 hover:border-orange hover:text-orange transition-all"
              active-class="border-orange text-orange bg-orange/5"
            >
              <span class="w-7 h-7 inline-flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[item.icon]"></svg>
              </span>
              <span class="text-[11px] font-bold">{{ item.label }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>
  </div>
  <div v-else class="h-full">
    <slot />
  </div>
</template>

<style scoped>
.ls-card {
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
}

/* Animated N logo mark */
.logo-mark {
  background: var(--orange);
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

.more-drawer-enter-active,
.more-drawer-leave-active {
  transition: opacity 0.25s ease;
}
.more-drawer-enter-from,
.more-drawer-leave-to {
  opacity: 0;
}
.more-drawer-enter-active > div:last-child,
.more-drawer-leave-active > div:last-child {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.more-drawer-enter-from > div:last-child,
.more-drawer-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>
