<script setup lang="ts">
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
    console.error('Failed to load comments:', error)
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
    console.error('Failed to create comment:', error)
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
    console.error('Failed to delete comment:', error)
  }
}

function handleUpdateComment(updatedComment: Comment) {
  const index = comments.value.findIndex(c => c.id === updatedComment.id)
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
    <div class="section-header flex items-center justify-between mb-8">
      <h3 class="font-montserrat font-extrabold text-xl tracking-tight">
        Comments <span class="ml-2 text-orange text-sm">{{ comments.length }}</span>
      </h3>
    </div>

    <!-- Input Area -->
    <div v-if="authStore.isAuthenticated" class="mb-10 flex gap-4">
      <UserAvatar v-if="authStore.user" :user="authStore.user" size="md" class="shrink-0" />
      <div class="flex-1 relative group">
        <MentionInput
          v-model="newCommentText"
          placeholder="Add a comment… use @ to mention"
          :rows="4"
          class="comment-mention-input"
        />
        <div class="flex items-center justify-between mt-3 px-1">
          <p class="text-[10px] text-text-dim italic">Type @ to mention</p>
          <button
            @click="handleSubmitComment"
            :disabled="!canComment || isSubmitting"
            class="px-8 py-2.5 bg-orange hover:bg-orange-light text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
          >
            {{ isSubmitting ? 'Posting...' : 'Post Comment' }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="mb-10 p-6 bg-orange-soft/30 rounded-2xl border border-orange/10 text-center">
      <p class="text-sm text-text-dim mb-3">Please sign in to join the conversation.</p>
      <button @click="$router.push('/login')" class="text-xs font-bold text-orange hover:underline">Sign In</button>
    </div>

    <!-- Comments List -->
    <div v-if="isLoading" class="space-y-6">
      <div v-for="i in 3" :key="i" class="flex gap-4 animate-pulse">
        <div class="w-10 h-10 rounded-full bg-background-secondary"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-24 bg-background-secondary rounded"></div>
          <div class="h-12 w-full bg-background-secondary rounded-xl"></div>
        </div>
      </div>
    </div>
    
    <div v-else-if="comments.length > 0" class="space-y-8">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :post-id="postId"
        @delete="handleDeleteComment"
        @update="handleUpdateComment"
      />
    </div>

    <div v-else class="py-12 text-center">
      <span class="text-4xl mb-4 block">💬</span>
      <p class="text-text-dim text-sm italic">No comments yet. Be the first to start the discussion!</p>
    </div>
  </div>
</template>

<style scoped>
.comment-section :deep(.comment-item) {
  animation: slideDown 0.3s ease-out forwards;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.comment-mention-input :deep(.mention-textarea) {
  background: var(--background-secondary, rgb(245 245 247 / 0.5));
  border: 1.5px solid var(--glass-border, rgb(255 255 255 / 0.1));
  border-radius: 16px;
  padding: 20px;
  font-size: 14px;
  color: inherit;
  min-height: 100px;
  transition: border-color 0.3s;
}
.comment-mention-input :deep(.mention-textarea:focus) {
  border-color: var(--orange, #ff6b35);
}
.comment-mention-input :deep(.mention-suggestions) {
  background: var(--surface, #fff);
  border-color: var(--glass-border, rgb(255 255 255 / 0.1));
  border-radius: 12px;
  margin-top: 4px;
}
.comment-mention-input :deep(.mention-suggestion-item:hover),
.comment-mention-input :deep(.mention-suggestion-item.selected) {
  background-color: var(--orange-soft, rgb(255 107 53 / 0.1));
}
.comment-mention-input :deep(.suggestion-username) {
  color: var(--orange, #ff6b35);
}
.comment-mention-input :deep(.suggestion-display-name) {
  color: var(--text-dim, #888);
}
</style>
