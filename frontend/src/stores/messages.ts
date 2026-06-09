import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { messagesApi, type Message, type Conversation } from '@/http/endpoints/messages'
import { socketService } from '@/services/socket'

export const useMessagesStore = defineStore('messages', () => {
  const conversations = ref<Conversation[]>([])
  const currentMessages = ref<Message[]>([])
  const currentConversationUserId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const typingUsers = ref<Set<string>>(new Set())

  const totalUnreadCount = computed(() => {
    return conversations.value.reduce((sum, conv) => sum + conv.unreadCount, 0)
  })

  // Load all conversations
  async function loadConversations() {
    try {
      isLoading.value = true
      error.value = null

      const response = await messagesApi.getConversations()
      conversations.value = response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to load conversations'
      console.error('Error loading conversations:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Load messages for a specific conversation
  async function loadMessages(userId: string, page = 1, limit = 50) {
    try {
      isLoading.value = true
      error.value = null
      currentConversationUserId.value = userId

      const response = await messagesApi.getMessages(userId, { page, limit })
      currentMessages.value = response.data.data

      // Mark conversation as read
      await markConversationRead(userId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to load messages'
      console.error('Error loading messages:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Send a message (via Socket.IO preferred)
  function sendMessage(recipientId: string, content: string) {
    if (socketService.isConnected) {
      socketService.sendMessage(recipientId, content)
    } else {
      // Fallback to REST API
      sendMessageREST(recipientId, content)
    }
  }

  // Send message via REST (fallback)
  async function sendMessageREST(recipientId: string, content: string) {
    try {
      const response = await messagesApi.sendMessage({ recipientId, content })
      const message = response.data.data

      // Add to current messages if viewing this conversation
      if (currentConversationUserId.value === recipientId) {
        currentMessages.value.push(message)
      }

      // Update conversation list
      await loadConversations()
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to send message'
      console.error('Error sending message:', err)
    }
  }

  // Mark conversation as read
  async function markConversationRead(userId: string) {
    try {
      await messagesApi.markConversationRead(userId)

      // Update local state
      const conv = conversations.value.find((c) => c.otherUser.id === userId)
      if (conv) {
        conv.unreadCount = 0
      }
    } catch (err: any) {
      console.error('Error marking conversation as read:', err)
    }
  }

  // Delete a message
  async function deleteMessage(messageId: string) {
    try {
      await messagesApi.deleteMessage(messageId)

      // Remove from current messages
      currentMessages.value = currentMessages.value.filter((m) => m.id !== messageId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete message'
      console.error('Error deleting message:', err)
    }
  }

  // Handle new message received (from Socket.IO)
  function handleMessageReceived(message: Message) {
    // Add to current messages if viewing this conversation
    if (
      currentConversationUserId.value === message.senderId ||
      currentConversationUserId.value === message.recipientId
    ) {
      currentMessages.value.push(message)
    }

    // Refresh conversation list; surface error in store state so UI can show it.
    loadConversations().catch((err) => {
      error.value = err?.message || 'Failed to refresh conversations'
    })
  }

  // Handle message sent (from Socket.IO)
  function handleMessageSent(message: Message) {
    // Add to current messages if viewing this conversation
    if (currentConversationUserId.value === message.recipientId) {
      // Check if message already exists (avoid duplicates)
      const exists = currentMessages.value.some((m) => m.id === message.id)
      if (!exists) {
        currentMessages.value.push(message)
      }
    }

    // Refresh conversation list; surface error in store state so UI can show it.
    loadConversations().catch((err) => {
      error.value = err?.message || 'Failed to refresh conversations'
    })
  }

  // Handle typing indicator
  function handleTyping(userId: string, isTyping: boolean) {
    if (isTyping) {
      typingUsers.value.add(userId)
    } else {
      typingUsers.value.delete(userId)
    }
  }

  // Send typing indicator
  function sendTypingIndicator(recipientId: string, isTyping: boolean) {
    if (socketService.isConnected) {
      socketService.sendTypingIndicator(recipientId, isTyping)
    }
  }

  // Check if a user is typing
  function isUserTyping(userId: string): boolean {
    return typingUsers.value.has(userId)
  }

  // Clear current conversation
  function clearCurrentConversation() {
    currentMessages.value = []
    currentConversationUserId.value = null
    typingUsers.value.clear()
  }

  // Reset store
  function reset() {
    conversations.value = []
    currentMessages.value = []
    currentConversationUserId.value = null
    isLoading.value = false
    error.value = null
    typingUsers.value.clear()
  }

  return {
    // State
    conversations,
    currentMessages,
    currentConversationUserId,
    isLoading,
    error,
    typingUsers,

    // Computed
    totalUnreadCount,

    // Actions
    loadConversations,
    loadMessages,
    sendMessage,
    markConversationRead,
    deleteMessage,
    handleMessageReceived,
    handleMessageSent,
    handleTyping,
    sendTypingIndicator,
    isUserTyping,
    clearCurrentConversation,
    reset
  }
})
