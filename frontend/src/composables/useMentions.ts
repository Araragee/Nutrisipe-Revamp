import { logger } from '@/utils/logger'
import { ref, computed } from 'vue'
import { mentionsApi } from '@/http/endpoints/mentions'

export interface MentionUser {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
}

export function useMentions() {
  const searchResults = ref<MentionUser[]>([])
  const isSearching = ref(false)
  const showSuggestions = ref(false)
  const selectedIndex = ref(0)

  // Search for users to mention
  async function searchUsers(query: string) {
    if (!query || query.length < 2) {
      searchResults.value = []
      showSuggestions.value = false
      return
    }

    try {
      isSearching.value = true
      const response = await mentionsApi.searchUsers(query)
      searchResults.value = response.users
      showSuggestions.value = response.users.length > 0
      selectedIndex.value = 0
    } catch (error) {
      logger.error('Failed to search users:', error)
      searchResults.value = []
      showSuggestions.value = false
    } finally {
      isSearching.value = false
    }
  }

  // Extract @mentions from text
  function extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1])
    }

    return [...new Set(mentions)]
  }

  // Check if cursor is at a mention
  function getMentionQuery(text: string, cursorPosition: number): string | null {
    const textBeforeCursor = text.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex === -1) {
      return null
    }

    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)

    // Check if there's a space after @ (which would end the mention)
    if (textAfterAt.includes(' ')) {
      return null
    }

    return textAfterAt
  }

  // Navigate suggestions with arrow keys
  function navigateUp() {
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    }
  }

  function navigateDown() {
    if (selectedIndex.value < searchResults.value.length - 1) {
      selectedIndex.value++
    }
  }

  // Get selected user
  const selectedUser = computed(() => {
    return searchResults.value[selectedIndex.value] || null
  })

  // Close suggestions
  function closeSuggestions() {
    showSuggestions.value = false
    searchResults.value = []
    selectedIndex.value = 0
  }

  // Insert mention into text
  function insertMention(
    text: string,
    cursorPosition: number,
    user: MentionUser
  ): { text: string; newCursorPosition: number } {
    const textBeforeCursor = text.substring(0, cursorPosition)
    const textAfterCursor = text.substring(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex === -1) {
      return { text, newCursorPosition: cursorPosition }
    }

    const beforeMention = text.substring(0, lastAtIndex)
    const mention = `@${user.username} `
    const newText = beforeMention + mention + textAfterCursor
    const newCursorPosition = lastAtIndex + mention.length

    return {
      text: newText,
      newCursorPosition
    }
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  // Convert @mentions to clickable links (for display).
  // Input is escaped first so only the mention spans survive as markup.
  function renderMentions(text: string): string {
    return escapeHtml(text).replace(
      /@(\w+)/g,
      '<span class="mention" data-username="$1">@$1</span>'
    )
  }

  return {
    searchResults,
    isSearching,
    showSuggestions,
    selectedIndex,
    selectedUser,
    searchUsers,
    extractMentions,
    getMentionQuery,
    navigateUp,
    navigateDown,
    closeSuggestions,
    insertMention,
    renderMentions
  }
}
