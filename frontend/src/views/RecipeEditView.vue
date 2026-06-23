<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { variationsApi } from '@/http/endpoints/variations'
import { useUiStore } from '@/stores/ui'
import BaseIcons from '@/components/base/BaseIcons.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import IngredientAutocomplete from '@/components/recipe/IngredientAutocomplete.vue'
import type { Post } from '@/typescript/interface/Post'
import type { Ingredient } from '@/typescript/interface/Ingredient'
import { calcRow } from '@/composables/useNutritionCalc'
import { logger } from '@/utils/logger'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const post = ref<Post | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const originalPostId = ref<string | null>(null)

const formData = ref({
  title: '',
  description: '',
  category: '',
  imageUrl: '',
  isPublic: true,
  recipe: {
    servings: 0,
    prepTime: 0,
    cookTime: 0,
    ingredients: [] as { name: string; quantity: string }[],
    instructions: [] as { step: number; text: string }[],
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    }
  }
})

async function loadPost() {
  const id = route.params.id as string
  try {
    const response = await postsApi.getById(id)
    const p = response.data.data
    post.value = p
    
    if (p.isVariation) {
      try {
        const origRes = await variationsApi.getOriginal(id)
        originalPostId.value = origRes.data.data.originalPost.id
      } catch (err) {
        logger.error('Failed to load original recipe id:', err)
      }
    }
    
    formData.value = {
      title: p.title,
      description: p.description || '',
      category: p.category,
      imageUrl: p.imageUrl || '',
      isPublic: p.isPublic,
      recipe: {
        servings: p.recipe?.servings || 0,
        prepTime: p.recipe?.prepTime || 0,
        cookTime: p.recipe?.cookTime || 0,
        ingredients: p.recipe?.ingredients ? [...p.recipe.ingredients] : [{ name: '', quantity: '' }],
        instructions: p.recipe?.instructions ? [...p.recipe.instructions] : [{ step: 1, text: '' }],
        nutrition: {
          calories: p.recipe?.nutrition?.calories || 0,
          protein: p.recipe?.nutrition?.protein || 0,
          carbs: p.recipe?.nutrition?.carbs || 0,
          fat: p.recipe?.nutrition?.fat || 0,
          fiber: p.recipe?.nutrition?.fiber || 0
        }
      }
    }
  } catch (error) {
    uiStore.showToast('Failed to load recipe', 'error')
    router.push('/')
  } finally {
    isLoading.value = false
  }
}

// FCT ingredient linkage — keyed by ingredient array index
const linkedFct = ref<Map<number, Ingredient>>(new Map())

function onSelectIngredient(index: number, ing: Ingredient) {
  const next = new Map(linkedFct.value)
  next.set(index, ing)
  linkedFct.value = next
}

function onClearIngredient(index: number) {
  const next = new Map(linkedFct.value)
  next.delete(index)
  linkedFct.value = next
}

const fctMatchCount = computed(() => linkedFct.value.size)

function autoFillNutrition() {
  const ingredients = formData.value.recipe.ingredients
  let totalEnergy = 0, totalProtein = 0, totalCarb = 0, totalFat = 0
  let matched = 0

  for (let i = 0; i < ingredients.length; i++) {
    const fct = linkedFct.value.get(i)
    if (!fct) continue
    const qty = ingredients[i].quantity ?? ''
    const gramsMatch = qty.match(/^(\d+(?:\.\d+)?)\s*g(?:r(?:ams?)?)?/i)
    if (!gramsMatch) continue
    const grams = parseFloat(gramsMatch[1])
    const row = calcRow(fct, grams)
    totalEnergy += row.energy
    totalProtein += row.protein
    totalCarb += row.carb
    totalFat += row.fat
    matched++
  }

  if (matched === 0) {
    uiStore.showToast('No FCT-matched ingredients with gram quantities found', 'error')
    return
  }

  const servings = formData.value.recipe.servings || 1
  formData.value.recipe.nutrition.calories = Math.round(totalEnergy / servings)
  formData.value.recipe.nutrition.protein = Math.round(totalProtein / servings)
  formData.value.recipe.nutrition.carbs = Math.round(totalCarb / servings)
  formData.value.recipe.nutrition.fat = Math.round(totalFat / servings)
  uiStore.showToast(`Filled from ${matched} FCT-matched ingredient${matched > 1 ? 's' : ''}`, 'success')
}

