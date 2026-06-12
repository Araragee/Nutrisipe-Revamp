<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFeedStore } from '@/stores/feed'
import { useAuthStore } from '@/stores/auth'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { postsApi } from '@/http/endpoints/posts'
import PinGrid from '@/components/feed/PinGrid.vue'
import PinSkeleton from '@/components/feed/PinSkeleton.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'
import StoriesRail from '@/components/feed/StoriesRail.vue'
import type { Post } from '@/typescript/interface/Post'

const router = useRouter()
const feedStore = useFeedStore()
const authStore = useAuthStore()
const { isNearBottom } = useInfiniteScroll()
const route = useRoute()

const activeTag = ref<string>('')
const isSearching = ref(false)
const searchResults = ref<Post[]>([])
const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)

const SCOPE_TABS = [
  { id: 'for-you', label: 'For You', icon: 'sparkles' },
  { id: 'following', label: 'Following', icon: 'users' },
  { id: 'all', label: 'Trending', icon: 'fire' },
] as const

const CATEGORIES = [
  { name: 'All Recipes', icon: 'squares-2x2' },
  { name: 'Vegan', icon: 'sparkles' },
  { name: 'High Protein', icon: 'fire' },
  { name: 'Keto', icon: 'scale' },
  { name: 'Breakfast', icon: 'sun' },
  { name: 'Quick & Easy', icon: 'clock' },
  { name: 'Plant-Based', icon: 'globe-alt' },
  { name: 'Dessert', icon: 'cake' },
  { name: 'Smoothie', icon: 'beaker' },
] as const

const selectedCategory = computed(() => (route.query.tag as string) || 'All Recipes')

function selectCategory(name: string) {
  const query = { ...route.query }
  if (name === 'All Recipes') delete query.tag
  else query.tag = name
  router.push({ path: '/', query })
}

const feedScope = computed(() => {
  const scope = route.query.scope as string
  if (scope === 'following') return 'following'
  if (scope === 'for-you') return 'recommendations'
  return 'all'
})

const activeScopeId = computed(() => (route.query.scope as string) || 'all')

const isTagMode = computed(() => activeTag.value.length > 0)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const firstName = computed(() => {
  const name = authStore.user?.displayName || authStore.user?.username || ''
  return name.split(' ')[0]
})

const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
)

function selectScope(id: string) {
  const query = { ...route.query }
  if (id === 'all') delete query.scope
  else query.scope = id
  delete query.tag
  router.push({ path: '/', query })
}

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

const displayPosts = computed(() => {
  return isTagMode.value ? searchResults.value : feedStore.posts
})

