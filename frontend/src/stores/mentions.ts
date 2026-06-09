import { logger } from '@/utils/logger'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mentionsApi, type Mention } from '@/http/endpoints/mentions'

export const useMentionsStore = defineStore('mentions', () => {
  // State
  const mentions = ref<Mention[]>([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const currentOffset = ref(0)
  const limit = ref(50)

  // Computed
  const unreadMentions = computed(() =>
    mentions.value.filter(m => !m.comment || !m.comment.id)
  )

  const unreadCount = computed(() => unreadMentions.value.length)

  // Actions
  async function loadMentions(reset = false) {
    if (isLoading.value) return

    if (reset) {
      currentOffset.value = 0
      mentions.value = []
      hasMore.value = true
    }

    try {
      isLoading.value = true
      const response = await mentionsApi.getMentions(limit.value, currentOffset.value)

      if (reset) {
        mentions.value = response.mentions
      } else {
        mentions.value = [...mentions.value, ...response.mentions]
      }

      hasMore.value = response.pagination.hasMore
      currentOffset.value += response.mentions.length
    } catch (error) {
      logger.error('Failed to load mentions:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || isLoading.value) return
    await loadMentions(false)
  }

  async function refresh() {
    await loadMentions(true)
  }

  function addMention(mention: Mention) {
    // Add to the beginning of the list
    mentions.value.unshift(mention)
  }

  function removeMention(mentionId: string) {
    const index = mentions.value.findIndex(m => m.id === mentionId)
    if (index !== -1) {
      mentions.value.splice(index, 1)
    }
  }

  function clearMentions() {
    mentions.value = []
    currentOffset.value = 0
    hasMore.value = true
  }

  return {
    // State
    mentions,
    isLoading,
    hasMore,
    unreadMentions,
    unreadCount,

    // Actions
    loadMentions,
    loadMore,
    refresh,
    addMention,
    removeMention,
    clearMentions
  }
})
