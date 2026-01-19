<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
    @click="close"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
      @click.stop
    >
      <h2 class="text-2xl font-bold mb-4">Report {{ reportType }}</h2>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Reason</label>
        <select
          v-model="reason"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
        >
          <option value="">Select a reason...</option>
          <option value="SPAM">Spam</option>
          <option value="HARASSMENT">Harassment</option>
          <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
          <option value="MISINFORMATION">Misinformation</option>
          <option value="COPYRIGHT">Copyright Violation</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">
          Additional Details (Optional)
        </label>
        <textarea
          v-model="description"
          placeholder="Provide more context about why you're reporting this..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          rows="4"
          maxlength="500"
        ></textarea>
        <p class="text-xs text-gray-500 mt-1">{{ description.length }}/500</p>
      </div>

      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <div class="flex gap-3">
        <button
          @click="submit"
          :disabled="!reason || submitting"
          class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? 'Submitting...' : 'Submit Report' }}
        </button>
        <button
          @click="close"
          :disabled="submitting"
          class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Our moderation team will review your report. False reports may result in action against your account.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUIStore } from '@/stores/ui'
import { reportsApi } from '@/http/endpoints/reports'

const props = defineProps<{
  isOpen: boolean
  reportType: 'Post' | 'Comment' | 'User'
  postId?: string
  commentId?: string
  userId?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const uiStore = useUIStore()

const reason = ref('')
const description = ref('')
const submitting = ref(false)
const error = ref('')

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    reason.value = ''
    description.value = ''
    error.value = ''
  }
})

function close() {
  emit('close')
}

async function submit() {
  if (!reason.value) {
    error.value = 'Please select a reason'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    await reportsApi.createReport({
      type: props.reportType.toUpperCase() as 'POST' | 'COMMENT' | 'USER',
      reason: reason.value as any,
      description: description.value || undefined,
      postId: props.postId,
      commentId: props.commentId,
      reportedUserId: props.userId,
    })

    uiStore.showToast('Report submitted successfully', 'success')
    close()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to submit report'
  } finally {
    submitting.value = false
  }
}
</script>
