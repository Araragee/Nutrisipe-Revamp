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
  loadWeek()
}

function jumpToday() {
  weekStart.value = startOfWeek(new Date())
  loadWeek()
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
</script>

<template>
  <div class="meal-plan-view min-h-screen px-6 md:px-10 py-10">
    <div class="max-w-7xl mx-auto">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p class="text-orange text-[11px] font-bold uppercase tracking-[0.3em] mb-2">Plan</p>
          <h1 class="font-montserrat font-extrabold text-4xl md:text-5xl tracking-tight">This week's meals</h1>
          <p class="text-text-muted mt-2">Drop saved recipes into the grid. Grocery list updates automatically.</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="shiftWeek(-1)" class="w-10 h-10 rounded-full border-1.5 border-border bg-surface/70 hover:border-orange hover:text-orange transition-all">‹</button>
          <button @click="jumpToday" class="px-4 h-10 rounded-full border-1.5 border-border bg-surface/70 text-xs font-bold hover:border-orange hover:text-orange transition-all">Today</button>
          <span class="px-3 text-sm font-bold tabular-nums">{{ weekLabel }}</span>
          <button @click="shiftWeek(1)" class="w-10 h-10 rounded-full border-1.5 border-border bg-surface/70 hover:border-orange hover:text-orange transition-all">›</button>
          <RouterLink to="/groceries" class="ml-4 btn-primary px-5 py-2.5 text-xs inline-flex items-center gap-1.5"><BaseIcons name="shopping-cart" size="sm" />Grocery List</RouterLink>
        </div>
      </header>

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

      <div v-if="isLoading" class="text-center text-text-dim mt-6 text-sm">Loading…</div>
    </div>

    <!-- Picker modal -->
    <div
      v-if="showPicker"
      class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
      @click.self="showPicker = false"
    >
      <div class="bg-surface border-1.5 border-border rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-modal">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-montserrat font-extrabold text-xl">Pick a recipe</h3>
            <p class="text-xs text-text-dim mt-1" v-if="pickerCell">
              {{ pickerCell.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) }} · {{ pickerCell.slot }}
            </p>
          </div>
          <button @click="showPicker = false" class="text-text-dim text-xl">✕</button>
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
              class="flex gap-3 items-center p-2 rounded-2xl border border-border bg-background-secondary/40 hover:border-orange hover:bg-orange/5 transition-all text-left"
            >
              <img :src="resolveImage(post.imageUrl, post.id)" :alt="post.title" class="w-16 h-16 rounded-xl object-cover shrink-0" />
              <div class="min-w-0">
                <p class="font-bold text-sm truncate">{{ post.title }}</p>
                <p class="text-xs text-text-dim">{{ post.recipe?.servings ?? '—' }} serv · {{ post.category }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--background-secondary, rgba(245, 245, 247, 0.5));
  border: 1.5px solid var(--border, rgba(0, 0, 0, 0.08));
  border-radius: 12px;
  font-size: 0.875rem;
  outline: none;
  color: inherit;
}
.settings-input:focus {
  border-color: var(--orange, #ff6b35);
}
</style>
