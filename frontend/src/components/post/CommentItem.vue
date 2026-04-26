<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { commentsApi } from '@/http/endpoints/comments'
import UserAvatar from '@/components/user/UserAvatar.vue'
import type { Comment } from '@/typescript/interface/Comment'

const props = defineProps<{
  comment: Comment
  postId: string
}>()

const emit = defineEmits<{
  delete: [commentId: string]
  update: [comment: Comment]
  reply: [comment: Comment]
}>()

const authStore = useAuthStore()
const isOwner = computed(() => authStore.user?.id === props.comment.userId)

const showReplies = ref(false)
const replies = ref<Comment[]>([])
const isLoadingReplies = ref(false)
const isReplying = ref(false)
const replyText = ref('')
const isSubmittingReply = ref(false)

const editingCommentId = ref<string | null>(null)
const editingCommentText = ref('')

async function toggleReplies() {
  showReplies.value = !showReplies.value
  if (showReplies.value && replies.value.length === 0) {
    loadReplies()
  }
}

async function loadReplies() {
  isLoadingReplies.value = true
  try {
    const response = await commentsApi.getByPost(props.postId, 1, 50, props.comment.id)
    replies.value = response.data.data
  } catch (error) {
    console.error('Failed to load replies:', error)
  } finally {
    isLoadingReplies.value = false
  }
}

async function handleReply() {
  if (!replyText.value.trim() || isSubmittingReply.value) return

  isSubmittingReply.value = true
  try {
    const response = await commentsApi.create({
      postId: props.postId,
      content: replyText.value.trim(),
      parentId: props.comment.id
    })
    replies.value.unshift(response.data.data)
    replyText.value = ''
    isReplying.value = false
    showReplies.value = true
  } catch (error) {
    console.error('Failed to reply:', error)
  } finally {
    isSubmittingReply.value = false
  }
}

function startEdit() {
  editingCommentId.value = props.comment.id
  editingCommentText.value = props.comment.content
}

async function handleUpdate() {
  if (!editingCommentText.value.trim()) return
  try {
    const response = await commentsApi.update(props.comment.id, editingCommentText.value.trim())
    emit('update', response.data.data)
    editingCommentId.value = null
  } catch (error) {
    console.error('Failed to update:', error)
  }
}

function handleDeleteReply(replyId: string) {
  replies.value = replies.value.filter(r => r.id !== replyId)
}

function handleUpdateReply(updatedReply: Comment) {
  const index = replies.value.findIndex(r => r.id === updatedReply.id)
  if (index !== -1) {
    replies.value[index] = updatedReply
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="comment-item">
    <div class="flex gap-3 group">
      <UserAvatar :user="comment.user" size="sm" class="shrink-0" />
      
      <div class="flex-1 min-w-0">
        <div class="bg-background-secondary rounded-2xl p-4 border border-glass-border">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-sm">{{ comment.user.displayName }}</span>
            <span class="text-[10px] text-text-dim">{{ formatDate(comment.createdAt) }}</span>
          </div>
          
          <div v-if="editingCommentId === comment.id" class="mt-2">
            <textarea
              v-model="editingCommentText"
              class="w-full bg-background border border-orange/30 rounded-xl p-3 text-sm focus:border-orange outline-none resize-none"
              rows="2"
            ></textarea>
            <div class="flex justify-end gap-2 mt-2">
              <button @click="editingCommentId = null" class="text-xs text-text-dim hover:text-text">Cancel</button>
              <button @click="handleUpdate" class="text-xs text-orange font-bold">Save</button>
            </div>
          </div>
          <p v-else class="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
            {{ comment.content }}
          </p>
        </div>
        
        <div class="flex items-center gap-4 mt-2 px-2">
          <button @click="isReplying = !isReplying" class="text-xs font-bold text-text-dim hover:text-orange transition-colors">
            Reply
          </button>
          <button
            v-if="comment._count?.replies || replies.length > 0"
            @click="toggleReplies"
            class="text-xs font-bold text-orange hover:underline"
          >
            {{ showReplies ? 'Hide' : 'Show' }} {{ comment._count?.replies || replies.length }} replies
          </button>
          
          <div v-if="isOwner" class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
            <button @click="startEdit" class="text-[10px] uppercase font-bold tracking-wider text-text-dim hover:text-text">Edit</button>
            <button @click="emit('delete', comment.id)" class="text-[10px] uppercase font-bold tracking-wider text-text-dim hover:text-red-500">Delete</button>
          </div>
        </div>
        
        <!-- Reply Input -->
        <div v-if="isReplying" class="mt-4 flex gap-3 animate-revamp">
          <UserAvatar v-if="authStore.user" :user="authStore.user" size="xs" class="shrink-0 mt-1" />
          <div class="flex-1">
            <textarea
              v-model="replyText"
              placeholder="Write a reply..."
              class="w-full bg-background-secondary border border-glass-border rounded-xl p-3 text-sm focus:border-orange outline-none resize-none"
              rows="2"
              @keyup.enter.ctrl="handleReply"
            ></textarea>
            <div class="flex justify-end gap-3 mt-2">
              <button @click="isReplying = false" class="text-xs text-text-dim">Cancel</button>
              <button
                @click="handleReply"
                :disabled="!replyText.trim() || isSubmittingReply"
                class="px-4 py-1.5 bg-orange text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
        
        <!-- Replies List -->
        <div v-if="showReplies" class="mt-4 space-y-4 border-l-2 border-glass-border ml-2 pl-4">
          <div v-if="isLoadingReplies" class="flex justify-center py-2">
             <div class="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
          </div>
          <CommentItem
            v-for="reply in replies"
            :key="reply.id"
            :comment="reply"
            :post-id="postId"
            @delete="handleDeleteReply"
            @update="handleUpdateReply"
          />
        </div>
      </div>
    </div>
  </div>
</template>
