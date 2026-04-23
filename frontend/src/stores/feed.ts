import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postsApi } from '@/http/endpoints/posts'
import type { Post } from '@/typescript/interface/Post'
import { useCache } from '@/composables/useCache'

export const useFeedStore = defineStore('feed', () => {
  const posts = ref<Post[]>([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const error = ref<string | null>(null)
  const { cacheApiCall, invalidateCache } = useCache()

  async function fetchFeed(reset = false) {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      if (reset) {
        currentPage.value = 1
        posts.value = []
        hasMore.value = true
      }

      const cacheKey = `feed_page_${currentPage.value}`
      const response = await cacheApiCall(
        cacheKey,
        () => postsApi.getFeed(currentPage.value, 20),
        2 * 60 * 1000 // Cache for 2 minutes
      )

      if (reset) {
        posts.value = response.data.data
      } else {
        posts.value.push(...response.data.data)
      }

      hasMore.value = currentPage.value < response.data.pagination.totalPages
      currentPage.value++
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch feed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function updatePostEngagement(postId: string, updates: Partial<Post>) {
    const post = posts.value.find((p) => p.id === postId)
    if (post) {
      Object.assign(post, updates)
    }
  }

  function removePost(postId: string) {
    posts.value = posts.value.filter((p) => p.id !== postId)
  }

  function addPost(post: Post) {
    posts.value.unshift(post)
    // Invalidate all feed cache when new post is added
    invalidateCache(/^feed_page_/)
  }

  return {
    posts,
    isLoading,
    hasMore,
    currentPage,
    error,
    fetchFeed,
    updatePostEngagement,
    removePost,
    addPost,
  }
})
