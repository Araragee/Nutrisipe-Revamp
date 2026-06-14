<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { ingredientsApi } from '@/http/endpoints/ingredients'
import { useUiStore } from '@/stores/ui'
import type { Ingredient } from '@/typescript/interface/Ingredient'
import StatCardModal from '@/components/StatCardModal.vue'

type Status = 'verified' | 'pending' | 'draft'
type Conv = { q: number; unit: string; g: number }
interface UiExtras {
  category: string
  status: Status
  allergens: string[]
  conv: Conv[]
  source: string
  verifiedBy: string
  verifiedDate: string
  description: string
  emoji: string
}

const uiStore = useUiStore()

const items = ref<Ingredient[]>([])
const loading = ref(true)
const search = ref('')
const cat = ref<'All' | string>('All')
const selectedId = ref<string | null>(null)
const draft = ref<Ingredient | null>(null)
const dirty = ref(false)
const isCreating = ref(false)
const isEditMode = ref(false)
const activeModal = ref<string | null>(null)

const CATEGORIES = ['All', 'Protein', 'Grain', 'Vegetable', 'Fruit', 'Dairy', 'Fat', 'Spice'] as const
const ALLERGEN_OPTS = ['Gluten', 'Dairy', 'Egg', 'Soy', 'Sesame', 'Tree nuts', 'Peanut', 'Fish', 'Shellfish'] as const
const UNIT_OPTS = ['g', 'cup', 'tbsp', 'tsp', 'medium', 'large', 'small', 'fillet', 'slice', 'piece'] as const

const STATUS_PILL: Record<Status, string> = {
  verified: 'bg-green-500/15 text-green-600 dark:text-green-400',
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  draft: 'bg-zinc-400/15 text-text-dim',
}

const extras = reactive<Map<string, UiExtras>>(new Map())
const draftExtras = ref<UiExtras>(blankExtras())

function blankExtras(): UiExtras {
  return {
    category: 'Vegetable',
    status: 'draft',
    allergens: [],
    conv: [{ q: 1, unit: 'cup', g: 100 }],
    source: '',
    verifiedBy: '',
    verifiedDate: '',
    description: '',
    emoji: '🥗',
  }
}

function autoStatus(it: Ingredient): Status {
  const hasMacros = it.energy > 0 && it.protein >= 0 && it.carb >= 0 && it.fat >= 0
  const hasMeta = !!it.alt_name && it.edible_portion > 0
  if (hasMacros && hasMeta) return 'verified'
  if (hasMacros) return 'pending'
  return 'draft'
}

function ensureExtras(it: Ingredient): UiExtras {
  const key = String(it.id)
  if (!extras.has(key)) {
    const e = blankExtras()
    e.status = autoStatus(it)
    e.description = it.alt_name ?? ''
    if (it.category) e.category = it.category
    if (it.source) e.source = it.source
    extras.set(key, e)
  }
  return extras.get(key)!
}

const emptyDraft = (): Ingredient => ({
  id: '',
  food_item: '',
  alt_name: '',
  category: 'Vegetable',
  edible_portion: 100,
  energy: 0, protein: 0, fat: 0, carb: 0,
  calcium: 0, phos: 0, iron: 0, vit_a: 0,
  thia: 0, ribo: 0, nia: 0, vit_c: 0,
  source: '',
})

const load = async () => {
  loading.value = true
  try {
    const res = await ingredientsApi.getAll({ all: 1 })
    const payload = (res.data as any)?.data ?? res.data
    items.value = Array.isArray(payload) ? payload : []
    items.value.forEach(ensureExtras)
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
    draftExtras.value = { ...ensureExtras(s) }
    dirty.value = false
    isCreating.value = false
    isEditMode.value = false
  }
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return items.value.filter(it => {
    const e = ensureExtras(it)
    if (cat.value !== 'All' && e.category !== cat.value) return false
    if (q && !(
      it.food_item.toLowerCase().includes(q) ||
      (it.alt_name ?? '').toLowerCase().includes(q)
    )) return false
    return true
  })
})

