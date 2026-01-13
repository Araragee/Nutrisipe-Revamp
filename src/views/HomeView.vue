<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFeedStore } from '@/stores/feed'
import { useAuthStore } from '@/stores/auth'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { searchPosts } from '@/http/posts'
import LayoutThreeColumn from '@/components/layout/LayoutThreeColumn.vue'
import PinGrid from '@/components/feed/PinGrid.vue'
import PinSkeleton from '@/components/feed/PinSkeleton.vue'
import PostDetailModal from '@/components/post/PostDetailModal.vue'
import type { Post } from '@/typescript/interface/Post'

const router = useRouter()
const feedStore = useFeedStore()
const authStore = useAuthStore()
const { isNearBottom } = useInfiniteScroll()

const searchQuery = ref('')
const selectedCategory = ref<string>('')
const isSearching = ref(false)
const searchResults = ref<Post[]>([])
const selectedPostId = ref<string | null>(null)
const showPostDetail = ref(false)

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostDetail.value = true
}

function handleCloseDetail() {
  showPostDetail.value = false
  selectedPostId.value = null
}

const categories = [
  { value: '', label: 'All' },
  { value: 'recipe', label: 'Recipes' },
  { value: 'meal_photo', label: 'Meal Photos' },
  { value: 'nutrition_tip', label: 'Nutrition Tips' },
  { value: 'cooking_technique', label: 'Cooking Techniques' },
]

const displayPosts = computed(() => {
  return isSearchMode.value ? searchResults.value : feedStore.posts
})

const isSearchMode = computed(() => {
  return searchQuery.value.trim().length > 0 || selectedCategory.value !== ''
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function handleSearch() {
  if (!searchQuery.value.trim() && !selectedCategory.value) {
    searchResults.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true

  try {
    const response = await searchPosts(
      searchQuery.value.trim() || '*',
      selectedCategory.value || undefined
    )
    searchResults.value = response.data
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

function debouncedSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 500)
}

watch([searchQuery, selectedCategory], () => {
  debouncedSearch()
})

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (!authStore.user) {
    await authStore.fetchCurrentUser()
  }

  await feedStore.fetchFeed(true)
})

watch(isNearBottom, (near) => {
  if (near && !feedStore.isLoading && feedStore.hasMore && !isSearchMode.value) {
    feedStore.fetchFeed()
  }
})
</script>

<template>
  <LayoutThreeColumn>
    <!-- Header with Search and Filters -->
    <div class="mb-6 space-y-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Your Feed</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Discover recipes and nutrition tips
        </p>
      </div>

      <!-- Search Bar -->
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search posts, recipes, tips..."
          class="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
        <svg
          class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <div
          v-if="searchQuery || selectedCategory"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2"
        >
          <button
            @click="() => { searchQuery = ''; selectedCategory = '' }"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Category Filter -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="category in categories"
          :key="category.value"
          @click="selectedCategory = category.value"
          :class="[
            'px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all',
            selectedCategory === category.value
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ category.label }}
        </button>
      </div>

      <!-- Search Status -->
      <div v-if="isSearchMode" class="text-sm text-gray-600">
        <span v-if="isSearching">Searching...</span>
        <span v-else-if="searchResults.length > 0">
          Found {{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}
        </span>
        <span v-else>No results found</span>
      </div>
    </div>

    <PinGrid
      v-if="displayPosts.length > 0"
      :posts="displayPosts"
      @post-click="handlePostClick"
    />

    <div
      v-if="feedStore.isLoading"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4"
    >
      <PinSkeleton v-for="i in 10" :key="i" />
    </div>

    <div
      v-if="!feedStore.isLoading && feedStore.posts.length === 0"
      class="text-center py-12"
    >
      <p class="text-gray-500 dark:text-gray-400 text-lg">
        No posts yet. Start following users to see their content!
      </p>
    </div>

    <!-- Post Detail Modal -->
    <PostDetailModal
      :post-id="selectedPostId"
      :show="showPostDetail"
      @close="handleCloseDetail"
    />
  </LayoutThreeColumn>
</template>