const addIngredient = () => formData.value.recipe.ingredients.push({ name: '', quantity: '' })
const removeIngredient = (i: number) => {
  formData.value.recipe.ingredients.splice(i, 1)
  // Rebuild index map after removal
  const next = new Map<number, Ingredient>()
  for (const [k, v] of linkedFct.value) {
    if (k < i) next.set(k, v)
    else if (k > i) next.set(k - 1, v)
  }
  linkedFct.value = next
}

const addStep = () => {
  const nextStep = formData.value.recipe.instructions.length + 1
  formData.value.recipe.instructions.push({ step: nextStep, text: '' })
}
const removeStep = (i: number) => {
  formData.value.recipe.instructions.splice(i, 1)
  // Re-index steps
  formData.value.recipe.instructions.forEach((s, idx) => s.step = idx + 1)
}

async function handleDelete() {
  if (!post.value) return
  if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) return
  isSaving.value = true
  try {
    await postsApi.delete(post.value.id)
    uiStore.showToast('Recipe deleted successfully', 'success')
    router.push(`/profile/${post.value.userId}`)
  } catch (error) {
    uiStore.showToast('Failed to delete recipe', 'error')
    isSaving.value = false
  }
}

async function handleUpdate() {
  if (!post.value) return
  isSaving.value = true
  try {
    const updateData = {
      ...formData.value,
      recipe: {
        ...formData.value.recipe,
        ingredients: formData.value.recipe.ingredients.filter(i => i.name && i.quantity),
        instructions: formData.value.recipe.instructions.filter(s => s.text)
      }
    }
    await postsApi.update(post.value.id, updateData as any)
    uiStore.showToast('Recipe updated successfully', 'success')
    router.push(`/recipes/${post.value.id}`)
  } catch (error) {
    uiStore.showToast('Failed to update recipe', 'error')
  } finally {
    isSaving.value = false
  }
}

function goBack() {
  if (originalPostId.value) {
    router.push(`/recipes/${originalPostId.value}`)
  } else if (post.value) {
    router.push(`/recipes/${post.value.id}`)
  } else {
    router.back()
  }
}

onMounted(loadPost)

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage']

// Validation affordances
const titleError = computed(() => formData.value.title.trim().length === 0)
const filledIngredients = computed(
  () => formData.value.recipe.ingredients.filter((i) => i.name.trim() && i.quantity.trim()).length,
)
const filledSteps = computed(
  () => formData.value.recipe.instructions.filter((s) => s.text.trim()).length,
)
const canSave = computed(() => !titleError.value && !!formData.value.category)

function attemptSave() {
  if (!canSave.value) {
    uiStore.showToast('Add a title and category before saving', 'error')
    return
  }
  handleUpdate()
}
</script>

