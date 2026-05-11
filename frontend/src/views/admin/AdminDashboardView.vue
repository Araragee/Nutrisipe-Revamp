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
const isLoading = ref(true)

onMounted(async () => {
  if (authStore.user?.role !== 'ADMIN') {
    router.push('/')
    return
  }
  await loadStats()
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

const quickActions = [
  { path: '/admin/users', icon: '👤', title: 'Manage Users', desc: 'Control user accounts and roles' },
  { path: '/admin/reports', icon: '📋', title: 'Review Reports', desc: 'Handle content moderation' },
  { path: '/admin/analytics', icon: '📊', title: 'View Analytics', desc: 'Detailed platform metrics' },
  { path: '/ingredients', icon: '🥘', title: 'Food Database', desc: 'Manage ingredient nutritional data' },
]
</script>

<template>
  <div class="admin-dashboard-view min-h-screen bg-background py-16 px-6 md:px-12">
    <div class="max-w-7xl mx-auto">
      <header class="mb-12">
         <h1 class="font-montserrat font-extrabold text-4xl tracking-tight mb-2">Admin Command Center</h1>
         <p class="text-text-dim font-bold uppercase tracking-widest text-xs">Nutrisipe Platform Management</p>
      </header>

      <div v-if="isLoading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="stats">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-background-secondary border border-glass-border rounded-3xl p-5">
             <div class="text-orange text-2xl mb-4">👥</div>
             <div class="font-montserrat font-extrabold text-3xl mb-1">{{ stats.users.total }}</div>
             <div class="text-[10px] font-bold uppercase tracking-widest text-text-dim">Total Citizens</div>
          </div>
          <div class="bg-background-secondary border border-glass-border rounded-3xl p-5">
             <div class="text-orange text-2xl mb-4">📝</div>
             <div class="font-montserrat font-extrabold text-3xl mb-1">{{ stats.content.posts }}</div>
             <div class="text-[10px] font-bold uppercase tracking-widest text-text-dim">Recipes Shared</div>
          </div>
          <div class="bg-background-secondary border border-glass-border rounded-3xl p-5">
             <div class="text-orange text-2xl mb-4">🔥</div>
             <div class="font-montserrat font-extrabold text-3xl mb-1">+{{ stats.users.newToday }}</div>
             <div class="text-[10px] font-bold uppercase tracking-widest text-text-dim">New Today</div>
          </div>
          <div class="bg-background-secondary border border-glass-border rounded-3xl p-5">
             <div class="text-orange text-2xl mb-4">⚠️</div>
             <div class="font-montserrat font-extrabold text-3xl mb-1">{{ stats.moderation.pendingReports }}</div>
             <div class="text-[10px] font-bold uppercase tracking-widest text-text-dim">Pending Reports</div>
          </div>
        </div>

        <h2 class="font-montserrat font-extrabold text-xl mb-8 tracking-tight uppercase">Quick Controls</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <RouterLink
             v-for="action in quickActions"
             :key="action.path"
             :to="action.path"
             class="group bg-background-secondary/50 border border-glass-border rounded-[32px] p-8 hover:bg-orange-soft/30 hover:border-orange transition-all"
           >
              <div class="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">{{ action.icon }}</div>
              <h3 class="font-bold text-lg mb-2">{{ action.title }}</h3>
              <p class="text-xs text-text-muted leading-relaxed">{{ action.desc }}</p>
           </RouterLink>
        </div>

        <!-- Activity Overview -->
        <div class="bg-background-secondary border border-glass-border rounded-[40px] p-10 md:p-12">
           <div class="flex items-center justify-between mb-10">
              <h2 class="font-montserrat font-extrabold text-2xl tracking-tight">Platform Health</h2>
              <button @click="loadStats" class="text-orange font-bold text-xs uppercase tracking-widest hover:underline">Refresh Data</button>
           </div>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Engagement</p>
                 <div class="flex items-end gap-3">
                    <span class="font-montserrat font-extrabold text-4xl">{{ stats.content.comments }}</span>
                    <span class="text-text-muted text-sm font-bold pb-1.5">Comments</span>
                 </div>
              </div>
              <div>
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Growth Rate</p>
                 <div class="flex items-end gap-3">
                    <span class="font-montserrat font-extrabold text-4xl text-green-500">+12%</span>
                    <span class="text-text-muted text-sm font-bold pb-1.5">This week</span>
                 </div>
              </div>
              <div>
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Server Status</p>
                 <div class="flex items-center gap-3 mt-1">
                    <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span class="font-bold text-lg">Operational</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div v-if="error" class="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-red-500 font-bold">
        {{ error }}
      </div>
    </div>
  </div>
</template>
