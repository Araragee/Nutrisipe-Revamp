import { ref } from 'vue'
import { searchApi, type TrendingTag } from '@/http/endpoints/search'
import { logger } from '@/utils/logger'
import type { Post } from '@/types/Post'

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
