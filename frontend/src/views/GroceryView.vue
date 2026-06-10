<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mealPlansApi, type GroceryList } from '@/http/endpoints/mealPlans'
import { useAuthStore } from '@/stores/auth'
import { toLocalIsoDate } from '@/utils/dateUtils'

const router = useRouter()
const authStore = useAuthStore()

const RANGE_OPTS = [
  { label: 'This week', days: 7 },
  { label: 'Next 2 weeks', days: 14 },
  { label: 'Next 4 weeks', days: 28 },
] as const

const selectedRange = ref<(typeof RANGE_OPTS)[number]>(RANGE_OPTS[0])
const grocery = ref<GroceryList | null>(null)
const isLoading = ref(false)
const checked = ref<Set<string>>(new Set())

const CHECKED_KEY = 'nutrisipe-grocery-checked'

function loadChecked() {
  try {
    const raw = localStorage.getItem(CHECKED_KEY)
    if (raw) checked.value = new Set(JSON.parse(raw))
  } catch {
    // ignore
  }
}

function persistChecked() {
  try {
    localStorage.setItem(CHECKED_KEY, JSON.stringify(Array.from(checked.value)))
  } catch {
    // ignore
  }
}

function toggleItem(key: string) {
  const next = new Set(checked.value)
  next.has(key) ? next.delete(key) : next.add(key)
  checked.value = next
  persistChecked()
}

function clearChecked() {
  checked.value = new Set()
  persistChecked()
}

async function load() {
  if (!authStore.user) return
  isLoading.value = true
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(today)
    end.setDate(end.getDate() + selectedRange.value.days)
    end.setHours(23, 59, 59, 999)
    const response = await mealPlansApi.grocery(toLocalIsoDate(today), toLocalIsoDate(end))
    grocery.value = response.data.data
  } catch (error) {
    console.error('Failed to load grocery list:', error)
  } finally {
    isLoading.value = false
  }
}

function setRange(opt: (typeof RANGE_OPTS)[number]) {
  selectedRange.value = opt
  load()
}

const CATEGORY_ICONS: Record<string, string> = {
  produce: '🥬',
  protein: '🍗',
  dairy: '🥛',
  grain: '🌾',
  pantry: '🫙',
  frozen: '🧊',
  beverage: '🥤',
  spice: '🌶️',
  other: '🛒',
}

const grouped = computed(() => {
  const list = grocery.value?.items ?? []
  if (list.length === 0) return [] as Array<{ category: string; label: string; icon: string; items: typeof list }>
  const order = grocery.value?.categoriesOrder ?? []
  const labels = grocery.value?.categoryLabels ?? {} as Record<string, string>
  const buckets: Record<string, typeof list> = {}
  for (const item of list) {
    const key = item.category || 'other'
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(item)
  }
  return order
    .filter((cat) => buckets[cat]?.length)
    .map((cat) => ({
      category: cat,
      label: labels[cat] ?? cat,
      icon: CATEGORY_ICONS[cat] ?? '🛒',
      items: buckets[cat],
    }))
})

const totalItems = computed(() => grocery.value?.items.length ?? 0)
const checkedCount = computed(() =>
  grocery.value?.items.filter((i) => checked.value.has(`${i.name}|${i.unit}`)).length ?? 0,
)

function copyToClipboard() {
  if (!grocery.value) return
  const lines = grocery.value.items.map((i) => {
    const qty = i.total ? `${i.total} ${i.unit}`.trim() : i.raw.join(' + ')
    return `□ ${i.name}${qty ? ` — ${qty}` : ''}`
  })
  navigator.clipboard.writeText(lines.join('\n'))
}

function printList() {
  window.print()
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadChecked()
  load()
})
</script>

