<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { socketService } from '@/services/socket'
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

onMounted(async () => {
  await messagesStore.loadConversations()
  socketService.onMessageReceived(handleNewMessage)
  socketService.onMessageSent(handleMessageSent)
  socketService.onTyping(handleTypingIndicator)
})

onUnmounted(() => {
  socketService.offMessageReceived(handleNewMessage)
  socketService.offMessageSent(handleMessageSent)
  socketService.offTyping(handleTypingIndicator)
  messagesStore.clearCurrentConversation()
})

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

async function sendMessage() {
  if (!messageText.value.trim() || !selectedConversation.value) return

  const content = messageText.value.trim()
  messageText.value = ''

  messagesStore.sendMessage(selectedConversation.value.otherUser.id, content)

  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  messagesStore.sendTypingIndicator(selectedConversation.value.otherUser.id, false)

  await nextTick()
  scrollToBottom()
}

function handleTyping() {
  if (!selectedConversation.value) return
  messagesStore.sendTypingIndicator(selectedConversation.value.otherUser.id, true)
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  typingTimeout.value = setTimeout(() => {
    if (selectedConversation.value) {
      messagesStore.sendTypingIndicator(selectedConversation.value.otherUser.id, false)
    }
  }, 2000)
}

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

function handleMessageSent(message: any) {
  messagesStore.handleMessageSent(message)
  nextTick(() => scrollToBottom())
}

