import { logger } from '@/utils/logger'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { messagesApi, type Message, type Conversation } from '@/http/endpoints/messages'
import { socketService } from '@/lib/socket'

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

  async function loadConversations() {
    try {
      isLoading.value = true
      error.value = null

      const response = await messagesApi.getConversations()
      conversations.value = response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to load conversations'
      logger.error('Error loading conversations:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function loadMessages(userId: string, page = 1, limit = 50) {
    try {
      isLoading.value = true
      error.value = null
      currentConversationUserId.value = userId

      const response = await messagesApi.getMessages(userId, { page, limit })
      currentMessages.value = response.data.data

      await markConversationRead(userId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to load messages'
      logger.error('Error loading messages:', err)
    } finally {
      isLoading.value = false
    }
  }

  function sendMessage(recipientId: string, content: string) {
    if (socketService.isConnected) {
      socketService.sendMessage(recipientId, content)
    } else {
      sendMessageREST(recipientId, content)
    }
  }

  async function sendMessageREST(recipientId: string, content: string) {
    try {
      const response = await messagesApi.sendMessage({ recipientId, content })
      const message = response.data.data

      if (currentConversationUserId.value === recipientId) {
        currentMessages.value.push(message)
      }

      await loadConversations()
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to send message'
      logger.error('Error sending message:', err)
    }
  }

  async function markConversationRead(userId: string) {
    try {
      await messagesApi.markConversationRead(userId)

      const conv = conversations.value.find((c) => c.otherUser.id === userId)
      if (conv) {
        conv.unreadCount = 0
      }
    } catch (err: any) {
      logger.error('Error marking conversation as read:', err)
    }
  }

  async function deleteMessage(messageId: string) {
    try {
      await messagesApi.deleteMessage(messageId)

      currentMessages.value = currentMessages.value.filter((m) => m.id !== messageId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete message'
      logger.error('Error deleting message:', err)
    }
  }

  function handleMessageReceived(message: Message) {
    if (
      currentConversationUserId.value === message.senderId ||
      currentConversationUserId.value === message.recipientId
    ) {
      currentMessages.value.push(message)
    }

    loadConversations().catch((err) => {
      error.value = err?.message || 'Failed to refresh conversations'
    })
  }

  function handleMessageSent(message: Message) {
    if (currentConversationUserId.value === message.recipientId) {
      const exists = currentMessages.value.some((m) => m.id === message.id)
      if (!exists) {
        currentMessages.value.push(message)
      }
    }

    loadConversations().catch((err) => {
      error.value = err?.message || 'Failed to refresh conversations'
    })
  }

  function handleTyping(userId: string, isTyping: boolean) {
    if (isTyping) {
      typingUsers.value.add(userId)
    } else {
      typingUsers.value.delete(userId)
    }
  }

  function sendTypingIndicator(recipientId: string, isTyping: boolean) {
    if (socketService.isConnected) {
      socketService.sendTypingIndicator(recipientId, isTyping)
    }
  }

  function isUserTyping(userId: string): boolean {
    return typingUsers.value.has(userId)
  }

  function clearCurrentConversation() {
    currentMessages.value = []
    currentConversationUserId.value = null
    typingUsers.value.clear()
  }

  function reset() {
    conversations.value = []
    currentMessages.value = []
    currentConversationUserId.value = null
    isLoading.value = false
    error.value = null
    typingUsers.value.clear()
  }

  return {
    conversations,
    currentMessages,
    currentConversationUserId,
    isLoading,
    error,
    typingUsers,

    totalUnreadCount,

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
