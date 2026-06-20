<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { commentsApi } from '@/http/endpoints/comments'
import UserAvatar from '@/components/user/UserAvatar.vue'
import CommentItem from './CommentItem.vue'
import MentionInput from '@/components/common/MentionInput.vue'
import type { Comment } from '@/typescript/interface/Comment'

const props = defineProps<{
  postId: string
}>()

const authStore = useAuthStore()

const comments = ref<Comment[]>([])
const isLoading = ref(false)
const newCommentText = ref('')
const isSubmitting = ref(false)

const canComment = computed(() => newCommentText.value.trim().length > 0)

async function loadComments() {
  if (isLoading.value) return
  isLoading.value = true
  try {
    const response = await commentsApi.getByPost(props.postId, 1, 20)
    comments.value = response.data.data
  } catch (error) {
    logger.error('Failed to load comments:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleSubmitComment() {
  if (!canComment.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    const response = await commentsApi.create({
      postId: props.postId,
      content: newCommentText.value.trim(),
    })
    comments.value.unshift(response.data.data)
    newCommentText.value = ''
  } catch (error) {
    logger.error('Failed to create comment:', error)
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteComment(commentId: string) {
  if (!confirm('Delete this comment?')) return

  try {
    await commentsApi.delete(commentId)
    comments.value = comments.value.filter((c) => c.id !== commentId)
  } catch (error) {
    logger.error('Failed to delete comment:', error)
  }
}

function handleUpdateComment(updatedComment: Comment) {
  const index = comments.value.findIndex((c) => c.id === updatedComment.id)
  if (index !== -1) {
    comments.value[index] = updatedComment
  }
}

onMounted(() => {
  loadComments()
})
</script>

<template>
  <div class="comment-section">
    <div class="mb-6 flex items-center gap-2">
      <h3 class="font-montserrat text-lg font-extrabold tracking-tight text-text">Comments</h3>
      <span
        class="rounded-full bg-orange-soft px-2 py-0.5 text-xs font-bold tabular-nums text-orange"
        >{{ comments.length }}</span
      >
    </div>

    <!-- Composer -->
    <div v-if="authStore.isAuthenticated" class="mb-8 flex gap-3">
      <UserAvatar v-if="authStore.user" :user="authStore.user" size="md" class="mt-0.5 shrink-0" />
      <div class="flex-1">
        <div
          class="rounded-2xl border-1.5 border-border bg-background-secondary p-1 transition-colors duration-200 focus-within:border-orange"
        >
          <MentionInput
            v-model="newCommentText"
            placeholder="Add a comment… use @ to mention"
            :rows="3"
            textareaClass="w-full p-3 bg-transparent text-sm text-text font-inherit resize-y border-0 focus:outline-none focus:ring-0 min-h-[72px]"
          />
          <div class="flex items-center justify-between gap-3 px-2 pb-1">
            <p class="text-[10px] italic text-text-dim">Type @ to mention · ⌘↵ to post</p>
            <button
              @click="handleSubmitComment"
              :disabled="!canComment || isSubmitting"
              class="inline-flex items-center gap-1.5 rounded-full bg-orange px-5 py-2 font-montserrat text-xs font-bold uppercase tracking-widest text-white shadow-[0_4px_16px_rgba(255,107,53,0.3)] transition-[transform,background-color,opacity] duration-200 ease-revamp hover:bg-orange-light active:scale-[0.96] disabled:scale-100 disabled:opacity-50 disabled:shadow-none"
            >
              <span
                v-if="isSubmitting"
                class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              ></span>
              {{ isSubmitting ? 'Posting' : 'Post' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="mb-8 flex flex-col items-center gap-2 rounded-2xl border border-orange/15 bg-orange-soft/40 p-6 text-center"
    >
      <p class="text-sm text-text-muted">Sign in to join the conversation.</p>
      <button
        @click="$router.push('/login')"
        class="text-xs font-bold uppercase tracking-widest text-orange transition-colors hover:text-orange-light"
      >
        Sign In
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-6">
      <div v-for="i in 3" :key="i" class="flex animate-pulse gap-3">
        <div class="h-8 w-8 shrink-0 rounded-full bg-background-secondary"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 w-24 rounded bg-background-secondary"></div>
          <div class="h-14 w-full rounded-2xl bg-background-secondary"></div>
        </div>
      </div>
    </div>

    <!-- List -->
    <div v-else-if="comments.length > 0" class="space-y-6">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :post-id="postId"
        @delete="handleDeleteComment"
        @update="handleUpdateComment"
      />
    </div>

    <!-- Empty -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-center">
      <div class="mb-3 grid h-12 w-12 place-items-center rounded-full bg-orange-soft text-orange">
        <BaseIcons name="chat-bubble-left-right" size="md" />
      </div>
      <p class="text-sm text-text-dim">No comments yet. Be the first to start the conversation.</p>
    </div>
  </div>
</template>

<style scoped>
.comment-section :deep(.comment-item) {
  animation: slideDown 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .comment-section :deep(.comment-item) {
    animation: none;
  }
}
</style>
