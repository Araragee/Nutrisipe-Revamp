<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ingredientsApi } from '@/http/endpoints/ingredients'
import { useUiStore } from '@/stores/ui'
import type { Ingredient } from '@/typescript/interface/Ingredient'

const uiStore = useUiStore()

const items = ref<Ingredient[]>([])
const loading = ref(true)
const search = ref('')
const selectedId = ref<string | null>(null)
const draft = ref<Ingredient | null>(null)
const dirty = ref(false)
const isCreating = ref(false)

const emptyDraft = (): Ingredient => ({
  id: '',
  food_item: '',
  alt_name: '',
  edible_portion: 100,
  energy: 0, protein: 0, fat: 0, carb: 0,
  calcium: 0, phos: 0, iron: 0, vit_a: 0,
  thia: 0, ribo: 0, nia: 0, vit_c: 0,
})

const load = async () => {
  loading.value = true
  try {
    const res = await ingredientsApi.getAll({ all: 1 })
    const payload = (res.data as any)?.data ?? res.data
    items.value = Array.isArray(payload) ? payload : []
    if (items.value.length && !selectedId.value) {
      selectedId.value = String(items.value[0].id)
    }
  } catch {
    uiStore.showToast('Failed to load ingredients', 'error')
  } finally {
    loading.value = false
  }
}

const selected = computed<Ingredient | null>(() =>
  items.value.find(i => String(i.id) === selectedId.value) ?? null,
)

watch(selected, s => {
  if (s) {
    draft.value = { ...s }
    dirty.value = false
    isCreating.value = false
  }
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(it =>
    it.food_item.toLowerCase().includes(q) ||
    (it.alt_name ?? '').toLowerCase().includes(q),
  )
})

const stats = computed(() => {
  const total = items.value.length
  const withMacros = items.value.filter(i => i.energy > 0 && i.protein >= 0).length
  const incomplete = items.value.filter(i => !i.energy || i.edible_portion === 0).length
  const draftCount = items.value.filter(i => !i.alt_name).length
  return { total, verified: withMacros, pending: incomplete, draft: draftCount }
})

// Atwater cross-check
const atwater = computed(() => {
  if (!draft.value) return { kcal: 0, delta: 0, ok: true }
  const calc = draft.value.protein * 4 + draft.value.carb * 4 + draft.value.fat * 9
  const delta = Math.round(calc - Number(draft.value.energy))
  return { kcal: Math.round(calc), delta, ok: Math.abs(delta) <= 8 }
})

const setField = <K extends keyof Ingredient>(k: K, v: Ingredient[K]) => {
  if (!draft.value) return
  draft.value = { ...draft.value, [k]: v }
  dirty.value = true
}

const setNum = (k: keyof Ingredient, raw: string) => {
  const v = raw === '' ? 0 : Number(raw)
  setField(k, (Number.isFinite(v) ? v : 0) as never)
}

const newItem = () => {
  draft.value = emptyDraft()
  selectedId.value = null
  isCreating.value = true
  dirty.value = true
}

const save = async () => {
  if (!draft.value) return
  try {
    if (isCreating.value || !draft.value.id) {
      const { id: _omit, ...payload } = draft.value
      const res = await ingredientsApi.create(payload as any)
      const created = (res.data as any).data ?? res.data
      items.value = [...items.value, created]
      selectedId.value = String(created.id)
      isCreating.value = false
      uiStore.showToast('Ingredient created', 'success')
    } else {
      const res = await ingredientsApi.update(String(draft.value.id), draft.value)
      const updated = (res.data as any).data ?? res.data
      items.value = items.value.map(i => String(i.id) === String(updated.id) ? updated : i)
      uiStore.showToast('Saved', 'success')
    }
    dirty.value = false
  } catch {
    uiStore.showToast('Save failed', 'error')
  }
}

const discard = () => {
  if (selected.value) draft.value = { ...selected.value }
  else draft.value = emptyDraft()
  dirty.value = false
  if (isCreating.value) isCreating.value = false
}

const removeItem = async () => {
  if (!draft.value?.id || isCreating.value) return
  if (!confirm(`Delete "${draft.value.food_item}"?`)) return
  try {
    await ingredientsApi.delete(String(draft.value.id))
    items.value = items.value.filter(i => String(i.id) !== String(draft.value!.id))
    selectedId.value = items.value[0] ? String(items.value[0].id) : null
    uiStore.showToast('Deleted', 'success')
  } catch {
    uiStore.showToast('Delete failed', 'error')
  }
}

const macros = [
  { k: 'protein', lbl: 'Protein', unit: 'g', color: '#4ECDC4' },
  { k: 'carb', lbl: 'Carbs', unit: 'g', color: '#FFE66D' },
  { k: 'fat', lbl: 'Fat', unit: 'g', color: '#FF6B8A' },
] as const