<template>
  <div class="recipe-edit-view min-h-screen bg-background antialiased pb-28">
    <div class="max-w-3xl mx-auto px-5 sm:px-6 pt-5 md:pt-12">
      <button @click="goBack()" class="mb-7 inline-flex items-center gap-2 h-9 text-text-dim font-montserrat font-bold text-xs uppercase tracking-widest transition-colors duration-200 ease-out hover:text-orange">
        <BaseIcons name="arrow-left" size="sm" /> Back to recipe
      </button>

      <div v-if="isLoading" class="flex justify-center py-24">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="post">
         <header class="mb-9">
            <p class="text-[11px] font-montserrat font-bold uppercase tracking-widest text-orange mb-1.5">Editing</p>
            <h1 class="font-montserrat font-black text-3xl sm:text-4xl tracking-tight text-balance">Refine your recipe</h1>
         </header>

         <form @submit.prevent="attemptSave" class="space-y-5">
            <!-- The basics -->
            <fieldset class="edit-card">
               <legend class="edit-section-title">The Basics</legend>

               <div class="space-y-2">
                  <label for="rTitle" class="edit-label">
                     Recipe Title <span class="text-orange">*</span>
                  </label>
                  <input
                    id="rTitle"
                    v-model="formData.title"
                    type="text"
                    class="edit-input font-montserrat font-bold text-lg"
                    :class="titleError ? 'edit-input--error' : ''"
                    placeholder="Give your recipe a name"
                  />
                  <p v-if="titleError" class="edit-hint-error">A title helps people find your dish.</p>
               </div>

               <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="space-y-2 sm:col-span-1">
                     <label for="rCat" class="edit-label">Category <span class="text-orange">*</span></label>
                     <div class="relative">
                        <select id="rCat" v-model="formData.category" class="edit-input font-medium appearance-none pr-10">
                           <option value="" disabled>Choose…</option>
                           <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                        </select>
                        <BaseIcons name="chevron-down" size="sm" class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-dim" />
                     </div>
                  </div>
                  <div class="space-y-2 sm:col-span-2">
                     <label for="rServ" class="edit-label">Servings</label>
                     <input id="rServ" v-model.number="formData.recipe.servings" type="number" min="0" class="edit-input font-medium tabular-nums" placeholder="0" />
                  </div>
               </div>

               <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                     <label for="rPrep" class="edit-label">Prep Time (min)</label>
                     <input id="rPrep" v-model.number="formData.recipe.prepTime" type="number" min="0" class="edit-input font-medium tabular-nums" placeholder="0" />
                  </div>
                  <div class="space-y-2">
                     <label for="rCook" class="edit-label">Cook Time (min)</label>
                     <input id="rCook" v-model.number="formData.recipe.cookTime" type="number" min="0" class="edit-input font-medium tabular-nums" placeholder="0" />
                  </div>
               </div>

               <div class="space-y-2">
                  <label for="rDesc" class="edit-label">Description</label>
                  <textarea
                    id="rDesc"
                    v-model="formData.description"
                    rows="4"
                    class="edit-input leading-relaxed resize-y"
                    placeholder="Share the story behind this dish…"
                  ></textarea>
               </div>

               <div class="space-y-2">
                  <label class="edit-label">Cover Image</label>
                  <ImageUpload v-model="formData.imageUrl" :max-size="10" />
               </div>
            </fieldset>

            <!-- Ingredients -->
            <fieldset class="edit-card">
               <div class="flex items-baseline justify-between">
                  <legend class="edit-section-title">Ingredients</legend>
                  <span class="text-[11px] font-montserrat font-bold uppercase tracking-widest text-text-dim tabular-nums">{{ filledIngredients }} added</span>
               </div>

               <div class="space-y-3">
                  <div v-for="(ing, i) in formData.recipe.ingredients" :key="i" class="space-y-1.5">
                     <div class="flex gap-2.5">
                        <IngredientAutocomplete
                          v-model="ing.name"
                          :placeholder="`Ingredient ${i+1}`"
                          class="flex-1"
                          @select-ingredient="(fct) => onSelectIngredient(i, fct)"
                          @clear-ingredient="onClearIngredient(i)"
                        />
                        <input v-model="ing.quantity" class="edit-input w-24 sm:w-28 text-sm font-medium tabular-nums" placeholder="Amount" />
                        <button type="button" @click="removeIngredient(i)" :aria-label="`Remove ingredient ${i+1}`" class="edit-remove">
                           <BaseIcons name="x-mark" size="sm" />
                        </button>
                     </div>
                     <div v-if="linkedFct.get(i)" class="ml-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
                        <span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-bold uppercase tracking-wide">
                           <BaseIcons name="check-badge" :solid="true" size="xs" /> FCT match
                        </span>
                        <span class="tabular-nums text-text-dim">
                           {{ linkedFct.get(i)!.energy }} kcal ·
                           P {{ linkedFct.get(i)!.protein }}g ·
                           C {{ linkedFct.get(i)!.carb }}g ·
                           F {{ linkedFct.get(i)!.fat }}g
                           <span class="opacity-60">per 100g</span>
                        </span>
                     </div>
                  </div>
               </div>
               <button type="button" @click="addIngredient" class="edit-add">+ Add ingredient</button>
            </fieldset>

            <!-- Method -->
            <fieldset class="edit-card">
               <div class="flex items-baseline justify-between">
                  <legend class="edit-section-title">Method</legend>
                  <span class="text-[11px] font-montserrat font-bold uppercase tracking-widest text-text-dim tabular-nums">{{ filledSteps }} steps</span>
               </div>

               <div class="space-y-3">
                  <div v-for="(s, i) in formData.recipe.instructions" :key="i" class="flex gap-3">
                     <div class="w-9 h-9 rounded-full bg-orange text-white font-montserrat font-extrabold text-sm flex items-center justify-center shrink-0 mt-1 tabular-nums shadow-[0_4px_14px_rgba(255,107,53,0.3)]">{{ i + 1 }}</div>
                     <textarea v-model="s.text" rows="2" class="edit-input flex-1 text-sm leading-relaxed resize-y" :placeholder="`Describe step ${i+1}…`"></textarea>
                     <button type="button" @click="removeStep(i)" :aria-label="`Remove step ${i+1}`" class="edit-remove mt-1">
                        <BaseIcons name="x-mark" size="sm" />
                     </button>
                  </div>
               </div>
               <button type="button" @click="addStep" class="edit-add">+ Add step</button>
            </fieldset>

            <!-- Nutrition -->
            <fieldset class="edit-card">
               <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <legend class="edit-section-title">Nutrition <span class="text-text-dim font-normal normal-case tracking-normal">per serving</span></legend>
                  <button
                    v-if="fctMatchCount > 0"
                    type="button"
                    @click="autoFillNutrition"
                    class="inline-flex items-center gap-1.5 text-[11px] font-montserrat font-bold uppercase tracking-wide text-green-600 dark:text-green-400 transition-transform duration-150 ease-out hover:underline active:scale-[0.97]"
                  >
                     <BaseIcons name="sparkles" :solid="true" size="xs" /> Auto-fill from {{ fctMatchCount }} match{{ fctMatchCount > 1 ? 'es' : '' }}
                  </button>
               </div>
               <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div v-for="n in [
                    {k:'calories', l:'Calories', u:'kcal'},
                    {k:'protein', l:'Protein', u:'g'},
                    {k:'carbs', l:'Carbs', u:'g'},
                    {k:'fat', l:'Fat', u:'g'}
                  ]" :key="n.k" class="p-3.5 bg-background border border-border rounded-2xl transition-colors duration-200 ease-out focus-within:border-orange">
                     <label :for="`nut-${n.k}`" class="text-[9px] font-montserrat font-bold text-text-dim uppercase tracking-widest mb-1 block">{{ n.l }}</label>
                     <div class="flex items-baseline gap-1">
                        <input :id="`nut-${n.k}`" v-model="formData.recipe.nutrition[n.k as 'calories'|'protein'|'carbs'|'fat']" type="number" min="0" class="w-full bg-transparent border-none outline-none font-montserrat font-extrabold text-xl text-text tabular-nums p-0" placeholder="0" />
                        <span class="text-[10px] text-text-dim font-bold">{{ n.u }}</span>
                     </div>
                  </div>
               </div>
            </fieldset>

            <!-- Visibility -->
            <fieldset class="edit-card">
               <legend class="edit-section-title">Visibility</legend>
               <label for="toggleEdit" class="flex items-center gap-3.5 cursor-pointer">
                  <span class="relative inline-block w-12 shrink-0 select-none">
                     <input type="checkbox" name="toggle" id="toggleEdit" v-model="formData.isPublic" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-surface border-4 appearance-none cursor-pointer border-background-secondary checked:right-0 checked:border-orange transition-all duration-200 ease-out"/>
                     <span class="toggle-label block overflow-hidden h-6 rounded-full bg-background-secondary cursor-pointer transition-colors duration-200 ease-out" :class="{'!bg-orange': formData.isPublic}"></span>
                  </span>
                  <span class="min-w-0">
                     <span class="block text-sm font-montserrat font-bold">{{ formData.isPublic ? 'Public Recipe' : 'Private Recipe' }}</span>
                     <span class="block text-xs text-text-muted">{{ formData.isPublic ? 'Visible to everyone on Nutrisipe' : 'Only visible to you' }}</span>
                  </span>
               </label>
            </fieldset>

            <button
              type="button"
              @click="handleDelete"
              :disabled="isSaving"
              class="w-full h-12 rounded-btn border border-red-500/25 bg-red-500/5 text-red-500 font-montserrat font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-200 ease-out hover:bg-red-500/10 active:scale-[0.99]"
            >
               <BaseIcons name="trash" size="sm" /> Delete Recipe
            </button>
         </form>
      </div>
    </div>

    <!-- Sticky save bar -->
    <div v-if="!isLoading && post" class="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface/90 backdrop-blur-md">
       <div class="max-w-3xl mx-auto px-5 sm:px-6 py-3.5 flex items-center gap-3">
          <p class="text-xs text-text-dim hidden sm:block">
             <span v-if="!canSave" class="text-orange font-bold">Add a title and category to save</span>
             <span v-else>All set. Your changes are ready.</span>
          </p>
          <div class="flex items-center gap-2.5 ml-auto">
             <button type="button" @click="goBack()" class="h-11 px-5 rounded-btn border border-border bg-background-secondary text-text font-montserrat font-bold text-xs uppercase tracking-widest transition-colors duration-200 ease-out hover:border-orange hover:text-orange active:scale-[0.97]">
                Cancel
             </button>
             <button
               type="button"
               @click="attemptSave"
               :disabled="isSaving || !canSave"
               class="h-11 px-6 rounded-btn bg-orange text-white font-montserrat font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,107,53,0.3)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(255,107,53,0.4)] active:scale-[0.97] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_24px_rgba(255,107,53,0.3)]"
             >
                <span v-if="isSaving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {{ isSaving ? 'Saving…' : 'Save Changes' }}
             </button>
          </div>
       </div>
    </div>
  </div>