const stats = computed(() => {
  const total = items.value.length
  let verified = 0, pending = 0, draftN = 0
  items.value.forEach(it => {
    const s = ensureExtras(it).status
    if (s === 'verified') verified++
    else if (s === 'pending') pending++
    else draftN++
  })
  return { total, verified, pending, draft: draftN }
})

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

const setExtras = <K extends keyof UiExtras>(k: K, v: UiExtras[K]) => {
  draftExtras.value = { ...draftExtras.value, [k]: v }
  dirty.value = true
}

const toggleAllergen = (a: string) => {
  const has = draftExtras.value.allergens.includes(a)
  setExtras('allergens', has
    ? draftExtras.value.allergens.filter(x => x !== a)
    : [...draftExtras.value.allergens, a])
}

const updateConv = (idx: number, key: keyof Conv, val: string) => {
  const next = [...draftExtras.value.conv]
  next[idx] = {
    ...next[idx],
    [key]: key === 'unit' ? val : (Number(val) || 0),
  }
  setExtras('conv', next)
}
const addConv = () => setExtras('conv', [...draftExtras.value.conv, { q: 1, unit: 'cup', g: 100 }])
const removeConv = (idx: number) => setExtras('conv', draftExtras.value.conv.filter((_, i) => i !== idx))

const newItem = () => {
  draft.value = emptyDraft()
  draftExtras.value = blankExtras()
  selectedId.value = null
  isCreating.value = true
  isEditMode.value = true
  dirty.value = true
}

const save = async () => {
  if (!draft.value) return
  try {
    draft.value.category = draftExtras.value.category
    draft.value.source = draftExtras.value.source

    if (isCreating.value || !draft.value.id) {
      const { id: _omit, ...payload } = draft.value
      const res = await ingredientsApi.create(payload as any)
      const created = (res.data as any).data ?? res.data
      items.value = [...items.value, created]
      extras.set(String(created.id), { ...draftExtras.value, status: autoStatus(created) })
      selectedId.value = String(created.id)
      isCreating.value = false
      uiStore.showToast('Ingredient created', 'success')
    } else {
      const res = await ingredientsApi.update(String(draft.value.id), draft.value)
      const updated = (res.data as any).data ?? res.data
      items.value = items.value.map(i => String(i.id) === String(updated.id) ? updated : i)
      extras.set(String(updated.id), { ...draftExtras.value })
      uiStore.showToast('Saved', 'success')
    }
    dirty.value = false
  } catch {
    uiStore.showToast('Save failed', 'error')
  }
}

const csvInput = ref<HTMLInputElement | null>(null)

const triggerCsvInput = () => {
  csvInput.value?.click()
}

const handleCsvUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    const text = e.target?.result as string
    try {
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        uiStore.showToast('No valid ingredients found in CSV', 'error')
        return
      }
      
      const res = await ingredientsApi.bulkCreate(parsed)
      const count = (res.data as any)?.count ?? parsed.length
      uiStore.showToast(`Successfully imported ${count} ingredients`, 'success')
      
      await load()
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'CSV Import failed. Check format.'
      uiStore.showToast(errMsg, 'error')
    } finally {
      target.value = ''
    }
  }
  reader.readAsText(file)
}

