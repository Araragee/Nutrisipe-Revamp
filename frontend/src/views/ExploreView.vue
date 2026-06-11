<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { searchApi } from '@/http/endpoints/search'
import { collectionsApi, type Collection } from '@/http/endpoints/collections'
import { useAuthStore } from '@/stores/auth'
import { resolveImage } from '@/utils/imageUrl'
import PinCard from '@/components/feed/PinCard.vue'
import UserAvatar from '@/components/user/UserAvatar.vue'
import FollowButton from '@/components/user/FollowButton.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'
import RecipeMosaicBackground from '@/components/common/RecipeMosaicBackground.vue'

type SearchType = 'all' | 'recipes' | 'people'

const router = useRouter()
const authStore = useAuthStore()

const searchQuery = ref('')
const searchType = ref<SearchType>('all')

const trendingPosts = ref<any[]>([])
const loadingTrending = ref(false)

const trendingTags = ref<Array<{ name: string; count: number }>>([])

const postResults = ref<any[] | null>(null)
const userResults = ref<any[] | null>(null)
const isSearching = ref(false)

const collections = ref<Collection[]>([])
const loadingCollections = ref(false)

const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)

const trendingScroller = ref<HTMLElement | null>(null)

const hasResults = computed(() => postResults.value !== null || userResults.value !== null)
const showingResultsHeader = computed(() => hasResults.value || isSearching.value)

const filterChips: { label: string; value: SearchType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Recipes', value: 'recipes' },
  { label: 'People', value: 'people' },
]

const collectionGradients = [
  'from-green-400 to-emerald-500',
  'from-orange-400 to-red-500',
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-yellow-400 to-amber-500',
  'from-purple-400 to-violet-500',
]

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

function clearResults() {
  postResults.value = null
  userResults.value = null
}

async function loadTrending() {
  loadingTrending.value = true
  try {
    const response = await searchApi.getTrending({ period: '7days', page: 1, limit: 16 })
    trendingPosts.value = response.data.data
  } catch (error) {
    logger.error('Load trending error:', error)
  } finally {
    loadingTrending.value = false
  }
}

async function loadTrendingTags() {
  try {
    const response = await searchApi.getTrendingTags(20)
    trendingTags.value = response.data.data
  } catch (error) {
    logger.error('Load trending tags error:', error)
  }
}

async function loadCollections() {
  if (!authStore.user?.id) return
  loadingCollections.value = true
  try {
    const response = await collectionsApi.getUserCollections(authStore.user.id)
    collections.value = response.data.data
  } catch (error) {
    logger.error('Load collections error:', error)
  } finally {
    loadingCollections.value = false
  }
}

function setFilter(value: SearchType) {
  if (searchType.value === value) return
  searchType.value = value
  if (searchQuery.value.trim()) runSearch()
}

async function runSearch() {
  const q = searchQuery.value.trim()
  if (!q) {
    clearResults()
    return
  }

  isSearching.value = true
  try {
    if (searchType.value === 'recipes') {
      const res = await postsApi.search(q, 1)
      postResults.value = res.data.data
      userResults.value = []
    } else if (searchType.value === 'people') {
      const res = await searchApi.search({ q, type: 'users', limit: 30 })
      userResults.value = res.data.data.users ?? []
      postResults.value = []
    } else {
      const res = await searchApi.search({ q, type: 'all', limit: 20 })
      postResults.value = res.data.data.posts ?? []
      userResults.value = res.data.data.users ?? []
    }
  } catch (error) {
    logger.error('Search error:', error)
  } finally {
    isSearching.value = false
  }
}

async function searchTag(tag: string) {
  searchType.value = 'recipes'
  searchQuery.value = tag
  await runSearch()
}

function scrollTrending(dir: -1 | 1) {
  const el = trendingScroller.value
  if (!el) return
  const card = el.querySelector('.trend-card') as HTMLElement | null
  const step = card ? card.offsetWidth + 24 : 280
  el.scrollBy({ left: step * dir * 2, behavior: 'smooth' })
}

