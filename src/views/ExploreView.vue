<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Explore</h1>

    <!-- Search Bar -->
    <div class="mb-8">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search posts, users, recipes..."
          class="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-orange-500"
          @input="debouncedSearch"
          @keyup.enter="performSearch"
        />
        <svg class="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Search Type Tabs -->
      <div class="flex gap-2 mt-4" v-if="searchQuery">
        <button
          v-for="type in searchTypes"
          :key="type.value"
          @click="searchType = type.value; performSearch()"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            searchType === type.value
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          ]"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchQuery && searchResults" class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Search Results</h2>

      <!-- Posts Results -->
      <div v-if="searchType === 'all' || searchType === 'posts'">
        <h3 class="text-lg font-medium mb-3">Posts ({{ searchResults.counts?.posts || 0 }})</h3>
        <div v-if="searchResults.posts?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <PostCard v-for="post in searchResults.posts" :key="post.id" :post="post" />
        </div>
        <p v-else class="text-gray-500 mb-8">No posts found</p>
      </div>

      <!-- Users Results -->
      <div v-if="searchType === 'all' || searchType === 'users'">
        <h3 class="text-lg font-medium mb-3">Users ({{ searchResults.counts?.users || 0 }})</h3>
        <div v-if="searchResults.users?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <UserCard v-for="user in searchResults.users" :key="user.id" :user="user" />
        </div>
        <p v-else class="text-gray-500 mb-8">No users found</p>
      </div>
    </div>

    <!-- Categories Section -->
    <div v-if="!searchQuery" class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Browse by Category</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <RouterLink
          v-for="category in categories"
          :key="category.name"
          :to="`/explore/category/${category.name}`"
          class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div class="text-xl mb-2">{{ getCategoryIcon(category.name) }}</div>
          <h3 class="font-semibold">{{ category.name }}</h3>
          <p class="text-sm text-gray-500">{{ category.count }} posts</p>
        </RouterLink>
      </div>
    </div>

    <!-- Trending Section -->
    <div v-if="!searchQuery">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-semibold">Trending Now</h2>
        <select
          v-model="trendingPeriod"
          @change="loadTrending"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
        >
          <option value="24h">Last 24 hours</option>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div v-if="loadingTrending" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
      </div>

      <div v-else-if="trendingPosts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PostCard v-for="post in trendingPosts" :key="post.id" :post="post" />
      </div>

      <p v-else class="text-center text-gray-500 py-8">No trending posts</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { searchApi } from '@/http/endpoints/search'
import PostCard from '@/components/feed/PinCard.vue'
import UserCard from '@/components/user/UserCard.vue'

const searchQuery = ref('')
const searchType = ref('all')
const searchTypes = [
  { label: 'All', value: 'all' },
  { label: 'Posts', value: 'posts' },
  { label: 'Users', value: 'users' },
]

const searchResults = ref<any>(null)
const searching = ref(false)

const categories = ref<any[]>([])
const trendingPosts = ref<any[]>([])
const trendingPeriod = ref('7days')
const loadingTrending = ref(false)

let searchTimeout: NodeJS.Timeout

onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadTrending(),
  ])
})

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.length >= 2) {
      performSearch()
    }
  }, 500)
}

async function performSearch() {
  if (!searchQuery.value || searchQuery.value.length < 2) return

  searching.value = true
  try {
    const response = await searchApi.search({
      q: searchQuery.value,
      type: searchType.value,
      page: 1,
      limit: 20,
    })
    searchResults.value = response.data
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    searching.value = false
  }
}

async function loadCategories() {
  try {
    const response = await searchApi.getCategories()
    categories.value = response.data.data
  } catch (error) {
    console.error('Load categories error:', error)
  }
}

async function loadTrending() {
  loadingTrending.value = true
  try {
    const response = await searchApi.getTrending({
      period: trendingPeriod.value,
      page: 1,
      limit: 12,
    })
    trendingPosts.value = response.data.data
  } catch (error) {
    console.error('Load trending error:', error)
  } finally {
    loadingTrending.value = false
  }
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Italian: '🍝',
    Chinese: '🥡',
    Mexican: '🌮',
    Japanese: '🍱',
    Indian: '🍛',
    American: '🍔',
    French: '🥐',
    Thai: '🍜',
    Mediterranean: '🥗',
    Dessert: '🍰',
    Breakfast: '🥞',
    Vegan: '🌱',
    Vegetarian: '🥕',
    Seafood: '🦞',
    BBQ: '🍖',
  }
  return icons[category] || '🍽️'
}
</script>
