<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Platform Analytics</h1>
      <RouterLink
        to="/admin"
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        ← Back to Dashboard
      </RouterLink>
    </div>

    <!-- Time Period Selector -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div class="flex gap-4">
        <button
          v-for="period in periods"
          :key="period"
          @click="selectedPeriod = period"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            selectedPeriod === period
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          {{ period }}
        </button>
      </div>
    </div>

    <!-- User Growth -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">User Growth</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
          <p class="text-3xl font-bold">{{ stats?.users.total || 0 }}</p>
          <p class="text-sm text-green-600 mt-1">+{{ stats?.users.newToday || 0 }} today</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</p>
          <p class="text-3xl font-bold">{{ stats?.users.active || 0 }}</p>
          <p class="text-sm text-gray-500 mt-1">
            {{ ((stats?.users.active || 0) / (stats?.users.total || 1) * 100).toFixed(1) }}% of total
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Banned Users</p>
          <p class="text-3xl font-bold text-red-600">{{ stats?.users.banned || 0 }}</p>
          <p class="text-sm text-gray-500 mt-1">
            {{ ((stats?.users.banned || 0) / (stats?.users.total || 1) * 100).toFixed(1) }}% of total
          </p>
        </div>
      </div>
    </div>

    <!-- Content Statistics -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Content Statistics</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Posts</p>
          <p class="text-3xl font-bold">{{ stats?.content.posts || 0 }}</p>
          <p class="text-sm text-blue-600 mt-1">+{{ stats?.content.newPostsToday || 0 }} today</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Comments</p>
          <p class="text-3xl font-bold">{{ stats?.content.comments || 0 }}</p>
          <p class="text-sm text-gray-500 mt-1">
            {{ ((stats?.content.comments || 0) / (stats?.content.posts || 1)).toFixed(1) }} avg per post
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Posts per User</p>
          <p class="text-3xl font-bold">
            {{ ((stats?.content.posts || 0) / (stats?.users.total || 1)).toFixed(1) }}
          </p>
          <p class="text-sm text-gray-500 mt-1">Average content creation</p>
        </div>
      </div>
    </div>

    <!-- Engagement Metrics -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Engagement Overview</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="text-2xl mb-2">❤️</div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Likes</p>
          <p class="text-2xl font-bold">-</p>
          <p class="text-xs text-gray-500 mt-1">Coming soon</p>
        </div>
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="text-2xl mb-2">💬</div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Comments</p>
          <p class="text-2xl font-bold">{{ stats?.content.comments || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Total interactions</p>
        </div>
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="text-2xl mb-2">🔖</div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Saves</p>
          <p class="text-2xl font-bold">-</p>
          <p class="text-xs text-gray-500 mt-1">Coming soon</p>
        </div>
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="text-2xl mb-2">👥</div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Follows</p>
          <p class="text-2xl font-bold">-</p>
          <p class="text-xs text-gray-500 mt-1">Coming soon</p>
        </div>
      </div>
    </div>

    <!-- Moderation Activity -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Moderation Activity</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Reports</p>
          <p class="text-3xl font-bold text-orange-600">{{ stats?.moderation.pendingReports || 0 }}</p>
          <p class="text-sm text-gray-500 mt-1">Requires attention</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Reports</p>
          <p class="text-3xl font-bold">-</p>
          <p class="text-sm text-gray-500 mt-1">Coming soon</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Resolution Rate</p>
          <p class="text-3xl font-bold">-</p>
          <p class="text-sm text-gray-500 mt-1">Coming soon</p>
        </div>
      </div>
    </div>

    <!-- Note about future enhancements -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
      <p class="text-sm text-blue-900 dark:text-blue-300">
        <strong>📊 Coming Soon:</strong> Advanced analytics including charts, trend analysis, user activity heatmaps, and detailed engagement metrics.
      </p>
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
import { adminApi } from '@/http/endpoints/admin'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref<any>(null)
const error = ref('')
const selectedPeriod = ref('Today')
const periods = ['Today', '7 Days', '30 Days', 'All Time']

onMounted(async () => {
  if (authStore.user?.role !== 'ADMIN') {
    router.push('/')
    return
  }

  await loadStats()
})

async function loadStats() {
  try {
    const response = await adminApi.getStats()
    stats.value = response.data.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load statistics'
  }
}
</script>
