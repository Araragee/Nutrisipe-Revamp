<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Post } from '@/typescript/interface/Post'

const props = defineProps<{
  show: boolean
  post: Post | null
}>()

const emit = defineEmits<{ close: [] }>()

interface ExpItem {
  id: number
  name: string
  qty: string
  scale: number
  removed: boolean
  contrib: { cals: number; protein: number; carbs: number; fat: number }
}

const baseRecipe = computed(() => props.post?.recipe ?? null)
const baseNutrition = computed(() => ({
  cals: Number(baseRecipe.value?.nutrition?.calories ?? 0),
  protein: Number(baseRecipe.value?.nutrition?.protein ?? 0),
  carbs: Number(baseRecipe.value?.nutrition?.carbs ?? 0),
  fat: Number(baseRecipe.value?.nutrition?.fat ?? 0),
}))

const items = ref<ExpItem[]>([])
const servings = ref(2)

const buildInitial = (): ExpItem[] => {
  const ings = baseRecipe.value?.ingredients ?? []
  if (!ings.length) return []
  const weights = ings.map((_, i) => 1 + (i % 3) * 0.4)
  const wSum = weights.reduce((a, b) => a + b, 0)
  const base = baseNutrition.value
  return ings.map((ing, i) => ({
    id: i,
    name: ing.name,
    qty: ing.quantity,
    scale: 1,
    removed: false,
    contrib: {
      cals: (base.cals * weights[i]) / wSum,
      protein: (base.protein * weights[i]) / wSum,
      carbs: (base.carbs * weights[i]) / wSum,
      fat: (base.fat * weights[i]) / wSum,
    },
  }))
}

let initialSnapshot: ExpItem[] = []
const reset = () => {
  initialSnapshot = buildInitial()
  items.value = initialSnapshot.map(i => ({ ...i, contrib: { ...i.contrib } }))
  servings.value = props.post?.recipe?.servings ?? 2
}

const adjust = (id: number, delta: number) => {
  items.value = items.value.map(it => {
    if (it.id !== id) return it
    const next = Math.max(0, Math.min(3, +(it.scale + delta).toFixed(2)))
    return { ...it, scale: next, removed: next === 0 }
  })
}

const remove = (id: number) => {
  items.value = items.value.map(it => it.id === id ? { ...it, removed: true, scale: 0 } : it)
}

const renameItem = (id: number, name: string) => {
  items.value = items.value.map(it => it.id === id ? { ...it, name } : it)
}

const addNew = () => {
  const len = baseRecipe.value?.ingredients?.length || 1
  const base = baseNutrition.value
  const avg = {
    cals: base.cals / len / 2,
    protein: base.protein / len / 2,
    carbs: base.carbs / len / 2,
    fat: base.fat / len / 2,
  }
  const newId = items.value.reduce((m, i) => Math.max(m, i.id), 0) + 1
  items.value = [...items.value, { id: newId, name: 'New ingredient', qty: '1 serving', scale: 1, removed: false, contrib: avg }]
}

const totals = computed(() => {
  return items.value.reduce(
    (acc, it) => {
      if (it.removed) return acc
      acc.cals += it.contrib.cals * it.scale
      acc.protein += it.contrib.protein * it.scale
      acc.carbs += it.contrib.carbs * it.scale
      acc.fat += it.contrib.fat * it.scale
      return acc
    },
    { cals: 0, protein: 0, carbs: 0, fat: 0 },
  )
})

const display = computed(() => {
  const baseServings = props.post?.recipe?.servings ?? 2
  const scale = baseServings / Math.max(servings.value, 1)
  return {
    cals: Math.round(totals.value.cals * scale),
    protein: Math.round(totals.value.protein * scale),
    carbs: Math.round(totals.value.carbs * scale),
    fat: Math.round(totals.value.fat * scale),
  }
})

const calDelta = computed(() => display.value.cals - baseNutrition.value.cals)

