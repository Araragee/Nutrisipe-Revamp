<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Content Moderation</h1>
      <RouterLink
        to="/admin"
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        ← Back to Dashboard
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          v-model="filters.status"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          @change="() => loadReports(1)"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>

        <select
          v-model="filters.type"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          @change="() => loadReports(1)"
        >
          <option value="">All Types</option>
          <option value="POST">Post</option>
          <option value="COMMENT">Comment</option>
          <option value="USER">User</option>
        </select>

        <button
          @click="resetFilters"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Reset Filters
        </button>
      </div>
    </div>

    <!-- Reports List -->
    <div class="space-y-4">
      <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
      </div>

      <div v-else-if="reports.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-500">
        No reports found
      </div>

      <div
        v-for="report in reports"
        :key="report.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span
                :class="[
                  'px-2 py-1 text-xs font-semibold rounded-full',
                  report.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : report.status === 'REVIEWING'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : report.status === 'RESOLVED'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                ]"
              >
                {{ report.status }}
              </span>
              <span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                {{ report.type }}
              </span>
              <span class="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                {{ report.reason }}
              </span>
            </div>

            <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Reported by @{{ report.reporter.username }}</span>
              <span>•</span>
              <span>{{ formatDate(report.createdAt) }}</span>
            </div>

            <p v-if="report.description" class="text-gray-700 dark:text-gray-300 mb-4">
              {{ report.description }}
            </p>

            <!-- Reported Content -->
            <div v-if="report.post" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <div class="flex items-start gap-3">
                <img
                  :src="report.post.imageUrl"
                  :alt="report.post.title"
                  class="w-20 h-20 object-cover rounded"
                />
                <div>
                  <h4 class="font-semibold mb-1">{{ report.post.title }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    by @{{ report.post.user.username }}
                  </p>
                  <RouterLink
                    :to="`/posts/${report.post.id}`"
                    class="text-sm text-orange-600 hover:text-orange-700"
                  >
                    View Post →
                  </RouterLink>
                </div>
              </div>
            </div>

            <div v-if="report.comment" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">{{ report.comment.content }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                by @{{ report.comment.user.username }}
              </p>
            </div>

            <!-- Moderator Note -->
            <div v-if="report.moderatorNote" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p class="text-sm text-blue-900 dark:text-blue-300">
                <strong>Moderator Note:</strong> {{ report.moderatorNote }}
              </p>
              <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                by @{{ report.moderator?.username }}
              </p>
            </div>

            <!-- Actions -->
            <div v-if="report.status === 'PENDING' || report.status === 'REVIEWING'" class="flex gap-2">
              <button
                @click="updateStatus(report.id, 'REVIEWING')"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Review
              </button>
              <button
                @click="openResolveModal(report)"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Resolve
              </button>
              <button
                @click="openDismissModal(report)"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Dismiss
              </button>
              <button
                v-if="report.post"
                @click="deleteContent('post', report.post.id, report.id)"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Post
              </button>
              <button
                v-if="report.comment"
                @click="deleteContent('comment', report.comment.id, report.id)"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination" class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
        {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }} reports
      </div>
      <div class="flex gap-2">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page >= pagination.pages"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Resolution Modal -->
    <div
      v-if="showResolutionModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showResolutionModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" @click.stop>
        <h2 class="text-xl font-bold mb-4">{{ resolutionAction === 'RESOLVED' ? 'Resolve' : 'Dismiss' }} Report</h2>
        <textarea
          v-model="moderatorNote"
          placeholder="Add a note..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 mb-4"
          rows="3"
        ></textarea>
        <div class="flex gap-3">
          <button
            @click="confirmResolution"
            class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Confirm
          </button>
          <button
            @click="showResolutionModal = false"
            class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { adminApi } from '@/http/endpoints/admin'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const reports = ref<any[]>([])
const pagination = ref<any>(null)
const loading = ref(false)
const error = ref('')

const filters = ref({
  status: '',
  type: '',
})

const showResolutionModal = ref(false)
const selectedReport = ref<any>(null)
const moderatorNote = ref('')
const resolutionAction = ref<'RESOLVED' | 'DISMISSED'>('RESOLVED')

onMounted(async () => {
  if (authStore.user?.role !== 'ADMIN') {
    router.push('/')
    return
  }

  await loadReports()
})

async function loadReports(page = 1) {
  loading.value = true
  error.value = ''

  try {
    const response = await adminApi.getReports({
      page,
      limit: 20,
      status: filters.value.status || undefined,
      type: filters.value.type || undefined,
    })
    reports.value = response.data.data
    pagination.value = response.data.pagination
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load reports'
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.value = {
    status: '',
    type: '',
  }
  loadReports()
}

function changePage(page: number) {
  loadReports(page)
}

async function updateStatus(reportId: string, status: string) {
  try {
    await adminApi.updateReportStatus(reportId, status)
    uiStore.showToast('Report status updated', 'success')
    loadReports(pagination.value.page)
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.error || 'Failed to update report', 'error')
  }
}

function openResolveModal(report: any) {
  selectedReport.value = report
  moderatorNote.value = ''
  resolutionAction.value = 'RESOLVED'
  showResolutionModal.value = true
}

function openDismissModal(report: any) {
  selectedReport.value = report
  moderatorNote.value = ''
  resolutionAction.value = 'DISMISSED'
  showResolutionModal.value = true
}

async function confirmResolution() {
  try {
    await adminApi.updateReportStatus(
      selectedReport.value.id,
      resolutionAction.value,
      moderatorNote.value || undefined
    )
    uiStore.showToast(`Report ${resolutionAction.value.toLowerCase()}`, 'success')
    showResolutionModal.value = false
    loadReports(pagination.value.page)
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.error || 'Failed to update report', 'error')
  }
}

async function deleteContent(type: 'post' | 'comment', contentId: string, reportId: string) {
  if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return

  try {
    if (type === 'post') {
      await adminApi.deletePost(contentId)
    } else {
      await adminApi.deleteComment(contentId)
    }

    await adminApi.updateReportStatus(reportId, 'RESOLVED', `${type} deleted`)
    uiStore.showToast(`${type} deleted successfully`, 'success')
    loadReports(pagination.value.page)
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.error || `Failed to delete ${type}`, 'error')
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
