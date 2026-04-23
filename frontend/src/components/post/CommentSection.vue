<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { createComment, getCommentsByPost, deleteComment, updateComment } from '@/http/comments'
import UserAvatar from '@/components/user/UserAvatar.vue'
import type { Comment } from '@/typescript/interface/Comment'

const props = defineProps<{
  postId: string
}>()

const authStore = useAuthStore()

const comments = ref<Comment[]>([])
const isLoading = ref(false)
const newCommentText = ref('')
const isSubmitting = ref(false)
const editingCommentId = ref<string | null>(null)
const editingCommentText = ref('')

const canComment = computed(() => newCommentText.value.trim().length > 0)

async function loadComments() {
  isLoading.value = true
  try {
    const response = await getCommentsByPost(props.postId, 1, 50)
    comments.value = response.data
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
    const newComment = await createComment({
      postId: props.postId,
      content: newCommentText.value.trim(),
    })
    comments.value.unshift(newComment)
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
    await deleteComment(commentId)
    comments.value = comments.value.filter((c) => c.id !== commentId)
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}

function startEditComment(comment: Comment) {
  editingCommentId.value = comment.id
  editingCommentText.value = comment.content
}

function cancelEdit() {
  editingCommentId.value = null
  editingCommentText.value = ''
}

async function handleUpdateComment(commentId: string) {
  if (editingCommentText.value.trim().length === 0) return

  try {
    const updatedComment = await updateComment(commentId, editingCommentText.value.trim())
    const index = comments.value.findIndex((c) => c.id === commentId)
    if (index !== -1) {
      comments.value[index] = updatedComment
    }
    cancelEdit()
  } catch (error) {
    console.error('Failed to update comment:', error)
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(() => {
  loadComments()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Comment Input -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex gap-3">
        <UserAvatar v-if="authStore.user" :user="authStore.user" size="sm" />
        <div class="flex-1">
          <textarea
            v-model="newCommentText"
            placeholder="Add a comment..."
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            @keydown.enter.ctrl="handleSubmitComment"
          />
          <div class="flex justify-end mt-2">
            <button
              @click="handleSubmitComment"
              :disabled="!canComment || isSubmitting"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-all',
                canComment && !isSubmitting
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed',
              ]"
            >
              {{ isSubmitting ? 'Posting...' : 'Post' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="isLoading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
      </div>

      <div v-else-if="comments.length === 0" class="text-center py-8">
        <p class="text-gray-500">No comments yet. Be the first to comment!</p>
      </div>

      <div v-else v-for="comment in comments" :key="comment.id" class="flex gap-3">
        <RouterLink :to="`/profile/${comment.user.id}`">
          <UserAvatar :user="comment.user" size="sm" />
        </RouterLink>

        <div class="flex-1">
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="flex items-center justify-between mb-1">
              <RouterLink
                :to="`/profile/${comment.user.id}`"
                class="font-semibold text-sm text-gray-900 hover:text-orange-500 transition-colors"
              >
                {{ comment.user.displayName }}
              </RouterLink>
              <span class="text-xs text-gray-500">{{ formatDate(comment.createdAt) }}</span>
            </div>

            <!-- Editing Mode -->
            <div v-if="editingCommentId === comment.id" class="space-y-2">
              <textarea
                v-model="editingCommentText"
                rows="2"
                class="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
              <div class="flex gap-2">
                <button
                  @click="handleUpdateComment(comment.id)"
                  class="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-all"
                >
                  Save
                </button>
                <button
                  @click="cancelEdit"
                  class="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

            <!-- Display Mode -->
            <p v-else class="text-gray-700 text-sm whitespace-pre-wrap">{{ comment.content }}</p>
          </div>

          <!-- Action Buttons -->
          <div
            v-if="authStore.user?.id === comment.userId && editingCommentId !== comment.id"
            class="flex gap-3 mt-1 ml-3"
          >
            <button
              @click="startEditComment(comment)"
              class="text-xs text-gray-500 hover:text-orange-500 transition-colors"
            >
              Edit
            </button>
            <button
              @click="handleDeleteComment(comment.id)"
              class="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
