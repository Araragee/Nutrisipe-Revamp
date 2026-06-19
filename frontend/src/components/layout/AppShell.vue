<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { socketService } from '@/services/socket'
import { usersApi } from '@/http/endpoints/users'
import { socialApi } from '@/http/endpoints/social'
import { searchApi } from '@/http/endpoints/search'
import { resolveImage } from '@/utils/imageUrl'
import { formatTimeAgo } from '@/utils/format'
import UserAvatar from '@/components/user/UserAvatar.vue'
import BaseIcons from '@/components/base/BaseIcons.vue'
import NotificationDropdown from '@/components/notifications/NotificationDropdown.vue'
import AccountDropdown from '@/components/layout/AccountDropdown.vue'
import RecipeCreateModal from '@/components/recipe/RecipeCreateModal.vue'
import { useUiStore } from '@/stores/ui'

interface NavItem {
  id: string
  icon: string
  label: string
  path: string
}

interface SuggestedCreator {
  id: string
  name: string
  handle: string
  avatar: string
  why: string
}

interface TrendingTag {
  name: string
  count: number
}

defineProps<{ showShell: boolean }>()

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()
const route = useRoute()
const uiStore = useUiStore()

const showMoreDrawer = ref(false)
const showNotificationsDrawer = ref(false)
const activeNotificationsTab = ref<'all' | 'unread'>('all')

const filteredNotifications = computed(() => {
  if (activeNotificationsTab.value === 'unread') {
    return notificationsStore.notifications.filter(n => !n.isRead)
  }
  return notificationsStore.notifications
})

async function handleMobileNotificationClick(notification: any) {
  if (!notification.isRead) {
    await notificationsStore.markAsRead(notification.id)
  }

  if (notification.type === 'follow') {
    router.push(`/profile/${notification.actorId}`)
  } else if (notification.postId) {
    router.push(`/recipes/${notification.postId}`)
  }

  showNotificationsDrawer.value = false
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return 'heart'
    case 'comment': return 'chat-bubble-left'
    case 'follow': return 'user-plus'
    case 'save': return 'bookmark'
    default: return 'bell'
  }
}

const getNotificationIconBg = (type: string) => {
  switch (type) {
    case 'like': return 'bg-red-500'
    case 'comment': return 'bg-blue-500'
    case 'follow': return 'bg-green-500'
    case 'save': return 'bg-orange'
    default: return 'bg-gray-500'
  }
}
const searchQuery = ref('')
const suggestedCreators = ref<SuggestedCreator[]>([])
const trendingTags = ref<TrendingTag[]>([])
const followedSet = ref<Set<string>>(new Set())

// Mobile search state
const showMobileSearch = ref(false)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

watch(showMobileSearch, async (val) => {
  if (val) {
    await nextTick()
    mobileSearchInput.value?.focus()
  }
})

const mainNav = computed<NavItem[]>(() => [
  { id: 'home', icon: 'home', label: 'Discover', path: '/' },
  { id: 'explore', icon: 'globe-alt', label: 'Explore', path: '/explore' },
  { id: 'saved', icon: 'bookmark', label: 'Saved', path: '/saved' },
  { id: 'plan', icon: 'calendar', label: 'Plan', path: '/plan' },
  { id: 'groceries', icon: 'shopping-cart', label: 'Groceries', path: '/groceries' },
])

const secondaryNav = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { id: 'profile', icon: 'user', label: 'Profile', path: `/profile/${authStore.user?.id}` },
  ]
  if (authStore.isAdmin) items.push({ id: 'admin', icon: 'shield-check', label: 'Admin', path: '/admin' })
  items.push({ id: 'settings', icon: 'cog-6-tooth', label: 'Settings', path: '/settings' })
  return items
})

const allNav = computed(() => [...mainNav.value, ...secondaryNav.value])

// Mobile primary items for bottom nav (Discover, Explore, Saved)
const mobilePrimary = computed(() =>
  ['home', 'explore', 'saved'].map((id) => allNav.value.find((n) => n.id === id)).filter(
    (x): x is NavItem => !!x,
  ),
)

// Mobile secondary items for 'More' drawer
const mobileSecondary = computed(() =>
  allNav.value.filter((n) => !['home', 'explore', 'saved'].includes(n.id)),
)

const showRightRail = computed(() => route.path === '/')
const isExploreRoute = computed(() => route.path === '/explore')