onMounted(() => {
  loadTrending()
  loadTrendingTags()
  loadCollections()
})
</script>

<template>
  <div>
    <!-- HERO -->
    <div class="explore-hero relative h-[420px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <RecipeMosaicBackground :posts="trendingPosts" :count="12" :intensity="0.45" fallback-variant="sunset" />

      <div class="relative z-10 w-full max-w-2xl animate-revamp">
        <h1 class="font-montserrat font-extrabold text-5xl tracking-tight mb-4 drop-shadow-sm">Explore Nutrisipe</h1>
        <p class="text-text-muted text-base md:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
          Search recipes, follow chefs, find collections shaped for your taste.
        </p>

        <!-- Search Bar -->
        <div class="relative group">
          <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none text-xl group-focus-within:text-orange transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input
            v-model="searchQuery"
            @keyup.enter="runSearch"
            @input="!searchQuery && clearResults()"
            type="text"
            placeholder="Try ‘miso soup’, ‘chef’, or a tag…"
            class="w-full h-16 pl-14 pr-32 bg-surface/80 border-1.5 border-border rounded-2xl text-[15px] font-medium outline-none focus:border-orange focus:ring-4 focus:ring-orange/10 shadow-lg transition-all"
          />
          <button
            @click="runSearch"
            class="absolute right-2.5 top-2.5 bottom-2.5 px-6 bg-orange text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
          >Search</button>
        </div>

        <!-- Type chips -->
        <div class="flex gap-2 justify-center mt-5">
          <button
            v-for="chip in filterChips"
            :key="chip.value"
            @click="setFilter(chip.value)"
            :class="[
              'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border-1.5',
              searchType === chip.value
                ? 'bg-orange border-orange text-white'
                : 'bg-surface/70 border-border text-text-muted hover:border-orange hover:text-orange',
            ]"
          >{{ chip.label }}</button>
        </div>
      </div>
    </div>

    <div class="px-8 pb-20 max-w-7xl mx-auto">
      <!-- Trending tags rail -->
      <div v-if="trendingTags.length > 0 && !hasResults" class="mt-10 mb-12">
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="font-montserrat font-extrabold text-lg tracking-tight flex items-center gap-2"><BaseIcons name="fire" size="md" class="text-orange" /> Trending Tags</h2>
          <span class="text-text-dim text-[10px] font-bold uppercase tracking-widest">Past 14 days</span>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          <button
            v-for="t in trendingTags"
            :key="t.name"
            @click="searchTag(t.name)"
            class="shrink-0 px-4 py-2 rounded-full border-1.5 border-border bg-surface/60 text-sm font-bold hover:border-orange hover:text-orange transition-all"
          >
            #{{ t.name }}
            <span class="ml-2 text-[10px] text-text-dim tabular-nums">{{ t.count }}</span>
          </button>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="showingResultsHeader" class="mb-12 animate-fadeIn">
        <div class="flex items-baseline justify-between mb-6">
          <h2 class="font-montserrat font-extrabold text-2xl">Results for "{{ searchQuery }}"</h2>
          <button @click="searchQuery = ''; clearResults()" class="text-orange text-xs font-bold uppercase tracking-widest hover:underline">Clear</button>
        </div>

        <div v-if="isSearching" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="i in 4" :key="i" class="h-64 bg-background-secondary rounded-card animate-pulse"></div>
        </div>

        <template v-else>
          <!-- People -->
          <div v-if="userResults && userResults.length > 0" class="mb-10">
            <h3 v-if="searchType === 'all'" class="font-montserrat font-extrabold text-base text-text-dim uppercase tracking-widest mb-4">People</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="u in userResults"
                :key="u.id"
                class="flex items-center gap-4 p-4 bg-background-secondary/50 border border-border rounded-2xl hover:border-orange transition-all"
              >
                <RouterLink :to="`/profile/${u.id}`" class="flex items-center gap-3 flex-1 min-w-0">
                  <UserAvatar :user="u" size="md" class="shrink-0" />
                  <div class="min-w-0">
                    <p class="font-bold text-sm truncate">{{ u.displayName }}</p>
                    <p class="text-xs text-text-dim truncate">@{{ u.username }} · {{ u.followerCount ?? 0 }} followers</p>
                  </div>
                </RouterLink>
                <FollowButton v-if="u.id !== authStore.user?.id" :user-id="u.id" :is-following="u.isFollowing" />
              </div>
            </div>
          </div>

          <!-- Recipes -->
          <div v-if="postResults && postResults.length > 0">
            <h3 v-if="searchType === 'all' && (userResults?.length ?? 0) > 0" class="font-montserrat font-extrabold text-base text-text-dim uppercase tracking-widest mb-4">Recipes</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <PinCard v-for="post in postResults" :key="post.id" :post="post" @click="handlePostClick" />
            </div>
          </div>

          <!-- Empty -->
          <div
            v-if="(postResults?.length ?? 0) === 0 && (userResults?.length ?? 0) === 0"
            class="text-center py-12 bg-background-secondary rounded-3xl border-1.5 border-dashed border-border"
          >
            <p class="text-text-dim">No results found for "{{ searchQuery }}".</p>
          </div>
        </template>
      </div>

      <!-- Collections -->
      <div v-if="!hasResults && collections.length > 0" class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-montserrat font-extrabold text-2xl">Your Collections</h2>
          <RouterLink to="/saved" class="text-orange font-bold text-sm hover:underline">View All</RouterLink>
        </div>
        <div v-if="loadingCollections" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="h-48 bg-background-secondary rounded-3xl animate-pulse"></div>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(col, idx) in collections.slice(0, 6)"
            :key="col.id"
            @click="router.push(`/collections/${col.id}`)"
            class="group relative h-48 rounded-3xl overflow-hidden cursor-pointer shadow-card transition-all hover:-translate-y-1"
          >
            <img :src="resolveImage(col.thumbnailUrl, col.id)" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div :class="['absolute inset-0 bg-gradient-to-t opacity-60', collectionGradients[idx % collectionGradients.length]]"></div>
            <div class="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 class="font-montserrat font-extrabold text-xl text-white drop-shadow-md">{{ col.name }}</h3>
              <p class="text-white/80 text-sm font-medium">{{ col.postCount ?? 0 }} recipes</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Trending This Week (horizontal scroll) -->
      <div v-if="!hasResults" class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-montserrat font-extrabold text-2xl">Trending This Week</h2>
          <div class="flex gap-2">
            <button @click="scrollTrending(-1)" aria-label="Scroll left" class="w-10 h-10 rounded-full border border-border bg-surface/70 flex items-center justify-center text-text-dim hover:text-orange hover:border-orange transition-all">‹</button>
            <button @click="scrollTrending(1)" aria-label="Scroll right" class="w-10 h-10 rounded-full border border-border bg-surface/70 flex items-center justify-center text-text-dim hover:text-orange hover:border-orange transition-all">›</button>
          </div>
        </div>

        <div v-if="loadingTrending" class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="i in 4" :key="i" class="h-64 bg-background-secondary rounded-card animate-pulse"></div>
        </div>

        <div
          v-else
          ref="trendingScroller"
          class="trend-scroll flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
        >
          <div
            v-for="post in trendingPosts"
            :key="post.id"
            class="trend-card shrink-0 snap-start w-[260px] md:w-[280px]"
          >
            <PinCard :post="post" @click="handlePostClick" />
          </div>
        </div>
      </div>
    </div>

    <RecipeModal :post-id="selectedPostId" :show="showPostModal" @close="showPostModal = false" />
  </div>
</template>

<style scoped>
@keyframes revamp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-revamp { animation: revamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fadeIn { animation: fadeIn 0.3s ease-in; }

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
