<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { searchApi } from '@/http/endpoints/search'
import FeedHeader from '@/components/feed/FeedHeader.vue'
import PinCard from '@/components/feed/PinCard.vue'
import UserCard from '@/components/user/UserCard.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'

const searchQuery = ref('')
const selectedCategory = ref('All')
const trendingPosts = ref<any[]>([])
const loadingTrending = ref(false)
const searchResults = ref<any>(null)
const isSearching = ref(false)

const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

async function loadTrending() {
  loadingTrending.value = true
  try {
    const response = await searchApi.getTrending({ period: '7days', page: 1, limit: 12 })
    trendingPosts.value = response.data.data
  } catch (error) {
    console.error('Load trending error:', error)
  } finally {
    loadingTrending.value = false
  }
}

async function handleSearch(query?: string) {
  if (query !== undefined) searchQuery.value = query
  if (!searchQuery.value && selectedCategory.value === 'All') {
    searchResults.value = null
    return
  }

  isSearching.value = true
  try {
    // TODO: Improve search result mapping to distinguish between posts and users in the UI
    const response = await searchApi.search({
      q: searchQuery.value || selectedCategory.value,
      type: 'all',
      page: 1,
      limit: 20,
    })
    searchResults.value = response.data
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    isSearching.value = false
  }
}

function handleFilter(category: string) {
  selectedCategory.value = category
  handleSearch()
}

onMounted(() => {
  loadTrending()
})

const collections = [
  { title: 'Summer Salads', count: 24, image: 'https://picsum.photos/400/300?random=1', color: 'from-green-400 to-emerald-500' },
  { title: 'High Protein', count: 18, image: 'https://picsum.photos/400/300?random=2', color: 'from-orange-400 to-red-500' },
  { title: 'Quick & Easy', count: 42, image: 'https://picsum.photos/400/300?random=3', color: 'from-blue-400 to-indigo-500' },
]
</script>

<template>
  <div class="explore-view min-h-screen">
    <FeedHeader @search="handleSearch" @filter="handleFilter" />

    <div class="explore-hero relative h-[300px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <div class="absolute inset-0 z-0">
        <img src="https://picsum.photos/1200/400?random=88" class="w-full h-full object-cover opacity-20 dark:opacity-10 blur-sm" />
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
      </div>

      <div class="relative z-10 animate-revamp">
        <h1 class="font-montserrat font-extrabold text-4xl tracking-tight mb-3">Explore Nutrisipe</h1>
        <p class="text-text-muted text-lg max-w-lg mx-auto">Discover trending recipes, top creators & curated collections for your healthy journey.</p>
      </div>
    </div>

    <div class="px-8 pb-20">
      <!-- Search Results -->
      <div v-if="searchResults || isSearching" class="mb-12 animate-fadeIn">
        <h2 class="font-montserrat font-extrabold text-2xl mb-6">Search Results</h2>
        <div v-if="isSearching" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           <div v-for="i in 4" :key="i" class="h-64 bg-background-secondary rounded-card animate-pulse"></div>
        </div>
        <div v-else-if="searchResults?.posts?.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <PinCard v-for="post in searchResults.posts" :key="post.id" :post="post" @click="handlePostClick" />
        </div>
        <div v-else class="text-center py-12 bg-background-secondary rounded-3xl border-1.5 border-dashed border-glass-border">
          <p class="text-text-dim">No results found for your search.</p>
        </div>
      </div>

      <!-- Collections -->
      <div v-if="!searchResults" class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-montserrat font-extrabold text-2xl">Curated Collections</h2>
          <button class="text-orange font-bold text-sm hover:underline">View All</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="col in collections" :key="col.title" class="group relative h-48 rounded-3xl overflow-hidden cursor-pointer shadow-card transition-all hover:-translate-y-1">
            <img :src="col.image" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div :class="['absolute inset-0 bg-gradient-to-t opacity-60', col.color]"></div>
            <div class="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 class="font-montserrat font-extrabold text-xl text-white drop-shadow-md">{{ col.title }}</h3>
              <p class="text-white/80 text-sm font-medium">{{ col.count }} recipes</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Trending -->
      <div v-if="!searchResults" class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-montserrat font-extrabold text-2xl">Trending This Week</h2>
          <div class="flex gap-2">
            <button class="w-10 h-10 rounded-full border border-glass-border flex items-center justify-center text-text-dim hover:text-orange">‹</button>
            <button class="w-10 h-10 rounded-full border border-glass-border flex items-center justify-center text-text-dim hover:text-orange">›</button>
          </div>
        </div>

        <div v-if="loadingTrending" class="grid grid-cols-2 md:grid-cols-4 gap-6">
           <div v-for="i in 4" :key="i" class="h-64 bg-background-secondary rounded-card animate-pulse"></div>
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           <PinCard v-for="post in trendingPosts" :key="post.id" :post="post" @click="handlePostClick" />
        </div>
      </div>
    </div>

    <!-- Recipe Modal -->
    <RecipeModal :post-id="selectedPostId" :show="showPostModal" @close="showPostModal = false" />
  </div>
</template>

<style scoped>
@keyframes revamp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-revamp {
  animation: revamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in;
}
</style>