// Mobile: fixed top bar (h-16) + floating bottom nav overlay content.
// Reserve space here so every scrolling view clears them. Full-height views
// (messages/admin/ingredients) manage their own scroll, so opt out.
const isImmersiveRoute = computed(() =>
  ['/messages', '/admin', '/ingredients'].some((p) => route.path.startsWith(p)),
)
const navState = ref<'default' | 'detached' | 'shrunk'>('default')

watch(isExploreRoute, (val, oldVal) => {
  if (val) {
    if (oldVal === undefined) {
      navState.value = 'shrunk'
    } else {
      navState.value = 'detached'
      setTimeout(() => { navState.value = 'shrunk' }, 150)
    }
  } else {
    if (oldVal === undefined) {
      navState.value = 'default'
    } else {
      navState.value = 'detached'
      setTimeout(() => { navState.value = 'default' }, 250)
    }
  }
}, { immediate: true })

const lastActiveTab = ref(sessionStorage.getItem('lastActiveTab') || 'home')

watch(
  () => route.fullPath,
  () => {
    const newPath = route.path
    const activeItem = allNav.value.find((item) => {
      if (item.path === '/') {
        return newPath === '/'
      }
      return newPath.startsWith(item.path)
    })

    if (activeItem) {
      lastActiveTab.value = activeItem.id
      sessionStorage.setItem('lastActiveTab', activeItem.id)
    }
  },
  { immediate: true },
)

function isActive(item: NavItem) {
  // If we are on a recipe detail or edit page, keep the last active tab highlighted
  if (route.path.startsWith('/recipes')) {
    return item.id === lastActiveTab.value
  }

  if (item.path === '/') {
    return route.path === '/'
  }

  return route.path.startsWith(item.path)
}

function navItemClass(item: NavItem) {
  return isActive(item)
    ? 'bg-orange-soft text-orange font-semibold'
    : 'text-text-muted hover:bg-background-secondary hover:text-text dark:text-text-muted dark:hover:text-text'
}

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ path: '/explore', query: { q } })
  searchQuery.value = ''
}

function handleTagClick(tag: string) {
  router.push({ path: '/', query: { tag } })
}

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

async function loadTrendingTags() {
  try {
    const response = await searchApi.getTrendingTags(8)
    trendingTags.value = response.data.data
  } catch (error) {
    logger.error('Load trending tags error:', error)
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
  socketService.onNotificationNew(handleNewNotification)
})

watch(
  () => authStore.isAuthenticated,
  (authed) => {
    if (!authed) return
    notificationsStore.fetchNotifications()
    loadSuggestions()
    loadTrendingTags()
  },
  { immediate: true },
)

onUnmounted(() => {
  socketService.offNotificationNew(handleNewNotification)
})
</script>

