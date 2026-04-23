<template>
  <LayoutThreeColumn>
    <div class="h-screen flex">
      <!-- Conversations List -->
      <div
        class="w-full md:w-1/3 border-r dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800"
      >
        <!-- Header -->
        <div class="p-4 border-b dark:border-gray-700">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ conversations.length }} conversation{{ conversations.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Conversation List -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="isLoading" class="p-4">
            <LoadingSpinner />
          </div>

          <div v-else-if="conversations.length === 0" class="p-8 text-center">
            <EmptyState
              title="No messages yet"
              description="Start a conversation with someone"
              icon="💬"
            />
          </div>

          <div v-else>
            <div
              v-for="conversation in conversations"
              :key="conversation.id"
              @click="selectConversation(conversation)"
              class="p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :class="{
                'bg-gray-100 dark:bg-gray-700': selectedConversation?.id === conversation.id
              }"
            >
              <div class="flex items-start space-x-3">
                <!-- Avatar -->
                <UserAvatar :user="conversation.otherUser" size="md" />

                <div class="flex-1 min-w-0">
                  <!-- User Info -->
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                      {{ conversation.otherUser.displayName }}
                    </h3>
                    <span v-if="conversation.lastMessage" class="text-xs text-gray-500">
                      {{ formatTime(conversation.lastMessage.createdAt) }}
                    </span>
                  </div>

                  <!-- Last Message -->
                  <p
                    v-if="conversation.lastMessage"
                    class="text-sm text-gray-600 dark:text-gray-400 truncate"
                    :class="{ 'font-semibold': conversation.unreadCount > 0 }"
                  >
                    {{ conversation.lastMessage.content }}
                  </p>

                  <!-- Unread Badge -->
                  <div v-if="conversation.unreadCount > 0" class="mt-1">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {{ conversation.unreadCount }} new
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Area -->
      <div
        class="hidden md:flex flex-col flex-1 bg-white dark:bg-gray-800"
        v-if="selectedConversation"
      >
        <!-- Chat Header -->
        <div class="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <UserAvatar :user="selectedConversation.otherUser" size="md" />
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">
                {{ selectedConversation.otherUser.displayName }}
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                @{{ selectedConversation.otherUser.username }}
              </p>
            </div>
          </div>

          <button
            @click="selectedConversation = null"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Messages Area -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-if="isLoadingMessages" class="flex justify-center">
            <LoadingSpinner />
          </div>

          <div v-else-if="currentMessages.length === 0" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>

          <div v-else>
            <div
              v-for="message in currentMessages"
              :key="message.id"
              class="flex"
              :class="message.senderId === authStore.user?.id ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
                :class="
                  message.senderId === authStore.user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                "
              >
                <p class="text-sm break-words">{{ message.content }}</p>
                <p
                  class="text-xs mt-1"
                  :class="
                    message.senderId === authStore.user?.id
                      ? 'text-blue-100'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                >
                  {{ formatTime(message.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div
            v-if="messagesStore.isUserTyping(selectedConversation.otherUser.id)"
            class="flex justify-start"
          >
            <div class="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Typing...</span>
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="p-4 border-t dark:border-gray-700">
          <form @submit.prevent="sendMessage" class="flex space-x-2">
            <input
              v-model="messageText"
              @input="handleTyping"
              type="text"
              placeholder="Type a message..."
              class="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              :disabled="!messageText.trim()"
              class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <!-- Empty State (No Conversation Selected) -->
      <div
        v-else
        class="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900"
      >
        <div class="text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No conversation selected</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    </div>
  </LayoutThreeColumn>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { socketService } from '@/services/socket'
import LayoutThreeColumn from '@/components/layout/LayoutThreeColumn.vue'
import UserAvatar from '@/components/user/UserAvatar.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { formatDistanceToNow } from 'date-fns'
import type { Conversation } from '@/http/endpoints/messages'

const authStore = useAuthStore()
const messagesStore = useMessagesStore()

const selectedConversation = ref<Conversation | null>(null)
const messageText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const typingTimeout = ref<NodeJS.Timeout | null>(null)

const conversations = computed(() => messagesStore.conversations)
const currentMessages = computed(() => messagesStore.currentMessages)
const isLoading = computed(() => messagesStore.isLoading)
const isLoadingMessages = ref(false)

// Load conversations on mount
onMounted(async () => {
  await messagesStore.loadConversations()

  // Set up socket listeners
  socketService.onMessageReceived(handleNewMessage)
  socketService.onMessageSent(handleMessageSent)
  socketService.onTyping(handleTypingIndicator)
})

// Clean up on unmount
onUnmounted(() => {
  socketService.offMessageReceived(handleNewMessage)
  socketService.offMessageSent(handleMessageSent)
  socketService.offTyping(handleTypingIndicator)
  messagesStore.clearCurrentConversation()
})

// Select a conversation
async function selectConversation(conversation: Conversation) {
  selectedConversation.value = conversation
  isLoadingMessages.value = true

  try {
    await messagesStore.loadMessages(conversation.otherUser.id)
    await nextTick()
    scrollToBottom()
  } finally {
    isLoadingMessages.value = false
  }
}

// Send a message
async function sendMessage() {
  if (!messageText.value.trim() || !selectedConversation.value) return

  const content = messageText.value.trim()
  messageText.value = ''

  messagesStore.sendMessage(selectedConversation.value.otherUser.id, content)

  // Stop typing indicator
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  messagesStore.sendTypingIndicator(selectedConversation.value.otherUser.id, false)

  await nextTick()
  scrollToBottom()
}

// Handle typing indicator
function handleTyping() {
  if (!selectedConversation.value) return

  // Send typing = true
  messagesStore.sendTypingIndicator(selectedConversation.value.otherUser.id, true)

  // Clear existing timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  // Set timeout to stop typing after 2 seconds
  typingTimeout.value = setTimeout(() => {
    if (selectedConversation.value) {
      messagesStore.sendTypingIndicator(selectedConversation.value.otherUser.id, false)
    }
  }, 2000)
}

// Handle new message from socket
function handleNewMessage(message: any) {
  messagesStore.handleMessageReceived(message)
  if (
    selectedConversation.value &&
    (message.senderId === selectedConversation.value.otherUser.id ||
      message.recipientId === selectedConversation.value.otherUser.id)
  ) {
    nextTick(() => scrollToBottom())
  }
}

// Handle message sent confirmation
function handleMessageSent(message: any) {
  messagesStore.handleMessageSent(message)
  nextTick(() => scrollToBottom())
}

// Handle typing indicator
function handleTypingIndicator(data: { userId: string; isTyping: boolean }) {
  messagesStore.handleTyping(data.userId, data.isTyping)
}

// Scroll to bottom of messages
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Format time
function formatTime(timestamp: string) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

// Watch for new messages and scroll
watch(
  () => messagesStore.currentMessages.length,
  () => {
    nextTick(() => scrollToBottom())
  }
)
</script>
