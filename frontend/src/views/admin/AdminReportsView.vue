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

const filters = ref({ status: '', type: '' })

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
    pagination.value = (response.data as any).pagination
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load reports'
  } finally {
    loading.value = false
  }
}

async function updateStatus(reportId: string, status: string) {
  try {
    await adminApi.updateReportStatus(reportId, status)
    uiStore.showToast('Status updated', 'success')
    loadReports(pagination.value?.page || 1)
  } catch (err: any) {
    uiStore.showToast('Failed to update', 'error')
  }
}

function openResolveModal(report: any, action: 'RESOLVED' | 'DISMISSED') {
  selectedReport.value = report
  moderatorNote.value = ''
  resolutionAction.value = action
  showResolutionModal.value = true
}

async function confirmResolution() {
  try {
    await adminApi.updateReportStatus(selectedReport.value.id, resolutionAction.value, moderatorNote.value || undefined)
    uiStore.showToast(`Report ${resolutionAction.value.toLowerCase()}`, 'success')
    showResolutionModal.value = false
    loadReports(pagination.value?.page || 1)
  } catch (err: any) {
    uiStore.showToast('Resolution failed', 'error')
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="admin-reports-view min-h-screen bg-background py-16 px-6 md:px-12">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <RouterLink to="/admin" class="text-xs font-bold uppercase tracking-widest text-orange hover:underline mb-2 block">← Dashboard</RouterLink>
           <h1 class="font-montserrat font-extrabold text-4xl tracking-tight">Content Moderation</h1>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <select v-model="filters.status" @change="loadReports(1)" class="bg-background-secondary border border-glass-border rounded-2xl px-6 py-4 focus:border-orange outline-none appearance-none font-bold">
           <option value="">All Status</option>
           <option value="PENDING">Pending</option>
           <option value="REVIEWING">Reviewing</option>
           <option value="RESOLVED">Resolved</option>
        </select>
        <select v-model="filters.type" @change="loadReports(1)" class="bg-background-secondary border border-glass-border rounded-2xl px-6 py-4 focus:border-orange outline-none appearance-none font-bold">
           <option value="">All Types</option>
           <option value="POST">Post</option>
           <option value="COMMENT">Comment</option>
           <option value="USER">User</option>
        </select>
        <button @click="loadReports(1)" class="btn-secondary">Apply Filters</button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else class="space-y-6">
        <div v-for="report in reports" :key="report.id" class="bg-background-secondary border border-glass-border rounded-[32px] p-8 shadow-xl">
           <div class="flex flex-col md:flex-row justify-between gap-6">
              <div class="flex-1">
                 <div class="flex items-center gap-3 mb-4">
                    <span :class="['px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest', report.status === 'PENDING' ? 'bg-orange/10 text-orange' : 'bg-green-500/10 text-green-500']">{{ report.status }}</span>
                    <span class="text-xs font-bold text-text-dim">{{ report.type }} • Reported by @{{ report.reporter.username }} • {{ formatDate(report.createdAt) }}</span>
                 </div>

                 <h3 class="font-extrabold text-xl mb-2">{{ report.reason }}</h3>
                 <p class="text-text-muted leading-relaxed mb-6">{{ report.description }}</p>

                 <div v-if="report.post" class="bg-black/20 rounded-2xl p-4 flex gap-4 mb-6">
                    <img :src="report.post.imageUrl" class="w-20 h-20 object-cover rounded-xl" />
                    <div>
                       <div class="font-bold text-sm mb-1">{{ report.post.title }}</div>
                       <div class="text-xs text-text-dim">Posted by @{{ report.post.user.username }}</div>
                       <button @click="router.push(`/recipes/${report.post.id}`)" class="text-orange font-bold text-xs mt-2 hover:underline">View Post →</button>
                    </div>
                 </div>
              </div>

              <div class="flex flex-col gap-3 min-w-[180px]">
                 <button v-if="report.status === 'PENDING'" @click="updateStatus(report.id, 'REVIEWING')" class="btn-primary py-3 !text-xs">Start Review</button>
                 <button @click="openResolveModal(report, 'RESOLVED')" class="btn-secondary py-3 !text-xs">Resolve</button>
                 <button @click="openResolveModal(report, 'DISMISSED')" class="text-text-dim font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Dismiss</button>
              </div>
           </div>
        </div>

        <div v-if="reports.length === 0" class="py-20 text-center bg-background-secondary rounded-[40px] border-2 border-dashed border-glass-border">
           <p class="text-text-dim font-bold uppercase tracking-widest">Clear Skies! No reports found.</p>
        </div>
      </div>
    </div>

    <!-- Resolution Modal -->
    <div v-if="showResolutionModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
       <div class="absolute inset-0 bg-background/80 backdrop-blur-md" @click="showResolutionModal = false"></div>
       <div class="relative w-full max-w-md bg-background-secondary border border-glass-border rounded-[40px] p-10 shadow-2xl">
          <h2 class="font-montserrat font-extrabold text-2xl mb-4">{{ resolutionAction }} Report</h2>
          <textarea v-model="moderatorNote" class="w-full bg-background border border-glass-border rounded-2xl p-5 mb-8 outline-none focus:border-orange" placeholder="Add moderator notes..."></textarea>
          <div class="flex gap-4">
             <button @click="confirmResolution" class="flex-1 btn-primary py-4">Confirm</button>
             <button @click="showResolutionModal = false" class="flex-1 btn-secondary">Cancel</button>
          </div>
       </div>
    </div>
  </div>
</template>