function handleTypingIndicator(data: { userId: string; isTyping: boolean }) {
  messagesStore.handleTyping(data.userId, data.isTyping)
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function formatTime(timestamp: string) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

watch(
  () => messagesStore.currentMessages.length,
  () => {
    nextTick(() => scrollToBottom())
  }
)
</script>

<template>
  <div class="messages-view flex h-screen overflow-hidden bg-background">
    <!-- Sidebar: Conversations -->
    <div
      class="w-full md:w-80 lg:w-96 border-r border-glass-border flex flex-col bg-surface/50 backdrop-blur-xl"
      :class="{ 'hidden md:flex': selectedConversation }"
    >
      <div class="p-6 pb-4">
        <h1 class="font-montserrat font-extrabold text-2xl tracking-tight mb-1">Messages</h1>
        <p class="text-text-dim text-xs font-bold uppercase tracking-widest">
          {{ conversations.length }} active chats
        </p>
      </div>

      <!-- Search Box placeholder -->
      <div class="px-6 mb-4">
        <div class="bg-background-secondary rounded-xl px-4 py-2.5 flex items-center gap-3 border border-glass-border">
          <span class="text-text-dim text-sm">🔍</span>
          <input type="text" placeholder="Search conversations..." class="bg-transparent border-none outline-none text-sm w-full" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="isLoading" class="p-8 flex justify-center">
          <LoadingSpinner />
        </div>

        <div v-else-if="conversations.length === 0" class="p-12 text-center">
          <EmptyState title="No messages" description="Connect with other foodies!" icon="💬" />
        </div>

        <div v-else class="space-y-1 px-3">
          <div
            v-for="conversation in conversations"
            :key="conversation.id"
            @click="selectConversation(conversation)"
            class="p-4 rounded-2xl cursor-pointer transition-all duration-300 flex gap-4 items-center group"
            :class="selectedConversation?.id === conversation.id ? 'bg-orange-soft border-1.5 border-orange/20' : 'hover:bg-background-secondary'"
          >
            <UserAvatar :user="conversation.otherUser" size="md" :class="selectedConversation?.id === conversation.id ? 'ring-2 ring-orange' : ''" />

            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-0.5">
                <h3 class="font-bold text-sm truncate" :class="selectedConversation?.id === conversation.id ? 'text-orange' : ''">
                  {{ conversation.otherUser.displayName }}
                </h3>
                <span v-if="conversation.lastMessage" class="text-[10px] text-text-dim font-medium">
                  {{ formatTime(conversation.lastMessage.createdAt) }}
                </span>
              </div>
              <p
                v-if="conversation.lastMessage"
                class="text-xs truncate"
                :class="conversation.unreadCount > 0 ? 'text-text font-extrabold' : 'text-text-muted'"
              >
                {{ conversation.lastMessage.content }}
              </p>
            </div>

            <div v-if="conversation.unreadCount > 0" class="w-2 h-2 rounded-full bg-orange shadow-lg shadow-orange/40"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main: Chat Area -->
    <div
      class="flex-1 flex flex-col bg-background relative"
      :class="{ 'hidden md:flex': !selectedConversation }"
    >
      <template v-if="selectedConversation">
        <!-- Chat Header -->
        <header class="h-16 lg:h-20 border-b border-glass-border bg-surface/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-10">
          <div class="flex items-center gap-3">
            <button @click="selectedConversation = null" class="md:hidden w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-lg">‹</button>
            <UserAvatar :user="selectedConversation.otherUser" size="sm" class="border-2 border-orange" />
            <div>
              <h2 class="font-bold text-sm">{{ selectedConversation.otherUser.displayName }}</h2>
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span class="text-[10px] text-text-dim font-bold uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button class="w-9 h-9 rounded-xl bg-background-secondary flex items-center justify-center text-text-muted hover:text-orange transition-colors">📞</button>
            <button class="w-9 h-9 rounded-xl bg-background-secondary flex items-center justify-center text-text-muted hover:text-orange transition-colors">ℹ️</button>
          </div>
        </header>

        <!-- Messages container -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-95">
          <div v-if="isLoadingMessages" class="flex justify-center py-10">
            <LoadingSpinner />
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="message in currentMessages"
              :key="message.id"
              class="flex"
              :class="message.senderId === authStore.user?.id ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm"
                :class="message.senderId === authStore.user?.id
                    ? 'bg-orange text-white rounded-tr-none'
                    : 'bg-surface-solid border border-glass-border text-text rounded-tl-none'"
              >
                <p class="leading-relaxed">{{ message.content }}</p>
                <p
                  class="text-[9px] mt-1.5 font-bold uppercase tracking-widest opacity-60"
                  :class="message.senderId === authStore.user?.id ? 'text-white text-right' : 'text-text-dim'"
                >
                  {{ formatTime(message.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Typing -->
          <div
            v-if="messagesStore.isUserTyping(selectedConversation.otherUser.id)"
            class="flex justify-start animate-revamp"
          >
            <div class="bg-surface-solid border border-glass-border rounded-2xl rounded-tl-none px-4 py-2 flex gap-1 items-center">
              <div class="w-1 h-1 rounded-full bg-text-dim animate-bounce"></div>
              <div class="w-1 h-1 rounded-full bg-text-dim animate-bounce [animation-delay:0.2s]"></div>
              <div class="w-1 h-1 rounded-full bg-text-dim animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <footer class="p-6 bg-surface/80 backdrop-blur-xl border-t border-glass-border">
          <form @submit.prevent="sendMessage" class="flex items-center gap-3">
            <button type="button" class="w-10 h-10 shrink-0 rounded-full bg-background-secondary text-lg flex items-center justify-center hover:bg-orange-soft hover:text-orange transition-all">📎</button>
            <div class="flex-1 relative">
              <input
                v-model="messageText"
                @input="handleTyping"
                type="text"
                placeholder="Message..."
                class="w-full px-5 py-3 bg-background-secondary border-1.5 border-glass-border rounded-2xl text-sm outline-none focus:border-orange transition-all"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-lg">😊</button>
            </div>
            <button
              type="submit"
              :disabled="!messageText.trim()"
              class="w-10 h-10 shrink-0 rounded-full bg-orange text-white flex items-center justify-center shadow-lg shadow-orange/30 disabled:opacity-50 disabled:scale-95 transition-all active:scale-90"
            >
              🚀
            </button>
          </form>
        </footer>
      </template>

      <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div class="w-24 h-24 rounded-full bg-orange-soft flex items-center justify-center text-4xl mb-6 shadow-inner animate-pulse">💬</div>
        <h2 class="font-montserrat font-extrabold text-2xl mb-2">Your conversations</h2>
        <p class="text-text-dim max-w-xs mx-auto text-sm leading-relaxed">
          Select a chat from the sidebar to start messaging with your favorite creators and followers.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-revamp {
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
