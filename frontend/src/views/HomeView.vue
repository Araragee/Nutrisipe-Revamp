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

const searchQuery = ref('')
const selectedCategory = ref<string>('All')
const isSearching = ref(false)
const searchResults = ref<Post[]>([])
const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)

const feedScope = computed(() => {
  const scope = route.query.scope as string
  if (scope === 'following') return 'following'
  if (scope === 'for-you') return 'recommendations'
  return 'all'
})

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
    let response
    if (selectedCategory.value !== 'All' && !searchQuery.value.trim()) {
      response = await postsApi.getByTag(selectedCategory.value)
    } else {
      response = await postsApi.search(searchQuery.value.trim())
    }
    searchResults.value = response.data.data
  } catch (error) {
    logger.error('Search failed:', error)
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

watch(searchQuery, () => {
  debouncedSearch()
})

watch([feedScope, () => route.query.tag], () => {
  if (route.query.tag) {
    selectedCategory.value = route.query.tag as string
    handleSearch()
  } else {
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
    selectedCategory.value = route.query.tag as string
    handleSearch()
  } else {
    feedStore.fetchFeed(true, feedScope.value)
  }
})

watch(isNearBottom, (near) => {
  if (near && !feedStore.isLoading && feedStore.hasMore && !isSearchMode.value) {
    feedStore.fetchFeed(false, feedScope.value)
  }
})
</script>

<template>
  <div class="home-view min-h-screen pt-8">

    <div class="px-8 py-6">
      <div v-if="!isSearchMode" class="mb-6">
        <h2 class="font-montserrat font-extrabold text-2xl tracking-tight mb-1">
          Welcome back, {{ authStore.user?.displayName?.split(' ')[0] || 'Cook' }}! 👋
        </h2>
        <p class="text-text-dim text-sm">Here's what's trending in your community today.</p>
      </div>

      <StoriesRail v-if="!isSearchMode" class="mb-6" />

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
        <BaseIcons name="fire" size="xl" class="mx-auto mb-6 text-text-dim" />
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