</template>

<style scoped>
.edit-card {
  border: 1px solid var(--border);
  background: var(--bg2);
  border-radius: var(--radius-card);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: var(--shadow-card);
}
@media (min-width: 640px) {
  .edit-card { padding: 1.75rem; }
}

.edit-section-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  font-size: 1.0625rem;
  letter-spacing: -0.01em;
  color: var(--text);
}

.edit-label {
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text3);
}

.edit-input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 0.875rem;
  padding: 0.875rem 1.125rem;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s ease-out, background-color 0.2s ease-out;
}
.edit-input::placeholder { color: var(--text3); }
.edit-input:focus { border-color: var(--orange); }
.edit-input--error { border-color: rgb(239 68 68 / 0.55); }

.edit-hint-error {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgb(239 68 68);
}

.edit-remove {
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 9999px;
  color: var(--text3);
  transition: border-color 0.2s ease-out, color 0.2s ease-out, transform 0.15s ease-out;
}
.edit-remove:hover {
  border-color: rgb(239 68 68);
  color: rgb(239 68 68);
}
.edit-remove:active { transform: scale(0.92); }

.edit-add {
  width: 100%;
  padding: 0.875rem;
  border: 1px dashed var(--border);
  border-radius: 0.875rem;
  color: var(--text3);
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: border-color 0.2s ease-out, color 0.2s ease-out, background-color 0.2s ease-out;
}
.edit-add:hover {
  border-color: var(--orange);
  color: var(--orange);
  background: var(--orange-soft);
}
</style>
