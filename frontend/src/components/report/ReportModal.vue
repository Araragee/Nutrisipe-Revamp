<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { reportsApi } from '@/http/endpoints/reports'
import BaseModal from '@/components/base/BaseModal.vue'

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

const uiStore = useUiStore()

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

function handleClose() {
  emit('close')
}

async function handleSubmit() {
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
    handleClose()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to submit report'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal :show="isOpen" :title="`Report ${reportType}`" size="md" @close="handleClose">
    <div class="space-y-6">
      <div>
        <label for="reason" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Reason
        </label>
        <select
          id="reason"
          v-model="reason"
          class="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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

      <div>
        <label for="description" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Additional Details (Optional)
        </label>
        <textarea
          id="description"
          v-model="description"
          maxlength="500"
          rows="4"
          placeholder="Provide more context about why you're reporting this..."
          class="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ description.length }}/500</p>
      </div>

      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-400">
        Our moderation team will review your report. False reports may result in action against your account.
      </p>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <button
          @click="handleSubmit"
          :disabled="!reason || submitting"
          class="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? 'Submitting...' : 'Submit Report' }}
        </button>
        <button
          @click="handleClose"
          :disabled="submitting"
          class="flex-1 px-4 py-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-lg font-medium transition-all disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </template>
  </BaseModal>
</template>
