<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Admin Dashboard</h1>

    <!-- Statistics Cards -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Users"
        :value="stats.users.total"
        :subtitle="`${stats.users.newToday} new today`"
        icon="👥"
        color="blue"
      />
      <StatCard
        title="Active Users"
        :value="stats.users.active"
        :subtitle="`${stats.users.banned} banned`"
        icon="✅"
        color="green"
      />
      <StatCard
        title="Total Posts"
        :value="stats.content.posts"
        :subtitle="`${stats.content.newPostsToday} new today`"
        icon="📝"
        color="purple"
      />
      <StatCard
        title="Pending Reports"
        :value="stats.moderation.pendingReports"
        subtitle="Requires attention"
        icon="⚠️"
        color="orange"
      />
    </div>

    <!-- Quick Actions -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RouterLink
          to="/admin/users"
          class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 transition-colors"
        >
          <div class="text-2xl mb-2">👤</div>
          <h3 class="font-semibold mb-1">Manage Users</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">View and manage user accounts</p>
        </RouterLink>

        <RouterLink
          to="/admin/reports"
          class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 transition-colors"
        >
          <div class="text-2xl mb-2">📋</div>
          <h3 class="font-semibold mb-1">Review Reports</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Handle user reports and moderation</p>
        </RouterLink>

        <RouterLink
          to="/admin/analytics"
          class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 transition-colors"
        >
          <div class="text-2xl mb-2">📊</div>
          <h3 class="font-semibold mb-1">View Analytics</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Platform insights and metrics</p>
        </RouterLink>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Platform Activity</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Comments</h3>
          <p class="text-2xl font-bold">{{ stats?.content.comments || 0 }}</p>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">User Growth</h3>
          <p class="text-2xl font-bold text-green-600">+{{ stats?.users.newToday || 0 }}</p>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Content Growth</h3>
          <p class="text-2xl font-bold text-blue-600">+{{ stats?.content.newPostsToday || 0 }}</p>
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
import { adminApi } from '@/http/endpoints/admin'
import StatCard from '@/components/admin/StatCard.vue'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref<any>(null)
const error = ref('')

onMounted(async () => {
  // Check if user is admin
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
