<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { variationsApi } from '@/http/endpoints/variations'
import { postsApi } from '@/http/endpoints/posts'
import type { Post } from '@/typescript/interface/Post'

const route = useRoute()
const router = useRouter()
const variationPost = ref<Post | null>(null)
const originalPost = ref<Post | null>(null)
const loading = ref(true)

async function loadData() {
  const id = route.params.id as string
  try {
    const [varRes, origRes] = await Promise.all([
      postsApi.getById(id),
      variationsApi.getOriginal(id)
    ])
    variationPost.value = varRes.data.data as Post
    const data = origRes.data.data as any
    originalPost.value = data.originalPost
  } catch (error) {
    logger.error('Failed to load variation comparison:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// ── Diff helpers ──────────────────────────────────────────────
const origIngredientNames = computed(
  () => new Set((originalPost.value?.recipe?.ingredients ?? []).map((i) => i.name.toLowerCase())),
)
const varIngredientNames = computed(
  () => new Set((variationPost.value?.recipe?.ingredients ?? []).map((i) => i.name.toLowerCase())),
)
const origStepTexts = computed(
  () => new Set((originalPost.value?.recipe?.instructions ?? []).map((s) => s.text.trim())),
)
const varStepTexts = computed(
  () => new Set((variationPost.value?.recipe?.instructions ?? []).map((s) => s.text.trim())),
)

function ingredientStatus(name: string, side: 'orig' | 'var'): 'same' | 'added' | 'removed' {
  const n = name.toLowerCase()
  if (side === 'var') return origIngredientNames.value.has(n) ? 'same' : 'added'
  return varIngredientNames.value.has(n) ? 'same' : 'removed'
}
function stepChanged(text: string, side: 'orig' | 'var'): boolean {
  const t = text.trim()
  return side === 'var' ? !origStepTexts.value.has(t) : !varStepTexts.value.has(t)
}

// Summary counts for the legend
const diffSummary = computed(() => {
  let added = 0
  let removed = 0
  for (const i of variationPost.value?.recipe?.ingredients ?? []) {
    if (!origIngredientNames.value.has(i.name.toLowerCase())) added++
  }
  for (const i of originalPost.value?.recipe?.ingredients ?? []) {
    if (!varIngredientNames.value.has(i.name.toLowerCase())) removed++
  }
  let changedSteps = 0
  for (const s of variationPost.value?.recipe?.instructions ?? []) {
    if (!origStepTexts.value.has(s.text.trim())) changedSteps++
  }
  return { added, removed, changedSteps }
})
</script>

<template>
  <div class="variation-view min-h-screen bg-background antialiased px-5 sm:px-8 pt-5 md:pt-12 pb-20">
    <div class="max-w-6xl mx-auto">
      <button @click="router.back()" class="mb-8 inline-flex items-center gap-2 h-9 text-text-dim font-montserrat font-bold text-xs uppercase tracking-widest transition-colors duration-200 ease-out hover:text-orange">
        <BaseIcons name="arrow-left" size="sm" /> Back
      </button>

      <div v-if="loading" class="flex justify-center py-24">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else-if="originalPost && variationPost">
         <!-- Header + legend -->
         <header class="mb-8">
            <p class="text-[11px] font-montserrat font-bold uppercase tracking-widest text-orange mb-1.5">Recipe Comparison</p>
            <h1 class="font-montserrat font-black text-3xl sm:text-4xl tracking-tight text-balance mb-5">What changed in this fork</h1>
            <div class="flex flex-wrap items-center gap-2.5">
               <span class="diff-legend bg-orange-soft text-orange-deep dark:text-orange-light">
                  <span class="w-2 h-2 rounded-full bg-orange"></span>
                  {{ diffSummary.added }} added
               </span>
               <span class="diff-legend bg-background-secondary text-text-muted border border-border">
                  <span class="w-2 h-2 rounded-full bg-text-dim/50"></span>
                  {{ diffSummary.removed }} removed
               </span>
               <span class="diff-legend bg-background-secondary text-text-muted border border-border">
                  <BaseIcons name="pencil" size="xs" />
                  {{ diffSummary.changedSteps }} step{{ diffSummary.changedSteps === 1 ? '' : 's' }} rewritten
               </span>
            </div>
         </header>

         <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            <!-- Original -->
            <section class="rounded-card border border-border bg-surface shadow-card overflow-hidden">
               <div class="p-5 sm:p-6 border-b border-border">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-background-secondary border border-border rounded-full text-[10px] font-montserrat font-bold uppercase tracking-widest text-text-dim mb-3">Original</span>
                  <h2 class="font-montserrat font-extrabold text-xl tracking-tight text-balance">{{ originalPost.title }}</h2>
                  <p class="text-xs text-text-dim mt-1 truncate">by {{ originalPost.user?.displayName || 'Anonymous' }}</p>
               </div>
               <div class="p-5 sm:p-6 space-y-7">
                  <div>
                     <h3 class="diff-heading">Ingredients</h3>
                     <ul class="space-y-1">
                        <li
                          v-for="(ing, i) in originalPost.recipe?.ingredients"
                          :key="i"
                          class="diff-row"
                          :class="ingredientStatus(ing.name, 'orig') === 'removed' ? 'diff-row--removed' : ''"
                        >
                           <span class="diff-marker" :class="ingredientStatus(ing.name, 'orig') === 'removed' ? 'diff-marker--removed' : 'diff-marker--same'"></span>
                           <span class="flex-1 min-w-0 truncate" :class="ingredientStatus(ing.name, 'orig') === 'removed' ? 'line-through' : ''">{{ ing.name }}</span>
                           <span class="text-text-dim tabular-nums whitespace-nowrap pl-2">{{ ing.quantity }}</span>
                        </li>
                        <li v-if="!originalPost.recipe?.ingredients?.length" class="text-sm text-text-dim italic py-2">No ingredients.</li>
                     </ul>
                  </div>
                  <div>
                     <h3 class="diff-heading">Method</h3>
                     <ol class="space-y-3">
                        <li v-for="step in originalPost.recipe?.instructions" :key="step.step" class="flex gap-3 text-sm">
                           <span class="font-montserrat font-extrabold text-text-dim tabular-nums shrink-0">{{ step.step }}</span>
                           <p class="leading-relaxed text-pretty" :class="stepChanged(step.text, 'orig') ? 'text-text-muted opacity-70' : 'text-text-muted'">{{ step.text }}</p>
                        </li>
                        <li v-if="!originalPost.recipe?.instructions?.length" class="text-sm text-text-dim italic">No instructions.</li>
                     </ol>
                  </div>
               </div>
            </section>

            <!-- Variation -->
            <section class="rounded-card border-1.5 border-orange/40 bg-surface shadow-[0_8px_30px_rgba(255,107,53,0.12)] overflow-hidden">
               <div class="p-5 sm:p-6 border-b border-orange/15 bg-orange-soft/60">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-orange text-white rounded-full text-[10px] font-montserrat font-bold uppercase tracking-widest mb-3 shadow-[0_4px_14px_rgba(255,107,53,0.35)]">
                     <BaseIcons name="sparkles" :solid="true" size="xs" /> Variation
                  </span>
                  <h2 class="font-montserrat font-extrabold text-xl tracking-tight text-balance">{{ variationPost.title }}</h2>
                  <p class="text-xs text-text-dim mt-1 truncate">by {{ variationPost.user?.displayName || 'Anonymous' }}</p>
               </div>
               <div class="p-5 sm:p-6 space-y-7">
                  <div>
                     <h3 class="diff-heading">Ingredients</h3>
                     <ul class="space-y-1">
                        <li
                          v-for="(ing, i) in variationPost.recipe?.ingredients"
                          :key="i"
                          class="diff-row"
                          :class="ingredientStatus(ing.name, 'var') === 'added' ? 'diff-row--added' : ''"
                        >
                           <span class="diff-marker" :class="ingredientStatus(ing.name, 'var') === 'added' ? 'diff-marker--added' : 'diff-marker--same'"></span>
                           <span class="flex-1 min-w-0 truncate" :class="ingredientStatus(ing.name, 'var') === 'added' ? 'font-bold text-orange-deep dark:text-orange-light' : ''">{{ ing.name }}</span>
                           <span class="text-text-dim tabular-nums whitespace-nowrap pl-2">{{ ing.quantity }}</span>
                        </li>
                        <li v-if="!variationPost.recipe?.ingredients?.length" class="text-sm text-text-dim italic py-2">No ingredients.</li>
                     </ul>
                  </div>
                  <div>
                     <h3 class="diff-heading">Method</h3>
                     <ol class="space-y-3">
                        <li v-for="step in variationPost.recipe?.instructions" :key="step.step" class="flex gap-3 text-sm">
                           <span class="font-montserrat font-extrabold tabular-nums shrink-0" :class="stepChanged(step.text, 'var') ? 'text-orange' : 'text-text-dim'">{{ step.step }}</span>
                           <p class="leading-relaxed text-pretty" :class="stepChanged(step.text, 'var') ? 'text-text font-medium' : 'text-text-muted'">{{ step.text }}</p>
                        </li>
                        <li v-if="!variationPost.recipe?.instructions?.length" class="text-sm text-text-dim italic">No instructions.</li>
                     </ol>
                  </div>
               </div>
            </section>
         </div>

         <!-- Open buttons -->
         <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <button @click="router.push(`/recipes/${originalPost.id}`)" class="h-12 rounded-btn border border-border bg-surface text-text font-montserrat font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-200 ease-out hover:border-orange hover:text-orange active:scale-[0.98]">
               View original
            </button>
            <button @click="router.push(`/recipes/${variationPost.id}`)" class="h-12 rounded-btn bg-orange text-white font-montserrat font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,107,53,0.3)] transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98]">
               View variation
            </button>
         </div>
      </template>

      <div v-else class="text-center py-24">
         <p class="text-text-dim font-montserrat font-bold uppercase tracking-widest">Variation details not found</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-legend {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.diff-heading {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text3);
  margin-bottom: 0.875rem;
}

.diff-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 0.625rem;
  margin: 0 -0.625rem;
  border-radius: 0.625rem;
  transition: background-color 0.2s ease-out;
}
.diff-row--added { background: var(--orange-soft); }
.diff-row--removed { color: var(--text3); }

.diff-marker {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  flex-shrink: 0;
}
.diff-marker--same { background: var(--border); }
.diff-marker--added { background: var(--orange); }
.diff-marker--removed {
  background: transparent;
  border: 1.5px solid var(--text3);
}
</style>
