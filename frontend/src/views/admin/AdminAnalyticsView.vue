<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminApi, type AdminStatsPeriod } from '@/http/endpoints/admin'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref<any>(null)
const error = ref('')
const isLoading = ref(true)
const selectedPeriod = ref<AdminStatsPeriod>('7days')

const PERIODS: { label: string; value: AdminStatsPeriod }[] = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: 'All Time', value: 'all' },
]

const periodLabel = computed(
  () => PERIODS.find((p) => p.value === selectedPeriod.value)?.label ?? '',
)

onMounted(async () => {
  if (authStore.user?.role !== 'ADMIN') {
    router.push('/')
    return
  }
  await loadStats()
})

async function setPeriod(period: AdminStatsPeriod) {
  if (selectedPeriod.value === period) return
  selectedPeriod.value = period
  await loadStats()
}

async function loadStats() {
  isLoading.value = true
  try {
    const response = await adminApi.getStats(selectedPeriod.value)
    stats.value = response.data.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load statistics'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="admin-analytics-view min-h-screen bg-background py-16 px-6 md:px-12">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
           <RouterLink to="/admin" class="text-xs font-bold uppercase tracking-widest text-orange hover:underline mb-2 block">← Dashboard</RouterLink>
           <h1 class="font-montserrat font-extrabold text-4xl tracking-tight">Platform Insights</h1>
        </div>

        <div class="flex bg-background-secondary border border-border p-1.5 rounded-2xl">
           <button
             v-for="p in PERIODS" :key="p.value"
             @click="setPeriod(p.value)"
             :disabled="isLoading"
             :class="['px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50', selectedPeriod === p.value ? 'bg-orange text-white' : 'text-text-muted hover:text-white']"
           >
             {{ p.label }}
           </button>
        </div>
      </div>

      <div v-if="isLoading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="stats" class="space-y-12">
        <!-- Growth Section -->
        <section>
           <h2 class="font-montserrat font-extrabold text-xl mb-6 tracking-tight uppercase">User Growth</h2>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-background-secondary border border-border rounded-[32px] p-8">
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-widest mb-4">Total Population</p>
                 <div class="text-4xl font-montserrat font-extrabold mb-2">{{ stats.users.total }}</div>
                 <div class="text-green-500 font-bold text-xs">+{{ stats.users.newInPeriod ?? stats.users.newToday }} in {{ periodLabel }}</div>
              </div>
              <div class="bg-background-secondary border border-border rounded-[32px] p-8">
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-widest mb-4">Active Participation</p>
                 <div class="text-4xl font-montserrat font-extrabold mb-2">{{ stats.users.active }}</div>
                 <div class="text-text-muted font-bold text-xs">{{ ((stats.users.active / stats.users.total) * 100).toFixed(1) }}% retention rate</div>
              </div>
              <div class="bg-background-secondary border border-border rounded-[32px] p-8">
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-widest mb-4">Safety Index</p>
                 <div class="text-4xl font-montserrat font-extrabold mb-2 text-red-500">{{ stats.users.banned }}</div>
                 <div class="text-text-muted font-bold text-xs">Citizens restricted</div>
              </div>
           </div>
        </section>

        <!-- Content Section -->
        <section>
           <h2 class="font-montserrat font-extrabold text-xl mb-6 tracking-tight uppercase">Content & Engagement</h2>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-background-secondary border border-border rounded-[32px] p-8">
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-widest mb-4">Recipe Volume</p>
                 <div class="text-4xl font-montserrat font-extrabold mb-2">{{ stats.content.posts }}</div>
                 <div class="text-orange font-bold text-xs">+{{ stats.content.newPostsInPeriod ?? stats.content.newPostsToday }} in {{ periodLabel }}</div>
              </div>
              <div class="bg-background-secondary border border-border rounded-[32px] p-8">
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-widest mb-4">Social Interaction</p>
                 <div class="text-4xl font-montserrat font-extrabold mb-2">{{ stats.content.comments }}</div>
                 <div class="text-text-muted font-bold text-xs">+{{ stats.content.newCommentsInPeriod ?? 0 }} in {{ periodLabel }} · {{ stats.content.posts > 0 ? (stats.content.comments / stats.content.posts).toFixed(1) : '0' }} per recipe</div>
              </div>
              <div class="bg-background-secondary border border-border rounded-[32px] p-8">
                 <p class="text-text-dim font-bold text-[10px] uppercase tracking-widest mb-4">Creative Density</p>
                 <div class="text-4xl font-montserrat font-extrabold mb-2">{{ (stats.content.posts / stats.users.total).toFixed(2) }}</div>
                 <div class="text-text-muted font-bold text-xs">Recipes per citizen</div>
              </div>
           </div>
        </section>

        <!-- Technical Status -->
        <div class="bg-orange-soft/20 border border-orange/30 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-8">
           <div class="w-20 h-20 bg-orange-soft rounded-full flex items-center justify-center shrink-0"><BaseIcons name="chart-bar" size="xl" class="text-orange" /></div>
           <div class="flex-1 text-center md:text-left">
              <h3 class="font-montserrat font-extrabold text-2xl mb-2">Advanced Charts coming soon</h3>
              <p class="text-text-muted max-w-lg">We're currently building deep-dive visual analytics for trend forecasting, heatmaps, and ingredient correlation matrices. Stay tuned for the next update.</p>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
