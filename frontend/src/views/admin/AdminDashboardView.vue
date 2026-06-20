<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi } from '@/http/endpoints/admin'
import { API_URL } from '@/utils/constants'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref<any>(null)
const error = ref('')
const isLoading = ref(true)
const serverHealthy = ref<boolean | null>(null)

onMounted(async () => {
  if (authStore.user?.role !== 'ADMIN') {
    router.push('/')
    return
  }
  await Promise.all([loadStats(), pingHealth()])
})

async function loadStats() {
  isLoading.value = true
  try {
    const response = await adminApi.getStats()
    stats.value = response.data.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load statistics'
  } finally {
    isLoading.value = false
  }
}

async function pingHealth() {
  try {
    const r = await fetch(`${API_URL}/health`, { method: 'GET' })
    serverHealthy.value = r.ok
  } catch {
    serverHealthy.value = false
  }
}

const growthRate = computed(() => {
  if (!stats.value) return 0
  const total = stats.value.users.total ?? 0
  const newToday = stats.value.users.newToday ?? 0
  const base = Math.max(total - newToday, 1)
  return Math.round((newToday / base) * 1000) / 10
})

const quickActions = [
  { path: '/admin/users', icon: 'users', title: 'Manage Users', desc: 'Control user accounts and roles' },
  { path: '/admin/reports', icon: 'clipboard-document-list', title: 'Review Reports', desc: 'Handle content moderation' },
  { path: '/admin/analytics', icon: 'chart-bar', title: 'View Analytics', desc: 'Detailed platform metrics' },
  { path: '/ingredients', icon: 'circle-stack', title: 'Food Database', desc: 'Manage ingredient nutritional data' },
]

const summaryCards = computed(() => {
  if (!stats.value) return []
  return [
    { icon: 'users', val: stats.value.users.total, label: 'Total Citizens', tone: 'orange' },
    { icon: 'document-text', val: stats.value.content.posts, label: 'Recipes Shared', tone: 'orange' },
    { icon: 'fire', val: `+${stats.value.users.newToday}`, label: 'New Today', tone: 'green' },
    { icon: 'exclamation-triangle', val: stats.value.moderation.pendingReports, label: 'Pending Reports', tone: 'amber' },
  ]
})

const toneStyle = (tone: string) =>
  ({
    orange: 'bg-orange-soft text-orange',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }[tone] ?? 'bg-orange-soft text-orange')
</script>

<template>
  <div class="admin-dashboard-view min-h-screen bg-background py-16 px-6 md:px-12">
    <div class="max-w-7xl mx-auto">
      <header class="mb-12">
         <p class="text-orange text-[11px] font-bold uppercase tracking-[0.3em] mb-2 font-montserrat">Nutrisipe Platform Management</p>
         <h1 class="font-montserrat font-extrabold text-4xl md:text-5xl tracking-tight text-balance">Admin Command Center</h1>
      </header>

      <div v-if="isLoading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="stats">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div
            v-for="card in summaryCards"
            :key="card.label"
            class="bg-surface border border-border rounded-card p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200"
          >
             <div :class="['w-11 h-11 rounded-2xl flex items-center justify-center mb-4', toneStyle(card.tone)]">
               <BaseIcons :name="card.icon" size="md" />
             </div>
             <div class="font-montserrat font-extrabold text-3xl mb-1 tabular-nums">{{ card.val }}</div>
             <div class="text-[10px] font-bold uppercase tracking-widest text-text-dim">{{ card.label }}</div>
          </div>
        </div>

        <h2 class="font-montserrat font-extrabold text-xl mb-6 tracking-tight">Quick Controls</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
           <RouterLink
             v-for="action in quickActions"
             :key="action.path"
             :to="action.path"
             class="group bg-surface border border-border rounded-card p-7 shadow-card hover:border-orange hover:-translate-y-1 transition-[transform,border-color,box-shadow] duration-200 hover:shadow-card-hover active:scale-[0.98]"
           >
              <div class="mb-4 w-11 h-11 rounded-2xl bg-background-secondary text-text-dim group-hover:bg-orange-soft group-hover:text-orange flex items-center justify-center transition-colors duration-200">
                <BaseIcons :name="action.icon" size="md" />
              </div>
              <h3 class="font-montserrat font-bold text-lg mb-2">{{ action.title }}</h3>
              <p class="text-xs text-text-muted leading-relaxed text-pretty">{{ action.desc }}</p>
           </RouterLink>
        </div>

        <!-- Activity Overview -->
        <div class="bg-surface border border-border rounded-card p-8 md:p-12 shadow-card">
           <div class="flex items-center justify-between mb-10">
              <h2 class="font-montserrat font-extrabold text-2xl tracking-tight">Platform Health</h2>
              <button @click="loadStats" class="text-orange font-bold text-xs uppercase tracking-widest hover:underline active:scale-[0.96] transition-transform">Refresh Data</button>
           </div>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
              <div>
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Engagement</p>
                 <div class="flex items-end gap-3">
                    <span class="font-montserrat font-extrabold text-4xl tabular-nums">{{ stats.content.comments }}</span>
                    <span class="text-text-muted text-sm font-bold pb-1.5">Comments</span>
                 </div>
              </div>
              <div>
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Growth Rate</p>
                 <div class="flex items-end gap-3">
                    <span :class="['font-montserrat font-extrabold text-4xl tabular-nums', growthRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-text-dim']">{{ growthRate > 0 ? `+${growthRate}%` : '—' }}</span>
                    <span class="text-text-muted text-sm font-bold pb-1.5">Today</span>
                 </div>
              </div>
              <div>
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Server Status</p>
                 <div class="flex items-center gap-3 mt-1">
                    <div v-if="serverHealthy === null" class="w-3 h-3 rounded-full bg-text-dim animate-pulse"></div>
                    <div v-else-if="serverHealthy" class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <div v-else class="w-3 h-3 rounded-full bg-red-500"></div>
                    <span class="font-bold text-lg">{{ serverHealthy === null ? 'Checking…' : serverHealthy ? 'Operational' : 'Unreachable' }}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div v-if="error" class="bg-red-500/10 border border-red-500/50 rounded-card p-6 text-red-500 font-bold">
        {{ error }}
      </div>
    </div>
  </div>
</template>