const micros = [
  { k: 'calcium', lbl: 'Calcium', unit: 'mg' },
  { k: 'phos', lbl: 'Phosphorus', unit: 'mg' },
  { k: 'iron', lbl: 'Iron', unit: 'mg' },
  { k: 'vit_a', lbl: 'Vitamin A', unit: 'mcg' },
  { k: 'thia', lbl: 'Thiamin', unit: 'mg' },
  { k: 'ribo', lbl: 'Riboflavin', unit: 'mg' },
  { k: 'nia', lbl: 'Niacin', unit: 'mg NE' },
  { k: 'vit_c', lbl: 'Vitamin C', unit: 'mg' },
] as const

onMounted(load)
</script>

<template>
  <div class="ingredients-view min-h-screen bg-background py-10 px-6 md:px-10">
    <div class="max-w-[1480px] mx-auto">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-orange mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Nutritionist console
          </div>
          <h1 class="font-montserrat font-extrabold text-3xl tracking-tight mb-1">Nutrition Database</h1>
          <p class="text-sm text-text-dim max-w-2xl">
            Curate and verify per-100g macro &amp; micronutrient values used across every recipe in Nutrisipe. Per FNRI &amp; PhilFCT standards.
          </p>
        </div>
        <div class="flex gap-3">
          <button class="px-4 py-2.5 rounded-xl border-1.5 border-glass-border text-sm font-bold text-text-muted hover:border-orange hover:text-orange transition-all flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import CSV
          </button>
          <button @click="newItem" class="px-4 py-2.5 rounded-xl bg-orange text-white text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Ingredient
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="s in [
          {lbl:'Total ingredients', val: stats.total, color:'#FF6B35', sub:'curated entries'},
          {lbl:'With macros', val: stats.verified, color:'#22c55e', sub:'energy + protein + carbs + fat'},
          {lbl:'Incomplete', val: stats.pending, color:'#f59e0b', sub:'needs your attention'},
          {lbl:'Missing alt name', val: stats.draft, color:'#94a3b8', sub:'awaiting metadata'},
        ]" :key="s.lbl" class="p-5 bg-background-secondary border-1.5 border-glass-border rounded-2xl">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-6 h-6 rounded-md flex items-center justify-center" :style="{ background: s.color + '22', color: s.color }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </span>
            <span class="text-[10px] font-bold uppercase tracking-widest text-text-dim">{{ s.lbl }}</span>
          </div>
          <div class="font-montserrat font-extrabold text-3xl">{{ s.val }}</div>
          <div class="text-[11px] text-text-dim mt-1">{{ s.sub }}</div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Master-detail -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <!-- LEFT: list -->
        <aside class="bg-background-secondary border-1.5 border-glass-border rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-360px)] min-h-[480px]">
          <div class="p-3 border-b border-glass-border">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                v-model="search"
                type="text"
                placeholder="Search ingredient or alias..."
                class="w-full pl-9 pr-3 py-2.5 bg-background border border-glass-border rounded-xl text-sm outline-none focus:border-orange transition-all"
              />
            </div>
          </div>
          <div class="overflow-y-auto flex-1 p-2 space-y-1">
            <button
              v-for="it in filtered"
              :key="it.id"
              @click="selectedId = String(it.id)"
              :class="[
                'w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all',
                selectedId === String(it.id)
                  ? 'bg-orange/10 border border-orange/30'
                  : 'border border-transparent hover:bg-background',
              ]"
            >
              <div class="w-8 h-8 rounded-lg bg-background flex items-center justify-center font-bold text-orange shrink-0">
                {{ it.food_item.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-bold truncate">{{ it.food_item }}</div>
                <div class="text-[11px] text-text-dim truncate">{{ it.energy }} kcal · {{ it.alt_name || '—' }}</div>
              </div>
            </button>
            <div v-if="filtered.length === 0" class="py-10 text-center text-sm text-text-dim">
              No ingredients match.
            </div>
          </div>
        </aside>

        <!-- RIGHT: editor -->
        <section v-if="draft" class="bg-background-secondary border-1.5 border-glass-border rounded-2xl flex flex-col relative">
          <!-- Editor head -->
          <div class="p-5 border-b border-glass-border flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-background flex items-center justify-center font-montserrat font-extrabold text-xl text-orange shrink-0">
              {{ (draft.food_item || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <input
                :value="draft.food_item"
                @input="setField('food_item', ($event.target as HTMLInputElement).value)"
                class="w-full bg-transparent border-none outline-none font-montserrat font-extrabold text-xl tracking-tight"
                placeholder="Ingredient name"
              />
              <div class="flex items-center gap-2 text-[11px] text-text-dim mt-0.5">
                <span class="px-2 py-0.5 rounded-full bg-orange/10 text-orange font-bold uppercase tracking-wider text-[10px]">
                  {{ isCreating ? 'New' : 'Editing' }}
                </span>
                <span v-if="!isCreating">· ID {{ draft.id }}</span>
                <span>· per 100g basis</span>
              </div>
            </div>
            <button
              v-if="!isCreating"
              @click="removeItem"
              class="w-9 h-9 rounded-lg border border-glass-border text-text-muted hover:text-red-500 hover:border-red-500/40 flex items-center justify-center transition-all"
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-5 space-y-6 pb-24">
            <!-- Identity -->
            <div>
              <div class="text-[11px] font-bold uppercase tracking-widest text-text-dim mb-3">Identity</div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Edible portion (%)</label>
                  <input
                    type="number" step="0.1" min="0" max="100"
                    :value="draft.edible_portion"
                    @input="setNum('edible_portion', ($event.target as HTMLInputElement).value)"
                    class="w-full px-3 py-2.5 bg-background border border-glass-border rounded-xl text-sm outline-none focus:border-orange"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Aliases &amp; alt name</label>
                  <input
                    type="text"
                    :value="draft.alt_name || ''"
                    @input="setField('alt_name', ($event.target as HTMLInputElement).value)"
                    placeholder="comma-separated"
                    class="w-full px-3 py-2.5 bg-background border border-glass-border rounded-xl text-sm outline-none focus:border-orange"
                  />
                </div>
              </div>
            </div>

            <!-- Nutrition per 100g -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="text-[11px] font-bold uppercase tracking-widest text-text-dim">Nutrition per 100g</span>
                <span class="text-[10px] text-text-dim">FNRI-compatible · g unless noted</span>
              </div>

              <div class="mb-3">
                <label class="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Energy</label>
                <div class="relative">
                  <input
                    type="number" step="1" min="0"
                    :value="draft.energy"
                    @input="setNum('energy', ($event.target as HTMLInputElement).value)"
                    class="w-full pl-3 pr-14 py-2.5 bg-background border border-glass-border rounded-xl text-sm outline-none focus:border-orange"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-text-dim">kcal</span>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3 mb-4">
                <div v-for="m in macros" :key="m.k" class="p-3 bg-background border border-glass-border rounded-xl">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="w-2.5 h-2.5 rounded-sm" :style="{ background: m.color }"></span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-text-dim">{{ m.lbl }}</span>
                  </div>
                  <div class="flex items-baseline gap-1.5">
                    <input
                      type="number" step="0.1" min="0"
                      :value="(draft as any)[m.k]"
                      @input="setNum(m.k as keyof Ingredient, ($event.target as HTMLInputElement).value)"
                      class="w-full bg-transparent border-none outline-none font-montserrat font-extrabold text-2xl"
                    />
                    <span class="text-xs font-bold text-text-dim">{{ m.unit }}</span>
                  </div>
                </div>
              </div>

              <!-- Atwater cross-check -->
              <div class="flex items-center gap-3 p-3 rounded-xl border" :class="atwater.ok ? 'bg-green-500/5 border-green-500/30' : 'bg-amber-500/5 border-amber-500/30'">
                <span class="w-7 h-7 rounded-md flex items-center justify-center shrink-0" :class="atwater.ok ? 'bg-green-500/15 text-green-500' : 'bg-amber-500/15 text-amber-500'">
                  <svg v-if="atwater.ok" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </span>
                <div class="flex-1 text-xs text-text-muted leading-relaxed">
                  <strong>Atwater cross-check:</strong> Macros compute to <strong>{{ atwater.kcal }} kcal</strong>; declared is {{ draft.energy }} kcal.
                </div>
                <span class="text-xs font-bold tabular-nums" :class="atwater.ok ? 'text-green-600' : 'text-amber-600'">
                  {{ atwater.delta === 0 ? 'Match' : (atwater.delta > 0 ? `+${atwater.delta}` : atwater.delta) }} kcal
                </span>
              </div>
            </div>

            <!-- Micronutrients -->
            <div>
              <div class="text-[11px] font-bold uppercase tracking-widest text-text-dim mb-3">Micronutrients per 100g</div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div v-for="m in micros" :key="m.k" class="p-2.5 bg-background border border-glass-border rounded-lg">
                  <label class="block text-[9px] font-bold uppercase tracking-wider text-text-dim mb-1">{{ m.lbl }}</label>
                  <div class="relative">
                    <input
                      type="number" step="0.01" min="0"
                      :value="(draft as any)[m.k]"
                      @input="setNum(m.k as keyof Ingredient, ($event.target as HTMLInputElement).value)"
                      class="w-full pr-10 py-1.5 bg-transparent border-none outline-none font-bold text-sm"
                    />
                    <span class="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-dim">{{ m.unit }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Save bar -->
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            leave-active-class="transition-all duration-150 ease-in"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="dirty"
              class="absolute left-3 right-3 bottom-3 flex items-center gap-3 p-3 px-4 bg-background border-1.5 border-orange/40 rounded-xl shadow-lg"
            >
              <div class="text-xs flex-1">
                You have <strong>unsaved changes</strong>{{ draft.food_item ? ` on ${draft.food_item}` : '' }}.
              </div>
              <button @click="discard" class="px-3 py-2 rounded-lg text-xs font-bold text-text-muted hover:text-text">Discard</button>
              <button @click="save" class="px-4 py-2 rounded-lg bg-orange text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {{ isCreating ? 'Create' : 'Save' }}
              </button>
            </div>
          </transition>
        </section>

        <section v-else class="bg-background-secondary border-1.5 border-glass-border rounded-2xl p-12 text-center text-text-dim">
          Pick an ingredient to begin editing.
        </section>
      </div>
    </div>
  </div>
</template>