<template>
  <div v-if="showShell" class="app-shell flex h-screen overflow-hidden bg-background dark:bg-background">
    <!-- ── Left sidebar (desktop) ── -->
    <aside class="hidden md:flex w-[248px] shrink-0 flex-col bg-surface dark:bg-surface border-r border-border">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2.5 px-5 h-16 shrink-0" aria-label="Home">
        <span class="logo-mark w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
          <svg viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-[22px] h-[26px]">
            <path class="n-path" d="M 4,25 C 4,18 4,9 5,4 C 9,10 13,19 17,25 C 17,17 17,9 18,4"
              stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="font-montserrat font-extrabold text-lg tracking-tight text-text dark:text-text">
          Nutri<span class="text-orange">sipe</span>
        </span>
      </RouterLink>

      <!-- Main nav -->
      <nav class="flex-1 px-3 pt-2 pb-4 overflow-y-auto scrollbar-hide">
        <p class="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-dim dark:text-text-dim">Menu</p>
        <div class="flex flex-col gap-0.5">
          <RouterLink
            v-for="item in mainNav" :key="item.id"
            :to="item.path"
            :class="['flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors', navItemClass(item)]"
          >
            <BaseIcons :name="item.icon" size="sm" :solid="isActive(item)" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>

      </nav>
    </aside>

    <!-- ── Main column: top bar + content + right rail ── -->
    <div class="flex-1 flex flex-col min-w-0 relative">
      <div class="hidden md:block shrink-0 transition-all duration-[250ms] ease-out" :class="navState === 'shrunk' ? 'h-0' : 'h-16'"></div>

      <header 
        :class="[
          'hidden md:flex items-center gap-4 shrink-0 z-50 transition-all duration-[250ms] ease-out',
          navState === 'default' ? 'absolute top-0 right-0 w-full h-16 bg-surface dark:bg-surface border-b border-border px-6' : '',
          navState === 'detached' ? 'absolute top-4 right-6 w-[calc(100%-3rem)] h-14 bg-surface/70 dark:bg-zinc-800/70 backdrop-blur-lg rounded-[24px] shadow-lg border border-white/20 dark:border-white/10 px-6' : '',
          navState === 'shrunk' ? 'absolute top-4 right-6 w-[270px] h-14 bg-surface/70 dark:bg-zinc-800/70 backdrop-blur-lg rounded-full shadow-lg border border-white/20 dark:border-white/10 px-3' : '',
        ]"
      >
        <div 
          class="transition-all duration-[250ms] ease-out overflow-hidden shrink-0 flex items-center"
          :class="navState === 'shrunk' ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[450px] w-full opacity-100'"
        >
          <form @submit.prevent="submitSearch" class="w-[450px] max-w-[calc(100vw-300px)] shrink-0 min-w-[250px]">
            <div class="relative w-full">
              <BaseIcons name="magnifying-glass" size="sm" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
              <input
                v-model="searchQuery"
                type="search"
                placeholder="Search recipes, chefs, tags…"
                class="w-full bg-background dark:bg-background-secondary border border-transparent rounded-full pl-10 pr-4 py-2 text-sm text-text dark:text-text outline-none focus:border-orange focus:bg-surface dark:focus:bg-surface transition-colors placeholder:text-text-dim"
              />
            </div>
          </form>
        </div>

        <div class="ml-auto flex items-center gap-2.5">
          <button
            @click="uiStore.openCreateModal()"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange text-white font-semibold text-sm hover:bg-orange-deep transition-colors whitespace-nowrap shrink-0"
          >
            <BaseIcons name="plus" size="sm" />
            Share recipe
          </button>

          <Popover v-slot="{ open, close }" class="relative">
            <PopoverButton
              :class="[
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-orange',
                open ? 'bg-orange-soft text-orange' : 'text-text-muted hover:bg-background-secondary hover:text-text',
              ]"
              aria-label="Notifications"
            >
              <BaseIcons name="bell" size="sm" />
              <span
                v-if="notificationsStore.unreadCount > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-orange text-white text-[9px] font-bold flex items-center justify-center border-2 border-surface dark:border-surface"
              >{{ notificationsStore.unreadCount }}</span>
            </PopoverButton>
            <PopoverPanel class="absolute right-0 top-12 z-50">
              <NotificationDropdown @close="close" />
            </PopoverPanel>
          </Popover>

          <Popover v-if="authStore.user" v-slot="{ open, close }" class="relative">
            <PopoverButton
              :class="[
                'w-9 h-9 rounded-full overflow-hidden ring-2 transition-all shrink-0 focus:outline-none block',
                open ? 'ring-orange' : 'ring-transparent hover:ring-orange'
              ]"
              aria-label="Your account"
            >
              <UserAvatar :user="authStore.user" size="sm" class="!w-full !h-full block" />
            </PopoverButton>
            <PopoverPanel class="absolute right-0 top-12 z-50">
              <AccountDropdown @close="close" />
            </PopoverPanel>
          </Popover>
        </div>
      </header>

      <!-- Content row -->
      <div class="flex flex-1 overflow-hidden">
        <main :class="['flex-1 overflow-y-auto scrollbar-hide', isImmersiveRoute ? '' : 'pt-20 pb-32 md:pt-0 md:pb-0']">
          <slot />
        </main>

        <!-- Right rail (feed pages, wide screens) -->
        <aside
          v-if="showRightRail && (suggestedCreators.length > 0 || trendingTags.length > 0)"
          class="hidden xl:flex w-[300px] shrink-0 flex-col gap-4 p-4 overflow-y-auto scrollbar-hide border-l border-border bg-surface dark:bg-surface"
        >
          <!-- Suggested chefs -->
          <section v-if="suggestedCreators.length > 0">
            <h3 class="font-montserrat font-bold text-sm text-text dark:text-text px-1 mb-2">Chefs to follow</h3>
            <div class="flex flex-col">
              <div
                v-for="c in suggestedCreators" :key="c.id"
                class="flex items-center gap-2.5 px-1 py-2.5 border-b border-border last:border-0"
              >
                <RouterLink :to="`/profile/${c.id}`" class="flex items-center gap-2.5 flex-1 min-w-0 group">
                  <img :src="c.avatar" :alt="c.name" class="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-text dark:text-text truncate group-hover:text-orange transition-colors">{{ c.name }}</p>
                    <p class="text-[11px] text-text-dim dark:text-text-dim truncate">{{ c.why }}</p>
                  </div>
                </RouterLink>
                <button
                  @click="toggleFollow(c.id)"
                  :class="[
                    'shrink-0 px-3 py-1.5 rounded-full font-semibold text-xs transition-colors',
                    followedSet.has(c.id)
                      ? 'bg-orange-soft text-orange'
                      : 'bg-orange text-white hover:bg-orange-deep',
                  ]"
                >{{ followedSet.has(c.id) ? 'Following' : 'Follow' }}</button>
              </div>
            </div>
          </section>

          <!-- Trending tags -->
          <section v-if="trendingTags.length > 0">
            <h3 class="font-montserrat font-bold text-sm text-text dark:text-text px-1 mb-2.5">Trending now</h3>
            <div class="flex flex-wrap gap-1.5 px-1">
              <button
                v-for="tag in trendingTags" :key="tag.name"
                @click="handleTagClick(tag.name)"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-secondary dark:bg-background-secondary text-xs font-medium text-text-muted dark:text-text-muted hover:bg-orange-soft hover:text-orange transition-colors"
              >
                #{{ tag.name }}
                <span class="text-[10px] text-text-dim tabular-nums">{{ tag.count }}</span>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>

    <!-- ── Mobile top app bar ── -->
    <div class="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface dark:bg-surface border-b border-border flex items-center px-5 z-40">
      <!-- Search Mode -->
      <div v-if="showMobileSearch" class="flex-1 flex items-center gap-3">
        <button
          @click="showMobileSearch = false"
          class="p-1 rounded-full text-text-muted hover:bg-background-secondary transition-colors"
          aria-label="Back"
        >
          <BaseIcons name="arrow-left" size="md" />
        </button>
        <form @submit.prevent="submitSearch" class="flex-1">
          <div class="relative w-full">
            <BaseIcons name="magnifying-glass" size="sm" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input
              v-model="searchQuery"
              type="search"
              ref="mobileSearchInput"
              placeholder="Search recipes, chefs, tags…"
              class="w-full bg-background dark:bg-background-secondary border border-transparent rounded-full pl-10 pr-4 py-2 text-sm text-text dark:text-text outline-none focus:border-orange focus:bg-surface dark:focus:bg-surface transition-colors placeholder:text-text-dim"
            />
          </div>
        </form>
      </div>

      <!-- Normal Mode -->
      <div v-else class="flex-1 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2">
          <span class="logo-mark w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 22 28" fill="none" class="w-[20px] h-[24px]">
              <path class="n-path" d="M 4,25 C 4,18 4,9 5,4 C 9,10 13,19 17,25 C 17,17 17,9 18,4"
                stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="font-montserrat font-extrabold text-lg text-text dark:text-text">Nutri<span class="text-orange">sipe</span></span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <button
            @click="showMobileSearch = true"
            class="w-9 h-9 rounded-full text-text-muted hover:bg-background-secondary hover:text-text flex items-center justify-center transition-colors focus:outline-none"
            aria-label="Search"
          >
            <BaseIcons name="magnifying-glass" size="sm" />
          </button>

          <!-- More Trigger -->
          <button
            @click="showMoreDrawer = true"
            class="w-9 h-9 rounded-full text-text-muted hover:bg-background-secondary hover:text-text flex items-center justify-center transition-colors focus:outline-none"
            aria-label="More"
          >
            <BaseIcons name="ellipsis-horizontal" size="sm" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Mobile bottom nav ── -->
    <!-- Active tab morphs into a labelled pill within the left group; create stays anchored right so the pill never shifts it. -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 z-40 pointer-events-none">
      <div class="bg-surface dark:bg-surface border border-border rounded-card flex items-center gap-1.5 px-2 py-2 shadow-modal pointer-events-auto">
        <!-- Nav group (reflows internally as the pill expands) -->
        <div class="flex-1 flex items-center justify-between gap-1 min-w-0">
          <!-- Discover, Explore, Saved -->
          <RouterLink
            v-for="item in mobilePrimary" :key="item.id"
            :to="item.path"
            :class="[
              'flex items-center justify-center h-11 rounded-full transition-all duration-300 ease-out overflow-hidden',
              isActive(item) ? 'bg-orange-soft text-orange px-3.5' : 'text-text-dim px-2.5',
            ]"
          >
            <BaseIcons :name="item.id === 'explore' ? 'magnifying-glass' : item.icon" size="md" :solid="isActive(item)" class="shrink-0" />
            <span :class="['text-[11px] font-bold whitespace-nowrap transition-all duration-300 ease-out', isActive(item) ? 'max-w-[80px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0']">{{ item.label }}</span>
          </RouterLink>

          <!-- Notifications -->
          <button
            @click="showNotificationsDrawer = true"
            :class="[
              'relative flex items-center justify-center h-11 rounded-full transition-all duration-300 ease-out overflow-hidden',
              showNotificationsDrawer ? 'bg-orange-soft text-orange px-3.5' : 'text-text-dim px-2.5',
            ]"
            aria-label="Notifications"
          >
            <BaseIcons name="bell" size="md" :solid="showNotificationsDrawer" class="shrink-0" />
            <span
              v-if="notificationsStore.unreadCount > 0"
              class="absolute top-0.5 right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-orange text-white text-[8px] font-bold flex items-center justify-center border border-surface dark:border-surface"
            >{{ notificationsStore.unreadCount }}</span>
            <span :class="['text-[11px] font-bold whitespace-nowrap transition-all duration-300 ease-out', showNotificationsDrawer ? 'max-w-[90px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0']">Alerts</span>
          </button>
        </div>

        <!-- Divider + create, anchored right -->
        <div class="w-px h-7 bg-border shrink-0"></div>
        <button
          @click="uiStore.openCreateModal()"
          class="w-11 h-11 rounded-2xl bg-orange text-white flex items-center justify-center transition-transform active:scale-90 shrink-0"
          aria-label="Share recipe"
        >
          <BaseIcons name="plus" size="md" />
        </button>
      </div>
    </div>

    <!-- Mobile More Sidebar drawer -->
    <Transition name="sidebar-drawer">
      <div
        v-if="showMoreDrawer"
        class="md:hidden fixed inset-0 z-50 flex justify-end"
      >
        <div class="absolute inset-0 bg-black/55" @click="showMoreDrawer = false"></div>
        <div class="relative w-[280px] max-w-[80vw] h-full bg-surface dark:bg-surface border-l border-border p-6 shadow-modal flex flex-col animate-slide-in">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6 shrink-0">
            <h3 class="font-montserrat font-bold text-lg text-text dark:text-text">More</h3>
            <button
              @click="showMoreDrawer = false"
              class="p-1 rounded-full text-text-muted hover:bg-background-secondary transition-colors"
              aria-label="Close"
            >
              <BaseIcons name="x-mark" size="sm" />
            </button>
          </div>

          <!-- List -->
          <div class="flex flex-col gap-1.5 flex-1 overflow-y-auto">
            <RouterLink
              v-for="item in mobileSecondary"
              :key="item.id"
              :to="item.path"
              @click="showMoreDrawer = false"
              :class="[
                'flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors text-sm',
                isActive(item)
                  ? 'text-orange bg-orange-soft dark:bg-orange/10 font-bold'
                  : 'text-text-muted hover:text-orange hover:bg-background-secondary dark:text-text-muted dark:hover:text-text'
              ]"
            >
              <BaseIcons :name="item.icon" size="md" :solid="isActive(item)" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Mobile Notifications drawer -->
    <Transition name="more-drawer">
      <div
        v-if="showNotificationsDrawer"
        class="md:hidden fixed inset-0 z-50 flex items-end"
        @click.self="showNotificationsDrawer = false"
      >
        <div class="absolute inset-0 bg-black/55" @click="showNotificationsDrawer = false"></div>
        <div class="relative w-full max-h-[85vh] bg-surface dark:bg-surface border-t border-border rounded-t-3xl p-6 pb-10 shadow-modal flex flex-col">
          <!-- Drag bar -->
          <div class="w-10 h-1 rounded-full bg-border mx-auto mb-6 shrink-0"></div>

          <!-- Header -->
          <div class="flex items-center justify-between mb-4 shrink-0">
            <h3 class="font-montserrat font-bold text-lg text-text dark:text-text">Notifications</h3>
            <button
              v-if="notificationsStore.unreadCount > 0"
              @click="notificationsStore.markAllAsRead()"
              class="text-xs font-bold text-orange hover:text-orange-deep transition-colors"
            >
              Mark all as read
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex gap-6 border-b border-border mb-4 shrink-0">
            <button 
              @click="activeNotificationsTab = 'all'"
              :class="['pb-3 text-sm font-bold transition-all relative', activeNotificationsTab === 'all' ? 'text-text dark:text-text' : 'text-text-dim dark:text-text-dim hover:text-text']"
            >
              All
              <div v-if="activeNotificationsTab === 'all'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange rounded-full"></div>
            </button>
            <button 
              @click="activeNotificationsTab = 'unread'"
              :class="['pb-3 text-sm font-bold transition-all relative flex items-center gap-2', activeNotificationsTab === 'unread' ? 'text-text dark:text-text' : 'text-text-dim dark:text-text-dim hover:text-text']"
            >
              Unread
              <span v-if="notificationsStore.unreadCount > 0" class="px-2 py-0.5 rounded-full bg-orange text-white text-[10px] font-black">
                {{ notificationsStore.unreadCount }}
              </span>
              <div v-if="activeNotificationsTab === 'unread'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange rounded-full"></div>
            </button>
          </div>

          <!-- List -->
          <div class="overflow-y-auto flex-1 scrollbar-hide min-h-0">
            <div v-if="notificationsStore.isLoading && notificationsStore.notifications.length === 0" class="p-10 text-center">
              <div class="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-text-dim text-sm font-medium">Fetching updates...</p>
            </div>

            <div v-else-if="filteredNotifications.length === 0" class="p-16 text-center">
              <BaseIcons name="bell" size="xl" class="mx-auto mb-4 opacity-30 text-text-dim" />
              <p class="text-text-dim font-bold">All caught up!</p>
              <p class="text-text-dim/60 text-xs mt-1">No new notifications for you right now.</p>
            </div>

            <div v-else class="flex flex-col">
              <div 
                v-for="n in filteredNotifications" 
                :key="n.id"
                @click="handleMobileNotificationClick(n)"
                class="group flex items-start gap-4 py-4 hover:bg-orange/5 cursor-pointer transition-all border-b border-border/50 last:border-0 relative"
              >
                <!-- Unread Dot -->
                <div v-if="!n.isRead" class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange rounded-full"></div>

                <!-- Avatar + Icon -->
                <div class="relative shrink-0 ml-3">
                  <UserAvatar :user="n.actor" size="md" class="border-2 border-border shadow-sm" />
                  <div :class="['absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-md border-2 border-white dark:border-background-secondary', getNotificationIconBg(n.type)]">
                    <BaseIcons :name="getNotificationIcon(n.type)" size="xs" class="text-white" />
                  </div>
                </div>

                <!-- Text -->
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] leading-snug text-text dark:text-text">
                    <span class="font-extrabold">{{ n.actor.displayName }}</span>
                    <span class="text-text-muted dark:text-text-dim mx-1">
                      {{ n.type === 'like' ? 'liked your recipe' : n.type === 'comment' ? 'commented on' : n.type === 'follow' ? 'started following you' : n.type === 'mention' ? 'mentioned you in' : n.type === 'rating' ? 'rated your recipe' : n.type === 'variation' ? 'forked your recipe' : 'interacted with' }}
                    </span>
                    <span v-if="n.post" class="font-extrabold">{{ n.post.title }}</span>
                  </p>
                  <p class="text-[11px] text-text-dim dark:text-text-dim/60 mt-1 font-medium">{{ formatTimeAgo(n.createdAt) }}</p>
                </div>

                <!-- Post Thumbnail -->
                <div v-if="n.post" class="shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-border">
                  <img :src="resolveImage(n.post.imageUrl, n.post.id)" class="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
  <div v-else class="h-full">
    <slot />
  </div>
  <RecipeCreateModal v-if="uiStore.createModalOpen" />
</template>

<style scoped>
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

.sidebar-drawer-enter-active,
.sidebar-drawer-leave-active {
  transition: opacity 0.25s ease;
}
.sidebar-drawer-enter-from,
.sidebar-drawer-leave-to {
  opacity: 0;
}
.sidebar-drawer-enter-active > div:last-child,
.sidebar-drawer-leave-active > div:last-child {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.sidebar-drawer-enter-from > div:last-child,
.sidebar-drawer-leave-to > div:last-child {
  transform: translateX(100%);
}
</style>
