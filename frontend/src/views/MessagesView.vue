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

interface PresenceRow {
  userId: string
  isOnline: boolean
  lastSeenAt: string
}

const authStore = useAuthStore()
const messagesStore = useMessagesStore()

const selectedConversation = ref<Conversation | null>(null)
const messageText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const typingTimeout = ref<NodeJS.Timeout | null>(null)
const searchQuery = ref('')
const presence = ref<Record<string, PresenceRow>>({})

const conversations = computed(() => messagesStore.conversations)
const filteredConversations = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return conversations.value
  return conversations.value.filter((c) => {
    const name = c.otherUser.displayName?.toLowerCase() ?? ''
    const user = c.otherUser.username?.toLowerCase() ?? ''
    const last = c.lastMessage?.content?.toLowerCase() ?? ''
    return name.includes(q) || user.includes(q) || last.includes(q)
  })
})
const currentMessages = computed(() => messagesStore.currentMessages)
const isLoading = computed(() => messagesStore.isLoading)
const isLoadingMessages = ref(false)

const selectedPresence = computed(() => {
  const id = selectedConversation.value?.otherUser.id
  if (!id) return null
  return presence.value[id] ?? null
})

function refreshPresence() {
  const ids = conversations.value.map((c) => c.otherUser.id)
  if (ids.length > 0) socketService.checkPresence(ids)
}

function handlePresenceStatus(rows: PresenceRow[]) {
  const next = { ...presence.value }
  for (const row of rows) next[row.userId] = row
  presence.value = next
}

onMounted(async () => {
  await messagesStore.loadConversations()
  socketService.onMessageReceived(handleNewMessage)
  socketService.onMessageSent(handleMessageSent)
  socketService.onTyping(handleTypingIndicator)
  socketService.onPresenceStatus(handlePresenceStatus)
  refreshPresence()
})

onUnmounted(() => {
  socketService.offMessageReceived(handleNewMessage)
  socketService.offMessageSent(handleMessageSent)
  socketService.offTyping(handleTypingIndicator)
  socketService.offPresenceStatus(handlePresenceStatus)
  messagesStore.clearCurrentConversation()
})

watch(
  () => conversations.value.length,
  () => refreshPresence(),
)

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

      <!-- Search Box -->
      <div class="px-6 mb-4">
        <div class="bg-background-secondary rounded-xl px-4 py-2.5 flex items-center gap-3 border border-glass-border">
          <span class="text-text-dim text-sm">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search conversations..."
            class="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="isLoading" class="p-8 flex justify-center">
          <LoadingSpinner />
        </div>

        <div v-else-if="conversations.length === 0" class="p-12 text-center">
          <EmptyState title="No messages" description="Connect with other foodies!" icon="💬" />
        </div>

        <div v-else-if="filteredConversations.length === 0" class="p-12 text-center">
          <p class="text-text-dim text-sm">No conversations match "{{ searchQuery }}"</p>
        </div>

        <div v-else class="space-y-1 px-3">
          <div
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            @click="selectConversation(conversation)"
            class="p-4 rounded-2xl cursor-pointer transition-all duration-300 flex gap-4 items-center group"
            :class="selectedConversation?.id === conversation.id ? 'bg-orange-soft border-1.5 border-orange/20' : 'hover:bg-background-secondary'"
          >
            <div class="relative shrink-0">
              <UserAvatar :user="conversation.otherUser" size="md" :class="selectedConversation?.id === conversation.id ? 'ring-2 ring-orange' : ''" />
              <span
                v-if="presence[conversation.otherUser.id]?.isOnline"
                class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-surface"
                aria-label="Online"
              ></span>
            </div>

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
            <div class="relative">
              <UserAvatar :user="selectedConversation.otherUser" size="sm" class="border-2 border-orange" />
              <span
                v-if="selectedPresence?.isOnline"
                class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-surface"
              ></span>
            </div>
            <div>
              <h2 class="font-bold text-sm">{{ selectedConversation.otherUser.displayName }}</h2>
              <div class="flex items-center gap-1.5">
                <div :class="['w-1.5 h-1.5 rounded-full', selectedPresence?.isOnline ? 'bg-green-500' : 'bg-text-dim']"></div>
                <span class="text-[10px] text-text-dim font-bold uppercase tracking-wider">
                  {{ selectedPresence?.isOnline ? 'Online' : selectedPresence?.lastSeenAt ? `Last seen ${formatTime(selectedPresence.lastSeenAt)}` : 'Offline' }}
                </span>
              </div>
            </div>
          </div>
        </header>

        <!-- Messages container -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4 messages-bg">
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
            <div class="flex-1 relative">
              <input
                v-model="messageText"
                @input="handleTyping"
                type="text"
                placeholder="Message..."
                class="w-full px-5 py-3 bg-background-secondary border-1.5 border-glass-border rounded-2xl text-sm outline-none focus:border-orange transition-all"
              />
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

      <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center messages-bg">
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
.messages-bg {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(255, 107, 53, 0.06) 1px,
    transparent 0
  );
  background-size: 24px 24px;
}
</style>
