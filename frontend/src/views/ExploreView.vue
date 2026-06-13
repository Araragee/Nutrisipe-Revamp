<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collectionsApi, type Collection } from '@/http/endpoints/collections'
import { useAuthStore } from '@/stores/auth'
import { logger } from '@/utils/logger'
import { useExploreSearch } from '@/composables/useExploreSearch'
import { useTrending } from '@/composables/useTrending'
import ExploreHero from '@/components/explore/ExploreHero.vue'
import TrendingTagsRail from '@/components/explore/TrendingTagsRail.vue'
import SearchResults from '@/components/explore/SearchResults.vue'
import CollectionsGrid from '@/components/explore/CollectionsGrid.vue'
import TrendingWeekRail from '@/components/explore/TrendingWeekRail.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const {
  searchQuery,
  searchType,
  postResults,
  userResults,
  isSearching,
  hasResults,
  showingResultsHeader,
  runSearch,
  clearResults,
  setFilter,
  searchTag,
} = useExploreSearch()

const { trendingPosts, loadingTrending, trendingTags, loadTrending, loadTrendingTags } =
  useTrending()

const collections = ref<Collection[]>([])
const loadingCollections = ref(false)

const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)

async function loadCollections() {
  if (!authStore.user?.id) return
  loadingCollections.value = true
  try {
    const { data } = await collectionsApi.getUserCollections(authStore.user.id)
    collections.value = data.data
  } catch (error) {
    logger.error('Load collections error:', error)
  } finally {
    loadingCollections.value = false
  }
}

function openPost(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

function clearSearch() {
  searchQuery.value = ''
  clearResults()
}

onMounted(() => {
  loadTrending()
  loadTrendingTags()
  loadCollections()
})
</script>

<template>
  <div>
    <ExploreHero
      v-model:query="searchQuery"
      :active-type="searchType"
      :posts="trendingPosts"
      @search="runSearch"
      @clear="clearResults"
      @select-filter="setFilter"
    />

    <div class="px-8 pb-20 max-w-7xl mx-auto">
      <TrendingTagsRail
        v-if="trendingTags.length > 0 && !hasResults"
        :tags="trendingTags"
        @select="searchTag"
      />

      <SearchResults
        v-if="showingResultsHeader"
        :query="searchQuery"
        :search-type="searchType"
        :posts="postResults"
        :users="userResults"
        :loading="isSearching"
        :current-user-id="authStore.user?.id"
        @clear="clearSearch"
        @open-post="openPost"
      />

      <CollectionsGrid
        v-if="!hasResults && collections.length > 0"
        :collections="collections"
        :loading="loadingCollections"
        @open="(id) => router.push(`/collections/${id}`)"
      />

      <TrendingWeekRail
        v-if="!hasResults"
        :posts="trendingPosts"
        :loading="loadingTrending"
        @open-post="openPost"
      />
    </div>

    <RecipeModal :post-id="selectedPostId" :show="showPostModal" @close="showPostModal = false" />
  </div>
</template>
