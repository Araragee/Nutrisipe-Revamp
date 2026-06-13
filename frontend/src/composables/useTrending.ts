import { ref } from 'vue'
import { searchApi, type TrendingTag } from '@/http/endpoints/search'
import { logger } from '@/utils/logger'
import type { Post } from '@/typescript/interface/Post'

/**
 * Loads the explore page's trending data: a set of trending posts and a list
 * of trending tags. Each loader owns its own loading flag and swallows errors
 * into the logger so the view can render empty states without crashing.
 */
export function useTrending() {
  const trendingPosts = ref<Post[]>([])
  const loadingTrending = ref(false)
  const trendingTags = ref<TrendingTag[]>([])

  async function loadTrending() {
    loadingTrending.value = true
    try {
      const { data } = await searchApi.getTrending({ period: '7days', page: 1, limit: 16 })
      trendingPosts.value = data.data
    } catch (error) {
      logger.error('Load trending error:', error)
    } finally {
      loadingTrending.value = false
    }
  }

  async function loadTrendingTags() {
    try {
      const { data } = await searchApi.getTrendingTags(20)
      trendingTags.value = data.data
    } catch (error) {
      logger.error('Load trending tags error:', error)
    }
  }

  return {
    trendingPosts,
    loadingTrending,
    trendingTags,
    loadTrending,
    loadTrendingTags,
  }
}
