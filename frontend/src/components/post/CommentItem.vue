<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { commentsApi } from '@/http/endpoints/comments'
import UserAvatar from '@/components/user/UserAvatar.vue'
import BaseIcons from '@/components/base/BaseIcons.vue'
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

const replyCount = computed(() => props.comment._count?.replies || replies.value.length)

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
    logger.error('Failed to load replies:', error)
  } finally {
    isLoadingReplies.value = false
  }
}

function startReply() {
  isReplying.value = true
}

async function handleReply() {
  if (!replyText.value.trim() || isSubmittingReply.value) return

  isSubmittingReply.value = true
  try {
    const response = await commentsApi.create({
      postId: props.postId,
      content: replyText.value.trim(),
      parentId: props.comment.id,
    })
    replies.value.unshift(response.data.data)
    replyText.value = ''
    isReplying.value = false
    showReplies.value = true
  } catch (error) {
    logger.error('Failed to reply:', error)
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
    logger.error('Failed to update:', error)
  }
}

function handleDeleteReply(replyId: string) {
  replies.value = replies.value.filter((r) => r.id !== replyId)
}

function handleUpdateReply(updatedReply: Comment) {
  const index = replies.value.findIndex((r) => r.id === updatedReply.id)
  if (index !== -1) {
    replies.value[index] = updatedReply
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="comment-item">
    <div class="group/comment flex gap-3">
      <UserAvatar :user="comment.user" size="sm" class="mt-0.5 shrink-0" />

      <div class="min-w-0 flex-1">
        <!-- Bubble -->
        <div class="rounded-2xl rounded-tl-md border border-border bg-background-secondary px-4 py-3">
          <div class="mb-0.5 flex items-center justify-between gap-2">
            <span class="truncate font-montserrat text-sm font-bold text-text">{{
              comment.user.displayName
            }}</span>
            <time class="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-dim">{{
              formatDate(comment.createdAt)
            }}</time>
          </div>

          <!-- Edit mode -->
          <div v-if="editingCommentId === comment.id" class="mt-2">
            <textarea
              v-model="editingCommentText"
              class="w-full resize-none rounded-xl border-1.5 border-orange/40 bg-background p-3 text-sm text-text outline-none transition-colors focus:border-orange"
              rows="2"
              @keyup.enter.ctrl="handleUpdate"
            ></textarea>
            <div class="mt-2 flex justify-end gap-3">
              <button
                @click="editingCommentId = null"
                class="text-xs font-bold uppercase tracking-wider text-text-dim transition-colors hover:text-text"
              >
                Cancel
              </button>
              <button
                @click="handleUpdate"
                class="text-xs font-bold uppercase tracking-wider text-orange transition-colors hover:text-orange-light"
              >
                Save
              </button>
            </div>
          </div>
          <p v-else class="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-text-muted">
            {{ comment.content }}
          </p>
        </div>

        <!-- Action row -->
        <div class="mt-1.5 flex items-center gap-1 px-1">
          <button
            @click="startReply"
            class="rounded-full px-2 py-1 text-xs font-bold text-text-dim transition-[color,background-color] duration-200 hover:bg-orange-soft hover:text-orange"
          >
            Reply
          </button>
          <button
            v-if="replyCount > 0"
            @click="toggleReplies"
            class="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-orange transition-colors hover:bg-orange-soft"
          >
            <BaseIcons
              name="chevron-down"
              size="xs"
              class="transition-transform duration-200 ease-revamp"
              :class="showReplies ? 'rotate-180' : ''"
            />
            <span class="tabular-nums">{{ replyCount }}</span>
            {{ replyCount === 1 ? 'reply' : 'replies' }}
          </button>

          <div
            v-if="isOwner"
            class="ml-auto flex gap-1 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover/comment:opacity-100"
          >
            <button
              @click="startEdit"
              aria-label="Edit comment"
              class="grid h-7 w-7 place-items-center rounded-full text-text-dim transition-[color,background-color] duration-200 hover:bg-background-secondary hover:text-text"
            >
              <BaseIcons name="pencil" size="xs" />
            </button>
            <button
              @click="emit('delete', comment.id)"
              aria-label="Delete comment"
              class="grid h-7 w-7 place-items-center rounded-full text-text-dim transition-[color,background-color] duration-200 hover:bg-red-500/10 hover:text-red-500"
            >
              <BaseIcons name="trash" size="xs" />
            </button>
          </div>
        </div>

        <!-- Reply input -->
        <Transition name="reply">
          <div v-if="isReplying" class="mt-3 flex gap-2.5">
            <UserAvatar v-if="authStore.user" :user="authStore.user" size="xs" class="mt-1 shrink-0" />
            <div class="flex-1">
              <textarea
                v-model="replyText"
                placeholder="Write a reply…"
                class="w-full resize-none rounded-xl border-1.5 border-border bg-background-secondary p-3 text-sm text-text outline-none transition-colors focus:border-orange"
                rows="2"
                @keyup.enter.ctrl="handleReply"
              ></textarea>
              <div class="mt-2 flex justify-end gap-2">
                <button
                  @click="isReplying = false"
                  class="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-text-dim transition-colors hover:text-text"
                >
                  Cancel
                </button>
                <button
                  @click="handleReply"
                  :disabled="!replyText.trim() || isSubmittingReply"
                  class="inline-flex items-center gap-1.5 rounded-full bg-orange px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-[transform,opacity] duration-200 ease-revamp hover:bg-orange-light active:scale-[0.96] disabled:opacity-50"
                >
                  <span
                    v-if="isSubmittingReply"
                    class="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                  ></span>
                  Reply
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Replies -->
        <div v-if="showReplies" class="mt-4 space-y-4 border-l-2 border-border pl-4">
          <div v-if="isLoadingReplies" class="flex justify-center py-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-orange border-t-transparent"></div>
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

<style scoped>
.reply-enter-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.reply-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.reply-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.reply-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .reply-enter-active,
  .reply-leave-active {
    transition: none;
  }
}
</style>