async function fetchByTag(tag: string) {
  activeTag.value = tag
  isSearching.value = true
  try {
    const response = await postsApi.getByTag(tag)
    searchResults.value = response.data.data
  } catch (error) {
    logger.error('Tag fetch failed:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

watch([feedScope, () => route.query.tag], () => {
  if (route.query.tag) {
    fetchByTag(route.query.tag as string)
  } else {
    activeTag.value = ''
    feedStore.fetchFeed(true, feedScope.value)
  }
})

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (!authStore.user) {
    await authStore.fetchUser()
  }

  if (route.query.tag) {
    fetchByTag(route.query.tag as string)
  } else {
    feedStore.fetchFeed(true, feedScope.value)
  }
})

watch(isNearBottom, (near) => {
  if (near && !feedStore.isLoading && feedStore.hasMore && !isTagMode.value) {
    feedStore.fetchFeed(false, feedScope.value)
  }
})
</script>

<template>
  <div class="home-view min-h-screen">

    <div class="px-5 sm:px-8 pt-20 md:pt-6 pb-28 md:pb-8 max-w-[1400px] mx-auto">

      <!-- ── Dashboard header ── -->
      <header v-if="!isTagMode" class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p class="text-xs font-semibold text-text-dim uppercase tracking-widest mb-1.5">{{ todayLabel }}</p>
            <h1 class="font-montserrat font-black text-2xl sm:text-3xl tracking-tight text-text">
              {{ greeting }}<template v-if="firstName">, <span class="text-orange">{{ firstName }}</span></template> 👋
            </h1>
            <p class="text-sm text-text-muted mt-1.5">Here's what's cooking in your world today.</p>
          </div>

        </div>

        <!-- Scope tabs -->
        <div class="flex items-center gap-1.5 p-1 rounded-2xl bg-background-secondary/70 w-fit max-w-full overflow-x-auto scrollbar-hide">
          <button
            v-for="tab in SCOPE_TABS"
            :key="tab.id"
            @click="selectScope(tab.id)"
            :class="[
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
              activeScopeId === tab.id
                ? 'bg-surface text-orange shadow-card'
                : 'text-text-muted hover:text-text',
            ]"
          >
            <BaseIcons :name="tab.icon" size="sm" />
            {{ tab.label }}
          </button>
        </div>
      </header>

      <!-- Category chips -->
      <div class="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-1 px-1">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.name"
          @click="selectCategory(cat.name)"
          :class="[
            'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors shrink-0',
            selectedCategory === cat.name
              ? 'bg-orange text-white'
              : 'bg-surface dark:bg-surface border border-border text-text-muted dark:text-text-muted hover:border-orange hover:text-orange',
          ]"
        >
          <BaseIcons :name="cat.icon" size="xs" />
          {{ cat.name }}
        </button>
      </div>

      <!-- Stories -->
      <StoriesRail v-if="!isTagMode" class="mb-7" />

      <!-- Tag-mode header -->
      <div v-if="isTagMode" class="mb-6">
        <button @click="() => { activeTag = ''; router.push('/'); }" class="mb-3 inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-orange transition-colors font-medium">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to feed
        </button>
        <div class="flex items-center gap-3">
          <h2 class="font-montserrat font-extrabold text-2xl tracking-tight">{{ activeTag }}</h2>
          <span class="px-2.5 py-0.5 rounded-full bg-orange-soft text-orange text-sm font-bold">{{ displayPosts.length }} recipes</span>
        </div>
      </div>

      <!-- Feed grid -->
      <PinGrid
        v-if="displayPosts.length > 0"
        :posts="displayPosts"
        @post-click="handlePostClick"
      />

      <!-- Skeletons -->
      <div
        v-if="feedStore.isLoading || isSearching"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mt-4"
      >
        <PinSkeleton v-for="i in 10" :key="i" />
      </div>

      <!-- Empty state -->
      <div
        v-if="!feedStore.isLoading && !isSearching && displayPosts.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <div class="w-20 h-20 rounded-3xl bg-orange-soft flex items-center justify-center mb-6">
          <BaseIcons :name="isTagMode ? 'magnifying-glass' : 'sparkles'" size="xl" class="text-orange" />
        </div>
        <h3 class="font-montserrat font-extrabold text-xl mb-2">
          {{ isTagMode ? 'Nothing here yet' : activeScopeId === 'following' ? 'Your feed is quiet' : 'No recipes found' }}
        </h3>
        <p class="text-text-dim max-w-sm mx-auto text-sm leading-relaxed">
          {{ isTagMode
            ? 'No recipes tagged with this category yet. Try another one.'
            : activeScopeId === 'following'
              ? 'Follow a few creators and their latest recipes will land right here.'
              : 'Check back soon — fresh recipes are added every day.' }}
        </p>
        <button
          v-if="!isTagMode && activeScopeId === 'following'"
          @click="router.push('/explore')"
          class="mt-6 px-5 py-2.5 rounded-btn bg-orange text-white font-semibold text-sm hover:bg-orange-deep transition-all"
        >
          Discover creators
        </button>
        <button
          v-else-if="isTagMode"
          @click="() => { activeTag = ''; router.push('/'); }"
          class="mt-6 text-orange font-bold text-sm hover:underline"
        >
          Back to feed
        </button>
      </div>
    </div>

    <!-- Post Detail Modal -->
    <RecipeModal
      :post-id="selectedPostId"
      :show="showPostModal"
      @close="showPostModal = false"
    />
  </div>
</template>
