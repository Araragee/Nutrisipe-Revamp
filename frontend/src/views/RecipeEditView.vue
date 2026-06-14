<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { variationsApi } from '@/http/endpoints/variations'
import { useUiStore } from '@/stores/ui'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import IngredientAutocomplete from '@/components/recipe/IngredientAutocomplete.vue'
import type { Post } from '@/typescript/interface/Post'
import type { Ingredient } from '@/typescript/interface/Ingredient'
import { calcRow } from '@/composables/useNutritionCalc'

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
        console.error('Failed to load original recipe id:', err)
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
</script>

<template>
  <div class="recipe-edit-view min-h-screen bg-background py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <button @click="goBack()" class="mb-8 flex items-center gap-2 text-text-dim font-bold hover:text-orange transition-colors">
        <span>←</span> BACK TO RECIPE
      </button>

      <div v-if="isLoading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="post" class="bg-background-secondary rounded-[40px] border border-border p-8 md:p-12 shadow-2xl">
         <h1 class="font-montserrat font-extrabold text-3xl mb-10">Edit Recipe</h1>

         <form @submit.prevent="handleUpdate" class="space-y-8">
            <div class="space-y-2">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Recipe Title</label>
               <input
                 v-model="formData.title"
                 type="text"
                 class="w-full bg-background border border-border rounded-2xl px-6 py-4 focus:border-orange outline-none transition-all font-bold"
                 placeholder="Give your recipe a name"
               />
            </div>

            <div class="space-y-2">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Category</label>
               <select
                 v-model="formData.category"
                 class="w-full bg-background border border-border rounded-2xl px-6 py-4 focus:border-orange outline-none transition-all font-bold appearance-none"
               >
                 <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
               </select>
            </div>

            <div class="space-y-2">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Description</label>
               <textarea
                 v-model="formData.description"
                 rows="4"
                 class="w-full bg-background border border-border rounded-2xl px-6 py-4 focus:border-orange outline-none transition-all leading-relaxed"
                 placeholder="Share the story behind this dish..."
               ></textarea>
            </div>

            <div class="space-y-2">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Cover Image</label>
               <ImageUpload v-model="formData.imageUrl" :max-size="10" />
            </div>

            <!-- Ingredients -->
            <div class="space-y-4 pt-4">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Ingredients</label>
               <div v-for="(ing, i) in formData.recipe.ingredients" :key="i" class="space-y-1">
                 <div class="flex gap-3">
                   <IngredientAutocomplete
                     v-model="ing.name"
                     :placeholder="`Ingredient ${i+1}`"
                     class="flex-1"
                     @select-ingredient="(fct) => onSelectIngredient(i, fct)"
                     @clear-ingredient="onClearIngredient(i)"
                   />
                   <input v-model="ing.quantity" class="w-24 bg-background border border-border rounded-xl p-3.5 text-sm outline-none focus:border-orange transition-all font-medium" placeholder="Amount" />
                   <button type="button" @click="removeIngredient(i)" class="w-10 h-10 shrink-0 border border-border rounded-full flex items-center justify-center text-text-dim hover:border-red-500 hover:text-red-500 transition-all">✕</button>
                 </div>
                 <div v-if="linkedFct.get(i)" class="ml-1 flex items-center gap-2 text-[10px] text-text-dim">
                   <span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                     <span>✓ FCT</span>
                   </span>
                   <span class="tabular-nums">
                     {{ linkedFct.get(i)!.energy }} kcal ·
                     P {{ linkedFct.get(i)!.protein }}g ·
                     C {{ linkedFct.get(i)!.carb }}g ·
                     F {{ linkedFct.get(i)!.fat }}g
                   </span>
                   <span class="text-text-dim/50">per 100g</span>
                 </div>
               </div>
               <button type="button" @click="addIngredient" class="w-full py-3.5 border border-dashed border-border rounded-xl text-text-dim font-bold text-xs hover:border-orange hover:text-orange">+ Add ingredient</button>
            </div>

            <!-- Instructions -->
            <div class="space-y-4 pt-4">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Method</label>
               <div v-for="(s, i) in formData.recipe.instructions" :key="i" class="flex gap-4">
                  <div class="w-9 h-9 rounded-full bg-orange text-white font-montserrat font-extrabold text-sm flex items-center justify-center shrink-0 mt-1">{{ i + 1 }}</div>
                  <textarea v-model="s.text" rows="2" class="flex-1 bg-background border border-border rounded-xl p-3.5 text-sm outline-none focus:border-orange transition-all leading-relaxed" :placeholder="`Describe step ${i+1}...`"></textarea>
                  <button type="button" @click="removeStep(i)" class="w-10 h-10 shrink-0 border border-border rounded-full flex items-center justify-center text-text-dim hover:border-red-500 hover:text-red-500 transition-all">✕</button>
               </div>
               <button type="button" @click="addStep" class="w-full py-3.5 border border-dashed border-border rounded-xl text-text-dim font-bold text-xs hover:border-orange hover:text-orange">+ Add step</button>
            </div>

            <!-- Nutrition -->
            <div class="space-y-4 pt-4">
               <div class="flex items-center justify-between ml-4">
                 <label class="text-xs font-bold uppercase tracking-widest text-text-dim">Nutrition (per serving)</label>
                 <button
                   v-if="fctMatchCount > 0"
                   type="button"
                   @click="autoFillNutrition"
                   class="text-[11px] font-bold text-green-600 dark:text-green-400 hover:underline"
                 >
                   ✦ Fill from {{ fctMatchCount }} FCT match{{ fctMatchCount > 1 ? 'es' : '' }}
                 </button>
               </div>
               <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div v-for="n in [
                    {k:'calories', l:'Calories', u:'kcal'},
                    {k:'protein', l:'Protein', u:'g'},
                    {k:'carbs', l:'Carbs', u:'g'},
                    {k:'fat', l:'Fat', u:'g'}
                  ]" :key="n.k" class="p-4 bg-background border border-border rounded-2xl focus-within:border-orange transition-all">
                    <label class="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-1 block">{{ n.l }}</label>
                    <div class="flex items-baseline gap-1">
                      <input v-model="formData.recipe.nutrition[n.k as 'calories'|'protein'|'carbs'|'fat']" type="number" class="w-full bg-transparent border-none outline-none font-montserrat font-extrabold text-xl text-text" placeholder="0" />
                      <span class="text-[10px] text-text-dim font-bold">{{ n.u }}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div class="space-y-2">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Visibility</label>
               <div class="flex items-center gap-3 bg-background border border-border rounded-2xl px-6 py-4">
                 <div class="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                     <input type="checkbox" name="toggle" id="toggleEdit" v-model="formData.isPublic" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-background-secondary checked:right-0 checked:border-orange"/>
                     <label for="toggleEdit" class="toggle-label block overflow-hidden h-6 rounded-full bg-background-secondary cursor-pointer" :class="{'bg-orange': formData.isPublic}"></label>
                 </div>
                 <span class="text-sm font-bold">{{ formData.isPublic ? 'Public Recipe' : 'Private Recipe' }}</span>
                 <span class="text-xs text-text-muted ml-auto">{{ formData.isPublic ? 'Visible to everyone on the platform' : 'Only visible to you' }}</span>
               </div>
            </div>

            <div class="pt-6 flex flex-col sm:flex-row gap-4">
               <button
                 type="submit"
                 :disabled="isSaving"
                 class="flex-1 btn-primary h-14 flex items-center justify-center gap-2"
               >
                 <span v-if="isSaving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                 {{ isSaving ? 'Updating...' : 'Save Changes' }}
               </button>
               <button
                 type="button"
                 @click="goBack()"
                 class="btn-secondary px-8 h-14"
               >
                 Cancel
               </button>
               <button
                 type="button"
                 @click="handleDelete"
                 :disabled="isSaving"
                 class="btn-secondary px-8 h-14 !text-red-500 !border-red-500/30 hover:!bg-red-500/10"
               >
                 Delete Recipe
               </button>
            </div>
         </form>
      </div>
    </div>
  </div>
</template>