<template>
  <div class="grocery-view min-h-screen px-6 md:px-10 py-10">
    <div class="max-w-3xl mx-auto">
      <header class="mb-8">
        <p class="text-orange text-[11px] font-bold uppercase tracking-[0.3em] mb-2">Groceries</p>
        <h1 class="font-montserrat font-extrabold text-4xl md:text-5xl tracking-tight">Shopping list</h1>
        <p class="text-text-muted mt-2">Auto-compiled from your meal plan. Servings scaled per planned portion.</p>
      </header>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div class="flex gap-2 bg-background-secondary p-1 rounded-2xl border border-glass-border">
          <button
            v-for="opt in RANGE_OPTS"
            :key="opt.days"
            @click="setRange(opt)"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              selectedRange.days === opt.days ? 'bg-orange text-white' : 'text-text-muted hover:text-text',
            ]"
          >{{ opt.label }}</button>
        </div>
        <div class="flex gap-2">
          <button @click="copyToClipboard" :disabled="!grocery?.items.length" class="px-4 py-2 rounded-xl border-1.5 border-glass-border bg-surface/70 text-xs font-bold hover:border-orange hover:text-orange disabled:opacity-40 transition-all">📋 Copy</button>
          <button @click="printList" :disabled="!grocery?.items.length" class="px-4 py-2 rounded-xl border-1.5 border-glass-border bg-surface/70 text-xs font-bold hover:border-orange hover:text-orange disabled:opacity-40 transition-all">🖨️ Print</button>
        </div>
      </div>

      <div v-if="isLoading" class="text-center py-12 text-text-dim text-sm">Crunching ingredients…</div>

      <div v-else-if="!grocery || grocery.items.length === 0" class="text-center py-20 bg-background-secondary/40 rounded-3xl border-1.5 border-dashed border-glass-border">
        <span class="text-5xl mb-4 block">🛒</span>
        <h3 class="text-xl font-bold mb-2">Empty list</h3>
        <p class="text-text-dim mb-6 max-w-sm mx-auto">Add recipes to your meal plan to fill this up.</p>
        <RouterLink to="/plan" class="btn-primary px-8">Open Meal Plan →</RouterLink>
      </div>

      <div v-else>
        <div class="mb-6 p-4 rounded-2xl bg-background-secondary/40 border border-glass-border flex items-center justify-between">
          <div>
            <p class="font-bold text-sm">{{ totalItems }} items across {{ grocery.planCount }} planned meals</p>
            <p class="text-xs text-text-dim">{{ checkedCount }} checked off</p>
          </div>
          <button v-if="checkedCount > 0" @click="clearChecked" class="text-xs font-bold text-orange hover:underline">Reset checks</button>
        </div>

        <div v-for="group in grouped" :key="group.category" class="mb-8 grocery-group">
          <h2 class="font-montserrat font-extrabold text-xs uppercase tracking-[0.3em] text-orange mb-3 flex items-center gap-2">
            <span class="text-base">{{ group.icon }}</span>
            <span>{{ group.label }}</span>
            <span class="text-text-dim text-[10px]">· {{ group.items.length }}</span>
          </h2>
          <ul class="space-y-2">
            <li
              v-for="item in group.items"
              :key="`${item.name}|${item.unit}`"
              :class="[
                'flex items-center gap-3 p-4 rounded-2xl border border-glass-border bg-surface/60 transition-all cursor-pointer hover:border-orange',
                checked.has(`${item.name}|${item.unit}`) ? 'opacity-50 line-through' : '',
              ]"
              @click="toggleItem(`${item.name}|${item.unit}`)"
            >
              <div :class="['w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all', checked.has(`${item.name}|${item.unit}`) ? 'bg-orange border-orange text-white text-xs' : 'border-glass-border']">
                {{ checked.has(`${item.name}|${item.unit}`) ? '✓' : '' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm">{{ item.name }}</p>
                <p class="text-[11px] text-text-dim truncate">
                  <template v-if="item.total">{{ item.total }} {{ item.unit }}</template>
                  <template v-else-if="item.raw.length">{{ item.raw.join(' + ') }}</template>
                  <template v-else>—</template>
                  <span class="ml-2">· for {{ item.sources.length }} {{ item.sources.length === 1 ? 'recipe' : 'recipes' }}</span>
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .grocery-view {
    background: #fff !important;
    color: #000 !important;
  }
  .btn-primary,
  button {
    display: none;
  }
  .grocery-group li {
    border: 1px solid #e0e0e0 !important;
    background: #fff !important;
    page-break-inside: avoid;
  }
}
</style>
