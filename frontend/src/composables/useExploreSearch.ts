import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { searchApi } from '@/http/endpoints/search'
import { logger } from '@/utils/logger'
import type { Post } from '@/typescript/interface/Post'
import type { UserBasic } from '@/typescript/interface/User'

export type SearchType = 'all' | 'recipes' | 'people'

/**
 * Owns explore search state: the query, the active filter, and the post/user
 * result sets. Keeps the `?q=` route param in sync so deep links and the global
 * search bar drive the same state. `null` results mean "no search run yet";
 * an empty array means "searched, nothing found".
 */
export function useExploreSearch() {
  const route = useRoute()

  const searchQuery = ref('')
  const searchType = ref<SearchType>('all')
  const postResults = ref<Post[] | null>(null)
  const userResults = ref<UserBasic[] | null>(null)
  const isSearching = ref(false)

  const hasResults = computed(
    () => postResults.value !== null || userResults.value !== null,
  )
  const showingResultsHeader = computed(() => hasResults.value || isSearching.value)

  function clearResults() {
    postResults.value = null
    userResults.value = null
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
        const { data } = await postsApi.search(q, 1)
        postResults.value = data.data
        userResults.value = []
      } else if (searchType.value === 'people') {
        const { data } = await searchApi.search({ q, type: 'users', limit: 30 })
        userResults.value = data.data.users ?? []
        postResults.value = []
      } else {
        const { data } = await searchApi.search({ q, type: 'all', limit: 20 })
        postResults.value = data.data.posts ?? []
        userResults.value = data.data.users ?? []
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

  function applyQueryParam() {
    const q = (route.query.q as string)?.trim()
    if (q && q !== searchQuery.value) {
      searchQuery.value = q
      runSearch()
    }
  }

  // Run once on setup (deep links) and on every subsequent `?q=` change.
  watch(() => route.query.q, applyQueryParam, { immediate: true })

  return {
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
  }
}