const macros = computed(() => [
  { key: 'protein', label: 'Protein', value: display.value.protein, base: baseNutrition.value.protein, max: 80, color: '#4ECDC4', unit: 'g' },
  { key: 'carbs', label: 'Carbs', value: display.value.carbs, base: baseNutrition.value.carbs, max: 120, color: '#FFE66D', unit: 'g' },
  { key: 'fat', label: 'Fat', value: display.value.fat, base: baseNutrition.value.fat, max: 60, color: '#FF6B8A', unit: 'g' },
])

const onShow = () => { if (props.show) reset() }
import { watch } from 'vue'
watch(() => [props.show, props.post?.id], onShow, { immediate: true })

const close = () => emit('close')
</script>

<template>
  <div
    v-if="show && post"
    class="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/75 backdrop-blur-md"
    @click.self="close"
  >
    <div class="relative bg-background w-full max-w-[960px] h-full max-h-[92vh] rounded-[28px] overflow-hidden border-1.5 border-glass-border shadow-modal grid grid-cols-1 md:grid-cols-[1fr_360px] animate-modalIn">
      <button
        @click="close"
        class="absolute top-6 right-6 z-[130] w-9 h-9 rounded-full bg-background/80 backdrop-blur-md border-1.5 border-glass-border text-text-muted hover:border-orange hover:text-orange flex items-center justify-center transition-all shadow-lg"
        aria-label="Close"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <!-- LEFT: ingredients editor -->
      <div class="flex flex-col h-full overflow-hidden border-r border-glass-border">
        <div class="p-6 pb-4 flex items-start gap-4">
          <div class="flex-1 min-w-0">
            <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange/15 text-orange text-[10px] font-bold uppercase tracking-wider mb-2">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Experiment
            </span>
            <h2 class="font-montserrat font-extrabold text-2xl tracking-tight leading-tight">{{ post.title }}</h2>
            <p class="text-xs text-text-dim mt-1.5 leading-relaxed">
              Adjust quantities, swap items, or remove anything you don't have. Nutrition updates as you go.
            </p>
          </div>
        </div>

        <div class="px-6 mb-3 flex items-center justify-between p-3.5 bg-background-secondary border border-glass-border rounded-xl mx-6 -mx-0">
          <div>
            <div class="text-sm font-bold">Servings</div>
            <div class="text-[11px] text-text-dim">Macros below are per serving</div>
          </div>
          <div class="flex items-center gap-2 bg-background border border-glass-border rounded-full px-1 py-1">
            <button @click="servings = Math.max(1, servings - 1)" class="w-7 h-7 rounded-full border border-glass-border text-text-muted hover:text-orange hover:border-orange flex items-center justify-center text-sm">−</button>
            <span class="w-8 text-center font-bold tabular-nums">{{ servings }}</span>
            <button @click="servings = Math.min(8, servings + 1)" class="w-7 h-7 rounded-full border border-glass-border text-text-muted hover:text-orange hover:border-orange flex items-center justify-center text-sm">+</button>
          </div>
        </div>

        <div class="px-6 flex items-center justify-between mb-2">
          <span class="text-[11px] font-bold uppercase tracking-widest text-text-dim">Ingredients</span>
          <button @click="addNew" class="text-[11px] font-bold text-orange flex items-center gap-1 hover:underline">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          <div
            v-for="it in items"
            :key="it.id"
            :class="[
              'flex items-center gap-2 p-2 bg-background-secondary border border-glass-border rounded-xl transition-all',
              it.removed ? 'opacity-40 line-through' : '',
            ]"
          >
            <input
              :value="it.name"
              @input="renameItem(it.id, ($event.target as HTMLInputElement).value)"
              class="flex-1 bg-transparent outline-none text-sm font-medium px-2"
            />
            <div class="flex items-center gap-1 bg-background border border-glass-border rounded-full px-1 py-0.5">
              <button @click="adjust(it.id, -0.25)" class="w-6 h-6 rounded-full text-text-muted hover:text-orange flex items-center justify-center text-sm">−</button>
              <span class="text-[11px] font-bold tabular-nums w-12 text-center">{{ Math.round(it.scale * 100) }}<span class="text-text-dim">%</span></span>
              <button @click="adjust(it.id, 0.25)" class="w-6 h-6 rounded-full text-text-muted hover:text-orange flex items-center justify-center text-sm">+</button>
            </div>
            <button @click="remove(it.id)" class="w-7 h-7 rounded-md text-text-muted hover:text-red-500 flex items-center justify-center" aria-label="Remove">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div v-if="items.length === 0" class="py-12 text-center text-sm text-text-dim">
            No ingredients on this recipe yet.
          </div>
        </div>
      </div>

      <!-- RIGHT: live nutrition -->
      <div class="flex flex-col h-full overflow-hidden border-l border-glass-border bg-gradient-to-br from-orange/5 to-orange/10 dark:from-zinc-900/60 dark:to-zinc-900/30">
        <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div class="bg-background border border-glass-border rounded-[20px] p-[18px] shadow-[0_2px_12px_rgba(20,10,0,0.05)] dark:bg-white/5">
            <div class="flex items-center gap-2 font-montserrat font-extrabold text-[13px] text-text mb-1">
              <span class="w-[7px] h-[7px] rounded-full bg-green-500 shadow-[0_0_0_0_rgba(34,197,94,0.7)] animate-pulseDot"></span>
              Live Nutrition
            </div>
            <div class="text-[11px] text-text-dim mb-3.5">Updates as you tweak</div>

            <div class="text-center py-[18px] px-2 pb-3 rounded-2xl bg-gradient-to-br from-orange to-orange-light text-white shadow-[0_6px_20px_var(--orange-glow)] mb-3.5 transition-transform duration-300">
              <div class="font-montserrat font-black text-[38px] leading-none tracking-tight tabular-nums">{{ display.cals }}</div>
              <div class="text-[12px] font-semibold opacity-90 mt-1 uppercase tracking-widest">kcal / serving</div>
              <div class="text-[11px] font-bold mt-1.5 opacity-95 tabular-nums">
                {{ calDelta === 0 ? 'Same as original' : (calDelta > 0 ? `+${calDelta} vs original` : `${calDelta} vs original`) }}
              </div>
            </div>

            <div v-for="m in macros" :key="m.key" class="mb-2.5">
              <div class="flex items-center justify-between text-[11px] font-semibold text-text-muted mb-1.5">
                <span class="flex items-center gap-1">
                  {{ m.label }}
                  <span v-if="m.value - m.base > 0" class="text-red-500 text-[10px] ml-1">+{{ m.value - m.base }}{{ m.unit }}</span>
                  <span v-else-if="m.value - m.base < 0" class="text-green-500 text-[10px] ml-1">{{ m.value - m.base }}{{ m.unit }}</span>
                </span>
                <span class="tabular-nums"><strong class="font-bold text-text">{{ m.value }}</strong>{{ m.unit }}</span>
              </div>
              <div class="h-2 rounded-full bg-background-secondary overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300"
                  :style="{
                    width: `${Math.min(100, (m.value / m.max) * 100)}%`,
                    background: `linear-gradient(90deg, ${m.color}, ${m.color}aa)`,
                  }"></div>
              </div>
            </div>
          </div>

          <div class="mt-auto flex gap-2.5 pt-3.5">
            <button @click="reset" class="flex-1 py-3 rounded-xl border-1.5 border-glass-border bg-background-secondary text-text font-montserrat font-semibold text-[13px] hover:border-orange hover:text-orange transition-all">
              Reset
            </button>
            <button @click="close" class="flex-1 py-3 rounded-xl bg-gradient-to-br from-orange to-orange-light text-white font-montserrat font-bold text-[13px] inline-flex items-center justify-center gap-2 shadow-[0_4px_16px_var(--orange-glow)] hover:opacity-95 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              Save Version
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-modalIn { animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes pulseDot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
  50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
}
.animate-pulseDot { animation: pulseDot 1.6s infinite; }
</style>
