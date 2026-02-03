<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">User Management</h1>
      <RouterLink
        to="/admin"
        class="text-orange-500 hover:text-orange-600 font-medium"
      >
        ← Back to Dashboard
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search users..."
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          @input="debouncedSearch"
        />

        <select
          v-model="filters.role"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          @change="() => loadUsers(1)"
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          v-model="filters.status"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          @change="() => loadUsers(1)"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          @click="resetFilters"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Reset Filters
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
      </div>

      <div v-else-if="users.length === 0" class="p-8 text-center text-gray-500">
        No users found
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <img
                  :src="user.avatarUrl || '/default-avatar.png'"
                  :alt="user.displayName"
                  class="h-10 w-10 rounded-full mr-3"
                />
                <div>
                  <div class="font-medium">{{ user.displayName }}</div>
                  <div class="text-sm text-gray-500">@{{ user.username }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ user.email }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <select
                :value="user.role"
                @change="updateUserRole(user.id, ($event.target as HTMLSelectElement).value)"
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 text-sm"
              >
                <option value="USER">User</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'px-2 py-1 text-xs font-semibold rounded-full',
                  user.isBanned
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : user.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                ]"
              >
                {{ user.isBanned ? 'Banned' : user.isActive ? 'Active' : 'Inactive' }}
              </span>
              <div v-if="user.isBanned && user.banReason" class="text-xs text-gray-500 mt-1">
                Reason: {{ user.banReason }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <div>Posts: {{ user._count.posts }}</div>
              <div>Comments: {{ user._count.comments }}</div>
              <div class="text-gray-500">{{ user.followerCount }} followers</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button
                v-if="!user.isBanned"
                @click="openBanModal(user)"
                class="text-red-600 hover:text-red-900 mr-3"
              >
                Ban
              </button>
              <button
                v-else
                @click="unbanUser(user.id)"
                class="text-green-600 hover:text-green-900 mr-3"
              >
                Unban
              </button>
              <RouterLink
                :to="`/profile/${user.username}`"
                class="text-orange-600 hover:text-orange-900"
              >
                View
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination" class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
        {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }} users
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

    <!-- Ban Modal -->
    <div
      v-if="showBanModal"
      class="modal-backdrop"
      @click="showBanModal = false"
    >
      <div class="modal-container" @click.stop>
        <h2 class="text-xl font-bold mb-4">Ban User</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to ban @{{ selectedUser?.username }}?
        </p>
        <textarea
          v-model="banReason"
          placeholder="Reason for ban..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 mb-4"
          rows="3"
        ></textarea>
        <div class="flex gap-3">
          <button
            @click="confirmBan"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Ban User
          </button>
          <button
            @click="showBanModal = false"
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
import { useModal } from '@/composables/useModal'
import { adminApi } from '@/http/endpoints/admin'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const users = ref<any[]>([])
const pagination = ref<any>(null)
const loading = ref(false)
const error = ref('')

const filters = ref({
  search: '',
  role: '',
  status: '',
})

const showBanModal = ref(false)
const selectedUser = ref<any>(null)
const banReason = ref('')

// Handle modal body scroll lock
useModal(() => showBanModal.value, () => showBanModal.value = false)

let searchTimeout: NodeJS.Timeout

onMounted(async () => {
  if (authStore.user?.role !== 'ADMIN') {
    router.push('/')
    return
  }

  await loadUsers()
})

async function loadUsers(page = 1) {
  loading.value = true
  error.value = ''

  try {
    const response = await adminApi.getUsers({
      page,
      limit: 20,
      search: filters.value.search || undefined,
      role: filters.value.role || undefined,
      status: filters.value.status || undefined,
    })
    users.value = response.data.data
    pagination.value = response.data.pagination
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadUsers()
  }, 500)
}

function resetFilters() {
  filters.value = {
    search: '',
    role: '',
    status: '',
  }
  loadUsers()
}

function changePage(page: number) {
  loadUsers(page)
}

async function updateUserRole(userId: string, newRole: string) {
  try {
    await adminApi.updateUserRole(userId, newRole)
    uiStore.showToast('User role updated successfully', 'success')
    loadUsers(pagination.value.page)
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.error || 'Failed to update user role', 'error')
  }
}

function openBanModal(user: any) {
  selectedUser.value = user
  banReason.value = ''
  showBanModal.value = true
}

async function confirmBan() {
  if (!banReason.value.trim()) {
    uiStore.showToast('Please provide a reason for the ban', 'error')
    return
  }

  try {
    await adminApi.banUser(selectedUser.value.id, banReason.value)
    uiStore.showToast('User banned successfully', 'success')
    showBanModal.value = false
    loadUsers(pagination.value.page)
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.error || 'Failed to ban user', 'error')
  }
}

async function unbanUser(userId: string) {
  if (!confirm('Are you sure you want to unban this user?')) return

  try {
    await adminApi.unbanUser(userId)
    uiStore.showToast('User unbanned successfully', 'success')
    loadUsers(pagination.value.page)
  } catch (err: any) {
    uiStore.showToast(err.response?.data?.error || 'Failed to unban user', 'error')
  }
}
</script>
