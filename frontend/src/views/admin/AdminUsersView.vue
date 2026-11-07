<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { adminApi } from '@/http/endpoints/admin'
import UserAvatar from '@/components/user/UserAvatar.vue'
import { useConfirm } from '@/composables/useConfirm'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const { confirm } = useConfirm()

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
  if (!(await confirm({ title: 'Unban this user?', message: 'They’ll be able to sign in and post again.', confirmLabel: 'Unban' }))) return
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
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <RouterLink to="/admin" class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-orange hover:underline mb-2.5">← Dashboard</RouterLink>
           <h1 class="font-montserrat font-extrabold text-4xl md:text-5xl tracking-tight text-balance">Citizen Management</h1>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search by name, email..."
          class="bg-surface border-1.5 border-border rounded-btn px-5 py-3.5 focus:border-orange outline-none transition-colors duration-200 font-medium"
          @input="debouncedSearch"
        />
        <select v-model="filters.role" @change="loadUsers(1)" class="bg-surface border-1.5 border-border rounded-btn px-5 py-3.5 focus:border-orange outline-none appearance-none font-bold transition-colors duration-200">
           <option value="">All Roles</option>
           <option value="USER">User</option>
           <option value="MODERATOR">Moderator</option>
           <option value="ADMIN">Admin</option>
        </select>
        <select v-model="filters.status" @change="loadUsers(1)" class="bg-surface border-1.5 border-border rounded-btn px-5 py-3.5 focus:border-orange outline-none appearance-none font-bold transition-colors duration-200">
           <option value="">All Status</option>
           <option value="active">Active</option>
           <option value="banned">Banned</option>
        </select>
        <button @click="resetFilters" class="btn-secondary active:scale-[0.96] transition-transform">Reset Filters</button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else class="bg-surface rounded-card border border-border overflow-hidden shadow-card">
        <table class="w-full border-collapse">
           <thead>
              <tr class="bg-background-secondary text-text-dim text-[10px] font-bold uppercase tracking-[0.2em]">
                 <th class="px-8 py-5 text-left">Citizen</th>
                 <th class="px-6 py-5 text-left">Role</th>
                 <th class="px-6 py-5 text-left">Status</th>
                 <th class="px-6 py-5 text-left">Engagement</th>
                 <th class="px-8 py-5 text-right">Actions</th>
              </tr>
           </thead>
           <tbody class="divide-y divide-border">
              <tr v-for="user in users" :key="user.id" class="hover:bg-orange-soft/40 transition-colors duration-150 group">
                 <td class="px-8 py-5">
                    <div class="flex items-center gap-4">
                       <UserAvatar :user="user" size="md" />
                       <div>
                          <div class="font-bold">{{ user.displayName }}</div>
                          <div class="text-xs text-text-dim">@{{ user.username }}</div>
                       </div>
                    </div>
                 </td>
                 <td class="px-6 py-5">
                    <select :value="user.role" @change="updateUserRole(user.id, ($event.target as any).value)" class="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer rounded-lg hover:text-orange transition-colors">
                       <option value="USER">User</option>
                       <option value="MODERATOR">Moderator</option>
                       <option value="ADMIN">Admin</option>
                    </select>
                 </td>
                 <td class="px-6 py-5">
                    <span :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest', user.isBanned ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-600 dark:text-green-400']">
                       <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                       {{ user.isBanned ? 'Banned' : 'Active' }}
                    </span>
                 </td>
                 <td class="px-6 py-5">
                    <div class="text-xs font-bold text-text-muted tabular-nums">{{ user._count?.posts || 0 }} Recipes • {{ user.followerCount || 0 }} Followers</div>
                 </td>
                 <td class="px-8 py-5 text-right">
                    <div class="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                       <button v-if="!user.isBanned" @click="openBanModal(user)" class="text-xs font-bold text-red-500 hover:underline">Ban</button>
                       <button v-else @click="unbanUser(user.id)" class="text-xs font-bold text-green-600 dark:text-green-400 hover:underline">Unban</button>
                       <button @click="router.push(`/profile/${user.id}`)" class="text-xs font-bold text-orange hover:underline">View</button>
                    </div>
                 </td>
              </tr>
           </tbody>
        </table>
      </div>

      <div v-if="pagination && pagination.pages > 1" class="flex justify-center gap-4 mt-10">
         <button :disabled="pagination.page === 1" @click="loadUsers(pagination.page - 1)" class="btn-secondary px-6 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.96] transition-transform">Prev</button>
         <span class="flex items-center font-bold text-sm tabular-nums">Page {{ pagination.page }} of {{ pagination.pages }}</span>
         <button :disabled="pagination.page === pagination.pages" @click="loadUsers(pagination.page + 1)" class="btn-secondary px-6 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.96] transition-transform">Next</button>
      </div>
    </div>

    <BaseModal :show="showBanModal" :title="`Ban @${selectedUser?.username ?? ''}`" @close="showBanModal = false">
      <p class="mb-5 text-sm leading-relaxed text-text-muted">Banning blocks this user from signing in. Add a clear reason for the record.</p>
      <label for="ban-reason" class="mb-2 block text-sm font-semibold text-text">Reason</label>
      <textarea id="ban-reason" v-model="banReason" rows="3" class="w-full resize-none rounded-2xl border-1.5 border-border bg-background-secondary p-4 text-text outline-none transition-colors duration-200 focus:border-red-500" placeholder="Violating community guidelines…"></textarea>
      <template #footer>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <BaseButton variant="secondary" @click="showBanModal = false">Cancel</BaseButton>
          <BaseButton variant="danger" :disabled="!banReason.trim()" @click="confirmBan">Ban user</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
