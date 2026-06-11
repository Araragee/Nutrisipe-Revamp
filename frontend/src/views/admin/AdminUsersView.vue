<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { adminApi } from '@/http/endpoints/admin'
import UserAvatar from '@/components/user/UserAvatar.vue'

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

let searchTimeout: any

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
    pagination.value = (response.data as any).pagination
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
  filters.value = { search: '', role: '', status: '' }
  loadUsers()
}

async function updateUserRole(userId: string, newRole: string) {
  try {
    await adminApi.updateUserRole(userId, newRole)
    uiStore.showToast('Role updated', 'success')
    loadUsers(pagination.value?.page || 1)
  } catch (err: any) {
    uiStore.showToast('Update failed', 'error')
  }
}

function openBanModal(user: any) {
  selectedUser.value = user
  banReason.value = ''
  showBanModal.value = true
}

async function confirmBan() {
  if (!banReason.value.trim()) return
  try {
    await adminApi.banUser(selectedUser.value.id, banReason.value)
    uiStore.showToast('User banned', 'success')
    showBanModal.value = false
    loadUsers(pagination.value?.page || 1)
  } catch (err: any) {
    uiStore.showToast('Ban failed', 'error')
  }
}

async function unbanUser(userId: string) {
  if (!confirm('Unban this user?')) return
  try {
    await adminApi.unbanUser(userId)
    uiStore.showToast('User unbanned', 'success')
    loadUsers(pagination.value?.page || 1)
  } catch (err: any) {
    uiStore.showToast('Unban failed', 'error')
  }
}
</script>

<template>
  <div class="admin-users-view min-h-screen bg-background py-16 px-6 md:px-12">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <RouterLink to="/admin" class="text-xs font-bold uppercase tracking-widest text-orange hover:underline mb-2 block">← Dashboard</RouterLink>
           <h1 class="font-montserrat font-extrabold text-4xl tracking-tight">Citizen Management</h1>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search by name, email..."
          class="bg-background-secondary border border-border rounded-2xl px-6 py-4 focus:border-orange outline-none transition-all font-medium"
          @input="debouncedSearch"
        />
        <select v-model="filters.role" @change="loadUsers(1)" class="bg-background-secondary border border-border rounded-2xl px-6 py-4 focus:border-orange outline-none appearance-none font-bold">
           <option value="">All Roles</option>
           <option value="USER">User</option>
           <option value="MODERATOR">Moderator</option>
           <option value="ADMIN">Admin</option>
        </select>
        <select v-model="filters.status" @change="loadUsers(1)" class="bg-background-secondary border border-border rounded-2xl px-6 py-4 focus:border-orange outline-none appearance-none font-bold">
           <option value="">All Status</option>
           <option value="active">Active</option>
           <option value="banned">Banned</option>
        </select>
        <button @click="resetFilters" class="btn-secondary">Reset Filters</button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else class="bg-background-secondary rounded-[40px] border border-border overflow-hidden shadow-xl">
        <table class="w-full border-collapse">
           <thead>
              <tr class="bg-black/20 text-text-dim text-[10px] font-bold uppercase tracking-[0.2em]">
                 <th class="px-8 py-6 text-left">Citizen</th>
                 <th class="px-6 py-6 text-left">Role</th>
                 <th class="px-6 py-6 text-left">Status</th>
                 <th class="px-6 py-6 text-left">Engagement</th>
                 <th class="px-8 py-6 text-right">Actions</th>
              </tr>
           </thead>
           <tbody class="divide-y divide-border">
              <tr v-for="user in users" :key="user.id" class="hover:bg-white/5 transition-colors group">
                 <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                       <UserAvatar :user="user" size="md" />
                       <div>
                          <div class="font-bold">{{ user.displayName }}</div>
                          <div class="text-xs text-text-dim">@{{ user.username }}</div>
                       </div>
                    </div>
                 </td>
                 <td class="px-6 py-6">
                    <select :value="user.role" @change="updateUserRole(user.id, ($event.target as any).value)" class="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer">
                       <option value="USER">User</option>
                       <option value="MODERATOR">Moderator</option>
                       <option value="ADMIN">Admin</option>
                    </select>
                 </td>
                 <td class="px-6 py-6">
                    <span :class="['px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest', user.isBanned ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500']">
                       {{ user.isBanned ? 'Banned' : 'Active' }}
                    </span>
                 </td>
                 <td class="px-6 py-6">
                    <div class="text-xs font-bold text-text-muted">{{ user._count?.posts || 0 }} Recipes • {{ user.followerCount || 0 }} Followers</div>
                 </td>
                 <td class="px-8 py-6 text-right">
                    <div class="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button v-if="!user.isBanned" @click="openBanModal(user)" class="text-xs font-bold text-red-500 hover:underline">Ban</button>
                       <button v-else @click="unbanUser(user.id)" class="text-xs font-bold text-green-500 hover:underline">Unban</button>
                       <button @click="router.push(`/profile/${user.id}`)" class="text-xs font-bold text-orange hover:underline">View</button>
                    </div>
                 </td>
              </tr>
           </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.pages > 1" class="flex justify-center gap-4 mt-12">
         <button :disabled="pagination.page === 1" @click="loadUsers(pagination.page - 1)" class="btn-secondary px-6">Prev</button>
         <span class="flex items-center font-bold text-sm">Page {{ pagination.page }} of {{ pagination.pages }}</span>
         <button :disabled="pagination.page === pagination.pages" @click="loadUsers(pagination.page + 1)" class="btn-secondary px-6">Next</button>
      </div>
    </div>

    <!-- Ban Modal -->
    <div v-if="showBanModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
       <div class="absolute inset-0 bg-background/80" @click="showBanModal = false"></div>
       <div class="relative w-full max-w-md bg-background-secondary border border-border rounded-[40px] p-10 shadow-2xl">
          <h2 class="font-montserrat font-extrabold text-2xl mb-4">Ban @{{ selectedUser.username }}</h2>
          <p class="text-text-muted text-sm mb-8 leading-relaxed">Suspending this citizen will restrict their access to the platform. Please provide a clear reason.</p>

          <textarea v-model="banReason" class="w-full bg-background border border-border rounded-2xl p-5 mb-8 outline-none focus:border-red-500" placeholder="Violating community guidelines..."></textarea>

          <div class="flex gap-4">
             <button @click="confirmBan" class="flex-1 py-4 rounded-btn bg-red-500 text-white font-bold hover:bg-red-600 transition-all">Confirm Ban</button>
             <button @click="showBanModal = false" class="flex-1 btn-secondary">Cancel</button>
          </div>
       </div>
    </div>
  </div>
</template>
