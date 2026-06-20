<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { mealPlansApi, type MealPlan, type MealSlot } from '@/http/endpoints/mealPlans'
import { usersApi } from '@/http/endpoints/users'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { resolveImage } from '@/utils/imageUrl'
import { toLocalIsoDate } from '@/utils/dateUtils'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']
const SLOT_ICONS: Record<MealSlot, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍪',
}

function startOfWeek(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

const weekStart = ref(startOfWeek(new Date()))
// Mobile shows one day at a time; desktop shows the full week grid.
const selectedDate = ref(new Date())

const weekEnd = computed(() => {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
})

const days = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
})

const plans = ref<MealPlan[]>([])
const isLoading = ref(false)

function fmtIso(d: Date): string {
  return toLocalIsoDate(d)
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

function fmtNum(d: Date): string {
  return d.toLocaleDateString(undefined, { day: 'numeric' })
}

function isToday(d: Date): boolean {
  const today = new Date()
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

const plansByCell = computed(() => {
  const map: Record<string, MealPlan[]> = {}
  for (const p of plans.value) {
    const key = `${fmtIso(new Date(p.date))}|${p.slot}`
    if (!map[key]) map[key] = []
    map[key].push(p)
  }
  return map
})

async function loadWeek() {
  isLoading.value = true
  try {
    const from = toLocalIsoDate(weekStart.value)
    const to = toLocalIsoDate(weekEnd.value)
    const response = await mealPlansApi.list(from, to)
    plans.value = response.data.data
  } catch (error) {
    logger.error('Failed to load plans:', error)
  } finally {
    isLoading.value = false
  }
}

function shiftWeek(delta: number) {
  const next = new Date(weekStart.value)
  next.setDate(next.getDate() + 7 * delta)
  weekStart.value = next
  selectedDate.value = new Date(next) // keep mobile's selected day inside the visible week
  loadWeek()
}

function jumpToday() {
  weekStart.value = startOfWeek(new Date())
  selectedDate.value = new Date()
  loadWeek()
}

function selectDay(d: Date) {
  selectedDate.value = new Date(d)
}
function isSelected(d: Date): boolean {
  return fmtIso(d) === fmtIso(selectedDate.value)
}

// Picker modal
const showPicker = ref(false)
const pickerCell = ref<{ date: Date; slot: MealSlot } | null>(null)
const pickerSearch = ref('')
const pickerPosts = ref<any[]>([])
const isPickerLoading = ref(false)

async function openPicker(date: Date, slot: MealSlot) {
  pickerCell.value = { date, slot }
  pickerSearch.value = ''
  showPicker.value = true
  if (pickerPosts.value.length === 0) {
    isPickerLoading.value = true
    try {
      if (authStore.user?.id) {
        const res = await usersApi.getSavedPosts(authStore.user.id, 1, 40)
        pickerPosts.value = res.data.data.map((item: any) => item.post || item)
      }
    } catch (error) {
      logger.error('Picker load error:', error)
    } finally {
      isPickerLoading.value = false
    }
  }
}

const filteredPickerPosts = computed(() => {
  const q = pickerSearch.value.trim().toLowerCase()
  if (!q) return pickerPosts.value
  return pickerPosts.value.filter((p) => p.title?.toLowerCase().includes(q))
})

async function pickPost(post: any) {
  if (!pickerCell.value) return
  try {
    const response = await mealPlansApi.create({
      postId: post.id,
      date: toLocalIsoDate(pickerCell.value.date),
      slot: pickerCell.value.slot,
      servings: post.recipe?.servings ?? 2,
    })
    plans.value.push(response.data.data)
    showPicker.value = false
  } catch (error) {
    uiStore.showToast('Failed to add to plan', 'error')
  }
}

async function removePlan(id: string) {
  try {
    await mealPlansApi.delete(id)
    plans.value = plans.value.filter((p) => p.id !== id)
  } catch {
    uiStore.showToast('Failed to remove', 'error')
  }
}

// ── Drag and drop (desktop HTML5 DnD + mobile pointer events) ──────────────
const draggingId = ref<string | null>(null)
const dragOverCell = ref<string | null>(null)

// HTML5 DnD (desktop)
function onDragStart(event: DragEvent, planId: string) {
  draggingId.value = planId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', planId)
  }
}

function onDragEnd() {
  draggingId.value = null
  dragOverCell.value = null
}

function onDragOver(event: DragEvent, cellKey: string) {
  if (!draggingId.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dragOverCell.value = cellKey
}

function onDragLeave(cellKey: string) {
  if (dragOverCell.value === cellKey) dragOverCell.value = null
}

async function performDrop(id: string, date: Date, slot: MealSlot) {
  const plan = plans.value.find((p) => p.id === id)
  if (!plan) return
  const newDateIso = toLocalIsoDate(date)
  if (fmtIso(new Date(plan.date)) === fmtIso(date) && plan.slot === slot) return
  const original = { date: plan.date, slot: plan.slot }
  plan.date = newDateIso
  plan.slot = slot
  try {
    await mealPlansApi.update(id, { date: newDateIso, slot })
  } catch {
    plan.date = original.date
    plan.slot = original.slot
    uiStore.showToast('Failed to move plan', 'error')
  }
}

async function onDrop(event: DragEvent, date: Date, slot: MealSlot) {
  event.preventDefault()
  const id = draggingId.value || event.dataTransfer?.getData('text/plain')
  draggingId.value = null
  dragOverCell.value = null
  if (!id) return
  await performDrop(id, date, slot)
}

// Touch/pointer drag (mobile — HTML5 DnD is silent on iOS/Android)
let touchCloneEl: HTMLElement | null = null

function createTouchClone(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement
  const rect = source.getBoundingClientRect()
  clone.style.cssText = [
    `position:fixed`,
    `top:${rect.top}px`,
    `left:${rect.left}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    `z-index:9999`,
    `opacity:0.85`,
    `pointer-events:none`,
    `transform:scale(1.06)`,
    `border-radius:12px`,
    `box-shadow:0 12px 32px rgba(0,0,0,0.35)`,
    `transition:transform 0.1s`,
  ].join(';')
  document.body.appendChild(clone)
  return clone
}

function onChipPointerDown(e: PointerEvent, planId: string) {
  if (e.pointerType === 'mouse') return // handled by HTML5 DnD
  e.preventDefault()
  draggingId.value = planId
  touchCloneEl = createTouchClone(e.currentTarget as HTMLElement)
}

function onGlobalPointerMove(e: PointerEvent) {
  if (!draggingId.value || !touchCloneEl) return
  const w = touchCloneEl.offsetWidth
  const h = touchCloneEl.offsetHeight
  touchCloneEl.style.left = `${e.clientX - w / 2}px`
  touchCloneEl.style.top = `${e.clientY - h / 2}px`

  // Hit-test the cell under the finger
  touchCloneEl.style.display = 'none'
  const el = document.elementFromPoint(e.clientX, e.clientY)
  touchCloneEl.style.display = ''
  const cell = el?.closest('[data-cell-key]') as HTMLElement | null
  dragOverCell.value = cell?.dataset.cellKey ?? null
}

async function onGlobalPointerUp(e: PointerEvent) {
  if (!draggingId.value) return
  const id = draggingId.value
  const cellKey = dragOverCell.value

  touchCloneEl?.remove()
  touchCloneEl = null
  draggingId.value = null
  dragOverCell.value = null

  if (!cellKey) return
  const [dateStr, slot] = cellKey.split('|') as [string, MealSlot]
  await performDrop(id, new Date(dateStr), slot)
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadWeek()
  document.addEventListener('pointermove', onGlobalPointerMove)
  document.addEventListener('pointerup', onGlobalPointerUp)
})

onUnmounted(() => {
  document.removeEventListener('pointermove', onGlobalPointerMove)
  document.removeEventListener('pointerup', onGlobalPointerUp)
  touchCloneEl?.remove()
})

const weekLabel = computed(() => {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const from = weekStart.value.toLocaleDateString(undefined, opts)
  const toDate = new Date(weekStart.value)
  toDate.setDate(toDate.getDate() + 6)
  const to = toDate.toLocaleDateString(undefined, opts)
  return `${from} – ${to}`
})

const weekNutrition = computed(() => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const byDay: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {}
  let hasAny = false

  for (const plan of plans.value) {
    const n = plan.post?.recipe?.nutrition
    if (!n) continue
    const cal = parseFloat(String(n.calories ?? 0))
    const pro = parseFloat(String(n.protein ?? 0))
    const carb = parseFloat(String(n.carbs ?? 0))
    const fat = parseFloat(String(n.fat ?? 0))
    if (!cal && !pro && !carb && !fat) continue
    hasAny = true

    const baseServings = plan.post?.recipe?.servings ?? plan.servings
    const factor = baseServings > 0 ? plan.servings / baseServings : 1

    totals.calories += cal * factor
    totals.protein += pro * factor
    totals.carbs += carb * factor
    totals.fat += fat * factor

    const key = fmtIso(new Date(plan.date))
    if (!byDay[key]) byDay[key] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    byDay[key].calories += cal * factor
    byDay[key].protein += pro * factor
    byDay[key].carbs += carb * factor
    byDay[key].fat += fat * factor
  }

  if (!hasAny) return null

  const plannedDays = Object.keys(byDay).length
  const maxDayCal = Math.max(...Object.values(byDay).map((d) => d.calories), 1)

  return {
    totals: {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
    },
    byDay,
    dailyAvg: plannedDays > 0 ? Math.round(totals.calories / plannedDays) : null,
    maxDayCal,
  }
})

const selectedDateLabel = computed(() =>
  selectedDate.value.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
)
const selectedDayPlansBySlot = computed(() => {
  const res = {} as Record<MealSlot, MealPlan[]>
  for (const slot of SLOTS) {
    res[slot] = plansByCell.value[`${fmtIso(selectedDate.value)}|${slot}`] ?? []
  }
  return res
})
const selectedDayCalories = computed(() => {
  const day = weekNutrition.value?.byDay[fmtIso(selectedDate.value)]
  return day ? Math.round(day.calories) : null
})
</script>

<template>
  <div class="meal-plan-view min-h-screen px-6 md:px-10 md:py-10">
    <div class="max-w-7xl mx-auto">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <p class="text-orange text-[11px] font-bold uppercase tracking-[0.3em] mb-2">Plan</p>
          <h1 class="font-montserrat font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight">This week's meals</h1>
          <p class="hidden md:block text-text-muted mt-2">Drop saved recipes into the grid. Grocery list updates automatically.</p>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          <div class="flex items-center gap-2">
            <button @click="shiftWeek(-1)" aria-label="Previous week" class="w-10 h-10 shrink-0 rounded-full border-1.5 border-border bg-surface hover:border-orange hover:text-orange transition-[border-color,color,transform] duration-200 active:scale-[0.94]">‹</button>
            <button @click="jumpToday" class="px-4 h-10 shrink-0 rounded-full border-1.5 border-border bg-surface text-xs font-bold hover:border-orange hover:text-orange transition-[border-color,color,transform] duration-200 active:scale-[0.96]">Today</button>
            <span class="flex-1 text-center sm:flex-none px-1 sm:px-2 text-sm font-bold tabular-nums whitespace-nowrap">{{ weekLabel }}</span>
            <button @click="shiftWeek(1)" aria-label="Next week" class="w-10 h-10 shrink-0 rounded-full border-1.5 border-border bg-surface hover:border-orange hover:text-orange transition-[border-color,color,transform] duration-200 active:scale-[0.94]">›</button>
          </div>
          <RouterLink to="/groceries" class="btn-primary px-5 py-2.5 text-xs inline-flex items-center justify-center gap-1.5 sm:ml-2 shadow-[0_6px_24px_var(--orange-glow)] hover:shadow-[0_12px_32px_var(--orange-glow)] hover:-translate-y-0.5 transition-[transform,box-shadow,background-color] duration-200 active:scale-[0.96]"><BaseIcons name="shopping-cart" size="sm" />Grocery List</RouterLink>
        </div>
      </header>

      <!-- ── Mobile: day picker + single-day stacked meals ── -->
      <div class="md:hidden">
        <div class="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1 mb-6">
          <button
            v-for="d in days"
            :key="`m-${d.toISOString()}`"
            @click="selectDay(d)"
            :class="[
              'shrink-0 w-[3.25rem] rounded-2xl py-2.5 flex flex-col items-center border-1.5 transition-all active:scale-95',
              isSelected(d)
                ? 'border-orange bg-orange text-white shadow-card'
                : isToday(d)
                  ? 'border-orange/40 bg-orange/5'
                  : 'border-border bg-background-secondary/40',
            ]"
          >
            <span :class="['text-[10px] font-bold uppercase tracking-wide', isSelected(d) ? 'text-white/80' : 'text-text-dim']">{{ fmtDay(d) }}</span>
            <span class="font-montserrat font-extrabold text-lg leading-none mt-1">{{ fmtNum(d) }}</span>
          </button>
        </div>

        <div class="flex items-baseline justify-between mb-4">
          <h2 class="font-montserrat font-extrabold text-xl tracking-tight">{{ selectedDateLabel }}</h2>
          <span v-if="selectedDayCalories" class="text-xs text-text-dim shrink-0 ml-3"><span class="font-bold text-text tabular-nums">{{ selectedDayCalories }}</span> kcal</span>
        </div>

        <div class="space-y-5">
          <section v-for="slot in SLOTS" :key="`m-${slot}`">
            <div class="flex items-center gap-2 mb-2.5 text-xs font-bold uppercase tracking-widest text-text-muted">
              <span class="text-sm">{{ SLOT_ICONS[slot] }}</span>
              <span>{{ slot }}</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="plan in selectedDayPlansBySlot[slot]"
                :key="plan.id"
                @click="router.push(`/recipes/${plan.postId}`)"
                class="relative flex items-center gap-3 p-2 rounded-2xl bg-surface border border-border shadow-card active:scale-[0.99] transition-transform duration-200"
              >
                <img :src="resolveImage(plan.post?.imageUrl, plan.postId)" :alt="plan.post?.title" class="w-16 h-16 rounded-xl object-cover shrink-0 outline outline-1 outline-black/10 dark:outline-white/10 -outline-offset-1" />
                <div class="min-w-0 flex-1">
                  <p class="font-bold text-sm leading-tight line-clamp-2">{{ plan.post?.title }}</p>
                  <p class="text-xs text-text-dim mt-0.5">{{ plan.servings }} servings</p>
                </div>
                <button
                  @click.stop="removePlan(plan.id)"
                  class="w-9 h-9 shrink-0 rounded-full bg-background-secondary text-text-dim hover:text-red-500 flex items-center justify-center transition-colors"
                  aria-label="Remove from plan"
                >
                  <BaseIcons name="x-mark" size="sm" />
                </button>
              </div>
              <button
                @click="openPicker(selectedDate, slot)"
                class="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-1.5 border-dashed border-border text-text-dim text-sm font-bold hover:border-orange hover:text-orange active:scale-[0.99] transition-all"
              >
                <BaseIcons name="plus" size="sm" /> Add {{ slot }}
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- ── Desktop: full week grid ── -->
      <div class="hidden md:block">
      <div class="grid grid-cols-[110px_repeat(7,minmax(0,1fr))] gap-2 mb-2">
        <div></div>
        <div
          v-for="d in days"
          :key="d.toISOString()"
          :class="['rounded-2xl p-3 text-center border-1.5', isToday(d) ? 'border-orange bg-orange/5' : 'border-transparent bg-background-secondary/40']"
        >
          <p class="text-[10px] font-bold uppercase tracking-widest text-text-dim">{{ fmtDay(d) }}</p>
          <p :class="['font-montserrat font-extrabold text-xl mt-1', isToday(d) ? 'text-orange' : 'text-text']">{{ fmtNum(d) }}</p>
        </div>
      </div>

      <div v-for="slot in SLOTS" :key="slot" class="grid grid-cols-[110px_repeat(7,minmax(0,1fr))] gap-2 mb-2">
        <div class="flex items-center gap-2 px-4 py-3 rounded-2xl bg-background-secondary/40 text-xs font-bold uppercase tracking-widest text-text-muted">
          <span>{{ SLOT_ICONS[slot] }}</span>
          <span>{{ slot }}</span>
        </div>
        <div
          v-for="d in days"
          :key="`${slot}-${d.toISOString()}`"
          :data-cell-key="`${fmtIso(d)}|${slot}`"
          :class="[
            'rounded-2xl border-1.5 border-dashed bg-surface/40 min-h-[110px] p-2 group transition-all',
            dragOverCell === `${fmtIso(d)}|${slot}` ? 'border-orange bg-orange/10' : 'border-border hover:border-orange',
          ]"
          @dragover="onDragOver($event, `${fmtIso(d)}|${slot}`)"
          @dragleave="onDragLeave(`${fmtIso(d)}|${slot}`)"
          @drop="onDrop($event, d, slot)"
        >
          <div v-if="plansByCell[`${fmtIso(d)}|${slot}`]?.length" class="space-y-1.5">
            <div
              v-for="plan in plansByCell[`${fmtIso(d)}|${slot}`]"
              :key="plan.id"
              :class="['meal-chip relative overflow-hidden rounded-xl cursor-grab active:cursor-grabbing group/chip touch-none', draggingId === plan.id ? 'opacity-30' : '']"
              draggable="true"
              @dragstart="onDragStart($event, plan.id)"
              @dragend="onDragEnd"
              @pointerdown="onChipPointerDown($event, plan.id)"
              @click="router.push(`/recipes/${plan.postId}`)"
            >
              <img :src="resolveImage(plan.post?.imageUrl, plan.postId)" :alt="plan.post?.title" class="w-full h-16 object-cover pointer-events-none" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none"></div>
              <div class="absolute inset-x-0 bottom-0 p-1.5 pointer-events-none">
                <p class="text-[10px] font-bold text-white leading-tight truncate">{{ plan.post?.title }}</p>
                <p class="text-[9px] text-white/70 truncate">{{ plan.servings }} serv</p>
              </div>
              <button
                @click.stop="removePlan(plan.id)"
                class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] opacity-0 group-hover/chip:opacity-100 transition-all"
                aria-label="Remove"
              >✕</button>
            </div>
            <button
              @click="openPicker(d, slot)"
              class="w-full h-6 rounded-lg border border-dashed border-border text-[10px] text-text-dim font-bold hover:text-orange hover:border-orange transition-all"
            >+ Another</button>
          </div>
          <button
            v-else
            @click="openPicker(d, slot)"
            class="w-full h-full min-h-[100px] flex items-center justify-center text-text-dim text-2xl opacity-30 group-hover:opacity-100 group-hover:text-orange transition-all"
          >+</button>
        </div>
      </div>
      </div><!-- /desktop week grid -->

      <!-- Weekly nutrition summary -->
      <div v-if="weekNutrition" class="mt-8 p-6 rounded-card bg-surface border border-border shadow-card">
        <div class="flex items-center justify-between mb-5">
          <div>
            <p class="text-orange text-[11px] font-bold uppercase tracking-[0.3em] mb-1">Nutrition</p>
            <h2 class="font-montserrat font-extrabold text-xl">Weekly macros</h2>
          </div>
          <p v-if="weekNutrition.dailyAvg" class="text-xs text-text-dim">
            avg <span class="font-bold text-text">{{ weekNutrition.dailyAvg }} kcal</span> / day
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div
            v-for="m in [
              { label: 'Calories', value: weekNutrition.totals.calories, unit: 'kcal', color: 'text-orange' },
              { label: 'Protein', value: weekNutrition.totals.protein, unit: 'g', color: 'text-blue-400 dark:text-blue-300' },
              { label: 'Carbs', value: weekNutrition.totals.carbs, unit: 'g', color: 'text-amber-500 dark:text-amber-400' },
              { label: 'Fat', value: weekNutrition.totals.fat, unit: 'g', color: 'text-teal-600 dark:text-teal-400' },
            ]"
            :key="m.label"
            class="p-4 rounded-2xl bg-surface border border-border shadow-card"
          >
            <p class="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1">{{ m.label }}</p>
            <p :class="['font-montserrat font-extrabold text-2xl tabular-nums leading-none', m.color]">{{ m.value }}</p>
            <p class="text-[10px] text-text-dim mt-1">{{ m.unit }} · week</p>
          </div>
        </div>

        <!-- Per-day calorie bars -->
        <div class="grid grid-cols-7 gap-1.5 items-end" style="height: 96px;">
          <div v-for="d in days" :key="d.toISOString()" class="flex flex-col items-center gap-1 h-full justify-end">
            <p v-if="weekNutrition.byDay[fmtIso(d)]" class="text-[9px] tabular-nums text-text-dim leading-none mb-0.5">
              {{ Math.round(weekNutrition.byDay[fmtIso(d)].calories) }}
            </p>
            <div
              class="w-full rounded-t-lg transition-all duration-500 min-h-[4px]"
              :style="{
                height: weekNutrition.byDay[fmtIso(d)]
                  ? `${Math.max(8, (weekNutrition.byDay[fmtIso(d)].calories / weekNutrition.maxDayCal) * 60)}px`
                  : '4px',
                background: isToday(d)
                  ? 'var(--orange)'
                  : weekNutrition.byDay[fmtIso(d)]
                    ? 'rgb(251 146 60 / 0.45)'
                    : 'var(--border)',
              }"
            ></div>
            <p :class="['text-[9px] font-bold uppercase leading-none mt-1', isToday(d) ? 'text-orange' : 'text-text-dim']">
              {{ fmtDay(d) }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="text-center text-text-dim mt-6 text-sm">Loading…</div>
    </div>

    <!-- Picker modal -->
    <Transition name="picker-fade">
    <div
      v-if="showPicker"
      class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
      @click.self="showPicker = false"
    >
      <div class="picker-panel bg-surface-solid border border-border rounded-card p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-modal">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-montserrat font-extrabold text-xl">Pick a recipe</h3>
            <p class="text-xs text-text-dim mt-1" v-if="pickerCell">
              {{ pickerCell.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) }} · {{ pickerCell.slot }}
            </p>
          </div>
          <button @click="showPicker = false" aria-label="Close" class="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-text-dim hover:text-text text-xl transition-[color,transform] duration-200 active:scale-[0.92]">✕</button>
        </div>

        <input
          v-model="pickerSearch"
          type="text"
          placeholder="Search saved recipes…"
          class="settings-input mb-4"
        />

        <div class="flex-1 overflow-y-auto -mx-2 px-2">
          <div v-if="isPickerLoading" class="text-center py-12 text-text-dim text-sm">Loading saved recipes…</div>
          <div v-else-if="filteredPickerPosts.length === 0" class="text-center py-12 text-text-dim text-sm">
            No saved recipes yet. <RouterLink to="/" class="text-orange font-bold">Discover some →</RouterLink>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="post in filteredPickerPosts"
              :key="post.id"
              @click="pickPost(post)"
              class="flex gap-3 items-center p-2 rounded-2xl border border-border bg-background-secondary/40 hover:border-orange hover:bg-orange-soft transition-[border-color,background-color,transform] duration-200 text-left active:scale-[0.98]"
            >
              <img :src="resolveImage(post.imageUrl, post.id)" :alt="post.title" class="w-16 h-16 rounded-xl object-cover shrink-0 outline outline-1 outline-black/10 dark:outline-white/10 -outline-offset-1" />
              <div class="min-w-0">
                <p class="font-bold text-sm truncate">{{ post.title }}</p>
                <p class="text-xs text-text-dim">{{ post.recipe?.servings ?? '—' }} serv · {{ post.category }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  font-size: 0.875rem;
  outline: none;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.settings-input:focus {
  border-color: var(--orange, #ff6b35);
  box-shadow: 0 0 0 3px var(--orange-soft);
}

.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.2s ease;
}
.picker-fade-enter-active .picker-panel {
  transition: transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.25s ease;
}
.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
}
.picker-fade-enter-from .picker-panel {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .picker-fade-enter-active .picker-panel,
  .picker-fade-enter-active,
  .picker-fade-leave-active {
    transition: none;
  }
}
</style>
