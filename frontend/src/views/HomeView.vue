<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFeedStore } from '@/stores/feed'
import { useAuthStore } from '@/stores/auth'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { searchPosts } from '@/http/posts'
import PinGrid from '@/components/feed/PinGrid.vue'
import PinSkeleton from '@/components/feed/PinSkeleton.vue'
import FeedHeader from '@/components/feed/FeedHeader.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'
import type { Post } from '@/typescript/interface/Post'

const router = useRouter()
const feedStore = useFeedStore()
const authStore = useAuthStore()
const { isNearBottom } = useInfiniteScroll()

const searchQuery = ref('')
const selectedCategory = ref<string>('All')
const isSearching = ref(false)
const searchResults = ref<Post[]>([])
const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

const displayPosts = computed(() => {
  return isSearchMode.value ? searchResults.value : feedStore.posts
})

const isSearchMode = computed(() => {
  return searchQuery.value.trim().length > 0 || (selectedCategory.value !== 'All' && selectedCategory.value !== '')
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function handleSearch(query?: string) {
  if (query !== undefined) searchQuery.value = query

  if (!searchQuery.value.trim() && (selectedCategory.value === 'All' || !selectedCategory.value)) {
    searchResults.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true

  try {
    const response = await searchPosts(
      searchQuery.value.trim() || '*',
      selectedCategory.value === 'All' ? undefined : selectedCategory.value
    )
    searchResults.value = response.data
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

function handleFilter(category: string) {
  selectedCategory.value = category
  handleSearch()
}

function debouncedSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 500)
}

watch(searchQuery, () => {
  debouncedSearch()
})

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // TODO: Implement skeleton loading state during initial user/feed fetch
  if (!authStore.user) {
    await authStore.fetchUser()
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
  <div class="home-view min-h-screen">
    <FeedHeader
      @search="handleSearch"
      @filter="handleFilter"
      :initial-query="searchQuery"
    />

    <div class="px-8 py-6">
      <div v-if="!isSearchMode" class="mb-8">
        <h2 class="font-montserrat font-extrabold text-2xl tracking-tight mb-1">
          Welcome back, {{ authStore.user?.displayName?.split(' ')[0] || 'Cook' }}! 👋
        </h2>
        <p class="text-text-dim text-sm">Here's what's trending in your community today.</p>
      </div>

      <div v-if="isSearchMode" class="mb-8">
        <h2 class="font-montserrat font-extrabold text-2xl tracking-tight mb-1">
          Search Results
        </h2>
        <p class="text-text-dim text-sm">
          Found {{ displayPosts.length }} recipes for "{{ searchQuery || selectedCategory }}"
        </p>
      </div>

      <PinGrid
        v-if="displayPosts.length > 0"
        :posts="displayPosts"
        @post-click="handlePostClick"
      />

      <div
        v-if="feedStore.isLoading"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-4"
      >
        <PinSkeleton v-for="i in 10" :key="i" />
      </div>

      <div
        v-if="!feedStore.isLoading && displayPosts.length === 0"
        class="flex flex-col items-center justify-center py-24 text-center"
      >
        <span class="text-5xl mb-6">🍳</span>
        <h3 class="text-xl font-bold mb-2">No recipes found</h3>
        <p class="text-text-dim max-w-xs mx-auto">
          {{ isSearchMode ? 'Try adjusting your filters or search terms.' : 'Start following users to see their content!' }}
        </p>
        <button v-if="isSearchMode" @click="() => { searchQuery = ''; selectedCategory = 'All'; handleSearch(); }" class="mt-6 text-orange font-bold hover:underline">
          Clear all filters
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