function parseCSV(text: string): Partial<Ingredient>[] {
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
  const results: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    if (values.length < headers.length) continue

    const item: any = {}
    headers.forEach((header, index) => {
      let val = values[index]
      if (!val) return
      val = val.replace(/^["']|["']$/g, '').trim()
      
      if (header === 'food_item') {
        item.food_item = val
      } else if (header === 'alt_name') {
        item.alt_name = val || null
      } else if (header === 'category') {
        item.category = val || null
      } else if (header === 'source') {
        item.source = val || null
      } else {
        item[header] = val === '' ? 0 : Number(val) || 0
      }
    })

    if (item.food_item) {
      results.push(item)
    }
  }

  return results
}

const discard = () => {
  if (selected.value) {
    draft.value = { ...selected.value }
    draftExtras.value = { ...ensureExtras(selected.value) }
  } else {
    draft.value = emptyDraft()
    draftExtras.value = blankExtras()
  }
  dirty.value = false
  isEditMode.value = false
  if (isCreating.value) isCreating.value = false
}

const removeItem = async () => {
  if (!draft.value?.id || isCreating.value) return
  if (!confirm(`Delete "${draft.value.food_item}"?`)) return
  try {
    await ingredientsApi.delete(String(draft.value.id))
    extras.delete(String(draft.value.id))
    items.value = items.value.filter(i => String(i.id) !== String(draft.value!.id))
    selectedId.value = items.value[0] ? String(items.value[0].id) : null
    uiStore.showToast('Deleted', 'success')
  } catch {
    uiStore.showToast('Delete failed', 'error')
  }
}

const macroSwatches = [
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

const statCards = computed(() => [
  { id: 'total', lbl: 'Total ingredients', val: stats.value.total, sub: `+ ${Math.max(0, stats.value.total - 0)} curated`, color: '#FF6B35', tone: 'up' as const },
  { id: 'verified', lbl: 'Verified', val: stats.value.verified, sub: stats.value.total ? `${Math.round(stats.value.verified / stats.value.total * 100)}% of database` : '—', color: '#22c55e', tone: 'up' as const },
  { id: 'pending', lbl: 'Pending review', val: stats.value.pending, sub: 'needs your attention', color: '#f59e0b', tone: 'warn' as const },
  { id: 'draft', lbl: 'Drafts', val: stats.value.draft, sub: 'awaiting source', color: '#94a3b8', tone: 'warn' as const },
])

const modalItems = computed(() => {
  if (activeModal.value === 'total') return items.value
  if (activeModal.value === 'verified') return items.value.filter(i => ensureExtras(i).status === 'verified')
  if (activeModal.value === 'pending') return items.value.filter(i => ensureExtras(i).status === 'pending')
  if (activeModal.value === 'draft') return items.value.filter(i => ensureExtras(i).status === 'draft')
  return []
})

const modalTitle = computed(() => {
  const card = statCards.value.find(c => c.id === activeModal.value)
  return card ? card.lbl : ''
})

const handleModalSelect = (id: string) => {
  selectedId.value = id
  activeModal.value = null
}

const auditLog = [
  { who: 'Dr. Sarah Wong', avatar: 'https://i.pravatar.cc/64?img=47', action: 'Verified macros & micronutrient profile', time: '2 hours ago' },
  { who: 'M. Aydın, RD', avatar: 'https://i.pravatar.cc/64?img=12', action: 'Adjusted fiber from 2.5g → 2.8g per 100g', time: 'yesterday' },
  { who: 'System (USDA Sync)', avatar: 'https://i.pravatar.cc/64?img=68', action: 'Imported baseline values from USDA SR Legacy', time: 'Apr 18' },
]

const draftThumbChar = computed(() => (draft.value?.food_item || '?').charAt(0).toUpperCase())

onMounted(load)
</script>

<template>
  <div class="h-screen bg-background py-8 px-6 md:px-8 flex flex-col">
    <div class="max-w-[1480px] mx-auto flex-1 flex flex-col min-h-0 w-full">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange/10 text-orange text-[11px] font-bold uppercase tracking-widest mb-2.5 font-montserrat">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            Nutritionist console
          </div>
          <h1 class="font-montserrat font-black text-[32px] tracking-tight leading-tight text-text mb-1.5">Nutrition Database</h1>
          <p class="text-sm text-text-muted max-w-xl leading-relaxed">
            Curate and verify per-100g macro &amp; micronutrient values used across every recipe in Nutrisipe. Per FNRI &amp; USDA standards.
          </p>
        </div>
        <div class="flex gap-2.5">
          <input type="file" ref="csvInput" accept=".csv" @change="handleCsvUpload" class="hidden" />
          <button @click="triggerCsvInput" class="px-4 py-2.5 rounded-xl border-1.5 border-border bg-surface dark:bg-zinc-800 text-text font-montserrat font-bold text-[13px] inline-flex items-center gap-2 transition-all hover:border-orange hover:text-orange">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import CSV
          </button>
          <button @click="newItem" class="px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-deep text-white font-montserrat font-bold text-[13px] inline-flex items-center gap-2 hover:opacity-95 hover:-translate-y-0.5 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Ingredient
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div v-for="s in statCards" :key="s.lbl" @click="activeModal = s.id" class="p-4 rounded-2xl bg-surface dark:bg-zinc-800/40 border border-border relative overflow-hidden cursor-pointer hover:border-orange transition-all">
          <div class="flex items-center gap-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-text-dim font-montserrat">
            <span class="w-[22px] h-[22px] rounded-lg inline-flex items-center justify-center" :style="{ background: s.color + '22', color: s.color }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </span>
            {{ s.lbl }}
          </div>
          <div class="font-montserrat font-black text-[28px] tracking-tight text-text leading-none">{{ s.val }}</div>
          <div class="text-[11px] font-bold mt-1.5" :class="s.tone === 'up' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">{{ s.sub }}</div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Master-detail -->
      <div v-else class="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-3.5 flex-1 min-h-0">
        <!-- LEFT: list card -->
        <aside class="bg-surface dark:bg-zinc-800/40 border border-border rounded-[22px] overflow-hidden flex flex-col min-h-0">
          <div class="p-3.5 border-b border-border">
            <div class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-background-secondary border-1.5 border-transparent focus-within:border-orange focus-within:bg-background transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="text-text-dim shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="search" type="text" placeholder="Search ingredient or alias…" class="flex-1 bg-transparent border-none outline-none text-[13px] text-text font-inter" />
            </div>
          </div>

          <!-- Category filter chips -->
          <div class="flex gap-1.5 px-3.5 py-2.5 border-b border-border overflow-x-auto scrollbar-hide">
            <button
              v-for="c in CATEGORIES" :key="c"
              @click="cat = c"
              :class="[
                'shrink-0 px-3 py-1.5 rounded-full border font-montserrat font-bold text-[11px] transition-all',
                cat === c
                  ? 'bg-orange border-orange text-white'
                  : 'bg-transparent border-border text-text-muted hover:text-orange hover:border-orange',
              ]"
            >{{ c }}</button>
          </div>

          <div class="flex-1 overflow-y-auto p-1.5">
            <button
              v-for="it in filtered" :key="it.id"
              @click="selectedId = String(it.id)"
              :class="[
                'w-full grid grid-cols-[36px_1fr_auto] gap-2.5 items-center p-2.5 rounded-xl text-left transition-all border-1.5',
                selectedId === String(it.id)
                  ? 'bg-orange/10 border-orange'
                  : 'border-transparent hover:bg-background-secondary',
              ]"
            >
              <div class="w-9 h-9 rounded-[10px] bg-background-secondary border border-border flex items-center justify-center text-lg shrink-0">
                {{ ensureExtras(it).emoji }}
              </div>
              <div class="min-w-0">
                <div class="text-[13px] font-bold text-text truncate">{{ it.food_item }}</div>
                <div class="text-[11px] text-text-dim mt-0.5 truncate">{{ it.energy }} kcal · {{ ensureExtras(it).category }}</div>
              </div>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-montserrat font-bold text-[9.5px] uppercase tracking-wider"
                :class="STATUS_PILL[ensureExtras(it).status]">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ ensureExtras(it).status }}
              </span>
            </button>
            <div v-if="filtered.length === 0" class="py-10 text-center text-[13px] text-text-dim">No ingredients match.</div>
          </div>
        </aside>

        <!-- RIGHT: editor card -->
        <section v-if="draft" class="bg-surface dark:bg-zinc-800/40 border border-border rounded-[22px] overflow-hidden flex flex-col relative min-h-0">
          <!-- Editor head -->
          <div class="flex items-center gap-4 p-5 border-b border-border">
            <div class="w-16 h-16 rounded-2xl bg-background-secondary border border-border flex items-center justify-center text-3xl shrink-0">
              {{ draftExtras.emoji || draftThumbChar }}
            </div>
            <div class="flex-1 min-w-0">
              <input
                v-if="isEditMode"
                :value="draft.food_item"
                @input="setField('food_item', ($event.target as HTMLInputElement).value)"
                class="w-full bg-transparent border-none outline-none font-montserrat font-extrabold text-[22px] tracking-tight text-text border-b-1.5 border-dashed border-transparent focus:border-orange py-1"
                placeholder="Ingredient name"
              />
              <div v-else class="w-full font-montserrat font-extrabold text-[22px] tracking-tight text-text py-1 border-b-1.5 border-transparent">{{ draft.food_item || 'Unnamed Ingredient' }}</div>
              <div class="flex items-center gap-2 text-[11px] text-text-dim mt-1 font-montserrat">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9.5px] uppercase tracking-wider"
                  :class="STATUS_PILL[draftExtras.status]">
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{ draftExtras.status }}
                </span>
                <span v-if="!isCreating">· ID {{ draft.id }}</span>
                <span>· per 100g basis</span>
              </div>
            </div>
            <div class="flex gap-2 ml-auto">
              <button @click="isEditMode = !isEditMode" class="w-9 h-9 rounded-[10px] border-1.5 border-border text-text-muted transition-all flex items-center justify-center" :class="isEditMode ? 'border-orange text-orange bg-orange/10' : 'hover:border-orange hover:text-orange'" title="Edit mode">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
              <button class="w-9 h-9 rounded-[10px] border-1.5 border-border text-text-muted hover:border-orange hover:text-orange transition-all flex items-center justify-center" title="View as recipe ingredient">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </button>
              <button v-if="!isCreating && isEditMode" @click="removeItem" class="w-9 h-9 rounded-[10px] border-1.5 border-border text-text-muted hover:border-red-500 hover:text-red-500 transition-all flex items-center justify-center" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          </div>

          <!-- Editor body -->
          <div class="flex-1 overflow-y-auto p-5 md:p-6 space-y-7 pb-32">
            <!-- Identity -->
            <div>
              <div class="flex items-center justify-between font-montserrat font-extrabold text-[12px] uppercase tracking-wider text-text mb-3.5">Identity</div>
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Category</label>
                  <select v-if="isEditMode" :value="draftExtras.category" @change="setExtras('category', ($event.target as HTMLSelectElement).value)"
                    class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all">
                    <option v-for="c in CATEGORIES.filter(c => c !== 'All')" :key="c">{{ c }}</option>
                  </select>
                  <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px]">{{ draftExtras.category || '—' }}</div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</label>
                  <select v-if="isEditMode" :value="draftExtras.status" @change="setExtras('status', ($event.target as HTMLSelectElement).value as Status)"
                    class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all">
                    <option value="draft">Draft</option>
                    <option value="pending">Pending review</option>
                    <option value="verified">Verified</option>
                  </select>
                  <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px] capitalize">{{ draftExtras.status || '—' }}</div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Emoji</label>
                  <input v-if="isEditMode" :value="draftExtras.emoji" @input="setExtras('emoji', ($event.target as HTMLInputElement).value)"
                    class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all" />
                  <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px]">{{ draftExtras.emoji || '—' }}</div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Edible portion (%)</label>
                  <input v-if="isEditMode" type="number" step="0.1" min="0" max="100"
                    :value="draft.edible_portion"
                    @input="setNum('edible_portion', ($event.target as HTMLInputElement).value)"
                    class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all" />
                  <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px]">{{ draft.edible_portion }}%</div>
                </div>
              </div>
              <div class="flex flex-col gap-1.5 mb-3">
                <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Aliases &amp; alternate names</label>
                <input v-if="isEditMode" :value="draft.alt_name || ''" @input="setField('alt_name', ($event.target as HTMLInputElement).value)" placeholder="comma-separated"
                  class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all" />
                <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px]">{{ draft.alt_name || '—' }}</div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Description</label>
                <textarea v-if="isEditMode" :value="draftExtras.description" @input="setExtras('description', ($event.target as HTMLTextAreaElement).value)" rows="2"
                  class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all resize-y min-h-[70px]"></textarea>
                <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px] min-h-[70px] whitespace-pre-wrap">{{ draftExtras.description || '—' }}</div>
              </div>
            </div>

            <!-- Nutrition per 100g -->
            <div>
              <div class="flex items-center justify-between font-montserrat font-extrabold text-[12px] uppercase tracking-wider text-text mb-3.5">
                Nutrition per 100g
                <span class="font-medium normal-case tracking-normal text-[10px] text-text-dim">FNRI/USDA-compatible · g unless noted</span>
              </div>
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="flex flex-col gap-1.5 relative">
                  <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Energy</label>
                  <input v-if="isEditMode" type="number" :value="draft.energy" @input="setNum('energy', ($event.target as HTMLInputElement).value)"
                    class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 pr-12 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all" />
                  <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px]">{{ draft.energy }} <span class="text-xs text-text-dim">kcal</span></div>
                  <span v-if="isEditMode" class="absolute right-3.5 bottom-2.5 text-xs font-bold text-text-dim pointer-events-none">kcal</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Edible portion</label>
                  <input v-if="isEditMode" type="number" step="0.1" :value="draft.edible_portion" @input="setNum('edible_portion', ($event.target as HTMLInputElement).value)"
                    class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all" />
                  <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px]">{{ draft.edible_portion }}%</div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                <div v-for="m in macroSwatches" :key="m.k"
                  class="p-3 px-3.5 rounded-[14px] bg-background-secondary border border-border focus-within:border-orange transition-colors">
                  <div class="flex items-center gap-2 text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    <span class="w-2 h-2 rounded-full" :style="{ background: m.color }"></span>{{ m.lbl }}
                  </div>
                  <div class="flex items-baseline gap-1">
                    <input v-if="isEditMode" type="number" step="0.1" :value="(draft as any)[m.k]" @input="setNum(m.k as keyof Ingredient, ($event.target as HTMLInputElement).value)"
                      class="w-full bg-transparent border-none outline-none font-montserrat font-extrabold text-[22px] text-text" />
                    <div v-else class="w-full font-montserrat font-extrabold text-[22px] text-text">{{ (draft as any)[m.k] }}</div>
                    <span class="text-xs font-bold text-text-dim">{{ m.unit }}</span>
                  </div>
                </div>
              </div>

              <!-- Atwater cross-check -->
              <div class="flex items-center gap-3 p-3 px-3.5 rounded-[14px] border border-border" :style="{ background: 'linear-gradient(135deg, var(--orange-soft), transparent)' }">
                <span class="w-8 h-8 rounded-[10px] bg-orange text-white flex items-center justify-center shrink-0">
                  <svg v-if="atwater.ok" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </span>
                <div class="flex-1 text-xs text-text-muted leading-snug">
                  <strong class="text-text font-montserrat">Atwater cross-check:</strong>
                  Macros compute to <strong class="text-text">{{ atwater.kcal }} kcal</strong>; declared is {{ draft.energy }} kcal.
                </div>
                <span class="font-montserrat font-extrabold text-[13px] tabular-nums" :class="atwater.ok ? 'text-green-600 dark:text-green-400' : 'text-orange'">
                  {{ atwater.delta === 0 ? 'Match' : (atwater.delta > 0 ? `+${atwater.delta}` : atwater.delta) }} kcal
                </span>
              </div>
            </div>

            <!-- Unit conversions -->
            <div>
              <div class="flex items-center justify-between font-montserrat font-extrabold text-[12px] uppercase tracking-wider text-text mb-3.5">
                Unit conversions
                <span class="font-medium normal-case tracking-normal text-[10px] text-text-dim">Used by recipe ingredient parser</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <div v-for="(row, idx) in draftExtras.conv" :key="idx"
                  class="grid grid-cols-[1fr_28px_1fr_32px] gap-2 items-center px-2.5 py-2 rounded-[11px] bg-background-secondary">
                  <div class="flex items-center gap-1.5">
                    <input v-if="isEditMode" type="number" step="0.25" :value="row.q" @input="updateConv(idx, 'q', ($event.target as HTMLInputElement).value)"
                      class="w-[50px] text-right bg-transparent border-none outline-none text-xs font-bold text-text font-inter px-1.5 py-1 rounded-md focus:bg-background" />
                    <div v-else class="text-xs font-bold text-text text-right w-[50px]">{{ row.q }}</div>
                    
                    <select v-if="isEditMode" :value="row.unit" @change="updateConv(idx, 'unit', ($event.target as HTMLSelectElement).value)"
                      class="bg-transparent border-none outline-none text-xs font-bold text-text font-inter px-1.5 py-1 rounded-md focus:bg-background">
                      <option v-for="u in UNIT_OPTS" :key="u">{{ u }}</option>
                    </select>
                    <div v-else class="text-xs font-bold text-text">{{ row.unit }}</div>
                  </div>
                  <div class="text-xs font-extrabold text-text-dim text-center font-montserrat">=</div>
                  <div class="flex items-center gap-1.5">
                    <input v-if="isEditMode" type="number" :value="row.g" @input="updateConv(idx, 'g', ($event.target as HTMLInputElement).value)"
                      class="w-[70px] text-right bg-transparent border-none outline-none text-xs font-bold text-text font-inter px-1.5 py-1 rounded-md focus:bg-background" />
                    <div v-else class="text-xs font-bold text-text text-right w-[70px]">{{ row.g }}</div>
                    <span class="text-[11px] font-bold text-text-dim">grams</span>
                  </div>
                  <button v-if="isEditMode" @click="removeConv(idx)" class="w-7 h-7 rounded-[10px] border-1.5 border-border text-text-muted hover:border-red-500 hover:text-red-500 transition-all flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <div v-else></div>
                </div>
                <button v-if="isEditMode" @click="addConv" class="px-3 py-2.5 rounded-[11px] border-1.5 border-dashed border-border bg-transparent text-text-muted text-xs font-bold font-montserrat inline-flex items-center justify-center gap-1.5 hover:border-orange hover:border-solid hover:text-orange transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add conversion
                </button>
              </div>
            </div>

            <!-- Allergens -->
            <div>
              <div class="font-montserrat font-extrabold text-[12px] uppercase tracking-wider text-text mb-3.5">Allergens &amp; flags</div>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="a in ALLERGEN_OPTS" :key="a" @click="isEditMode ? toggleAllergen(a) : null"
                  :class="[
                    'px-3 py-1.5 rounded-full border-1.5 font-montserrat font-semibold text-[11px] transition-all',
                    draftExtras.allergens.includes(a)
                      ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
                      : (isEditMode ? 'bg-transparent border-border text-text-muted hover:border-red-500 hover:text-red-500' : 'bg-transparent border-border text-text-muted opacity-60 cursor-default'),
                  ]">{{ a }}</button>
              </div>
            </div>

            <!-- Source & audit -->
            <div>
              <div class="font-montserrat font-extrabold text-[12px] uppercase tracking-wider text-text mb-3.5">Source &amp; audit trail</div>
              <div class="flex flex-col gap-1.5 mb-3">
                <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Primary source / citation</label>
                <input v-if="isEditMode" :value="draftExtras.source" @input="setExtras('source', ($event.target as HTMLInputElement).value)" placeholder="e.g. USDA SR Legacy 20137"
                  class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all" />
                <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px]">{{ draftExtras.source || '—' }}</div>
              </div>
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Last verified by</label>
                  <input v-if="isEditMode" :value="draftExtras.verifiedBy" @input="setExtras('verifiedBy', ($event.target as HTMLInputElement).value)"
                    class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all" />
                  <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px]">{{ draftExtras.verifiedBy || '—' }}</div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Verification date</label>
                  <input v-if="isEditMode" :value="draftExtras.verifiedDate" @input="setExtras('verifiedDate', ($event.target as HTMLInputElement).value)"
                    class="bg-background-secondary border-1.5 border-transparent rounded-[11px] px-3.5 py-2.5 text-[13px] text-text font-inter outline-none focus:border-orange focus:bg-background transition-all" />
                  <div v-else class="px-3.5 py-2.5 text-[13px] text-text font-inter bg-background-secondary/40 rounded-[11px]">{{ draftExtras.verifiedDate || '—' }}</div>
                </div>
              </div>
              <div class="mt-3.5">
                <div v-for="a in auditLog" :key="a.who + a.time" class="flex items-center gap-2.5 py-2.5 border-b border-dashed border-border last:border-0 text-xs">
                  <div class="w-6 h-6 rounded-full overflow-hidden bg-orange/10 shrink-0">
                    <img :src="a.avatar" alt="" class="w-full h-full object-cover" />
                  </div>
                  <div class="flex-1 text-text-muted"><strong class="text-text font-bold">{{ a.who }}</strong> — {{ a.action }}</div>
                  <div class="text-text-dim text-[11px]">{{ a.time }}</div>
                </div>
              </div>
            </div>

            <!-- Micronutrients -->
            <div>
              <div class="font-montserrat font-extrabold text-[12px] uppercase tracking-wider text-text mb-3.5">Micronutrients per 100g</div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div v-for="m in micros" :key="m.k" class="p-2.5 rounded-[11px] bg-background-secondary border border-border focus-within:border-orange transition-colors">
                  <label class="block text-[9.5px] font-bold uppercase tracking-wider text-text-dim mb-1">{{ m.lbl }}</label>
                  <div class="flex items-baseline gap-1.5">
                    <input v-if="isEditMode" type="number" step="0.01" min="0" :value="(draft as any)[m.k]" @input="setNum(m.k as keyof Ingredient, ($event.target as HTMLInputElement).value)"
                      class="w-full bg-transparent border-none outline-none font-montserrat font-bold text-[15px] text-text" />
                    <div v-else class="w-full font-montserrat font-bold text-[15px] text-text">{{ (draft as any)[m.k] }}</div>
                    <span class="text-[10px] font-bold text-text-dim shrink-0">{{ m.unit }}</span>
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
            <div v-if="dirty"
              class="absolute left-0 right-0 bottom-0 z-10 flex items-center gap-3 px-6 py-3.5 border-t border-border"
              :style="{ background: 'color-mix(in oklch, var(--bg) 75%, transparent)' }">
              <div class="flex-1 text-[13px] text-text-muted">
                You have <strong class="text-text font-montserrat">unsaved changes</strong>{{ draft.food_item ? ` on ${draft.food_item}` : '' }}.
              </div>
              <button @click="discard" class="px-4 py-2.5 rounded-[11px] border-1.5 border-border bg-transparent text-text font-montserrat font-bold text-xs hover:border-orange hover:text-orange transition-all">Discard</button>
              <button @click="save" class="px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-deep text-white font-montserrat font-bold text-[13px] inline-flex items-center gap-1.5 hover:opacity-95 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {{ isCreating ? 'Create' : `Save & ${draftExtras.status === 'verified' ? 'keep verified' : 'submit'}` }}
              </button>
            </div>
          </transition>
        </section>

        <section v-else class="bg-surface dark:bg-zinc-800/40 border border-border rounded-[22px] p-12 text-center text-text-dim flex items-center justify-center min-h-0">
          Pick an ingredient to begin editing.
        </section>
      </div>
      
      <StatCardModal
        :title="modalTitle"
        :items="modalItems"
        :extras="extras"
        :is-open="activeModal !== null"
        @close="activeModal = null"
        @select="handleModalSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { scrollbar-width: none; }
</style>
