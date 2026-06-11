<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { PostCategory } from '@/typescript/types/enums'
import { useUiStore } from '@/stores/ui'
import ImageUpload from '@/components/ui/ImageUpload.vue'
import IngredientAutocomplete from '@/components/recipe/IngredientAutocomplete.vue'
import NutritionFactsLabel from '@/components/recipe/NutritionFactsLabel.vue'
import { useNutritionCalc, type NutritionRow } from '@/composables/useNutritionCalc'
import type { Ingredient } from '@/typescript/interface/Ingredient'

interface IngredientRow {
  name: string
  quantity: string
  ingredient: Ingredient | null
}

const router = useRouter()
const uiStore = useUiStore()
const step = ref(0)
const isSubmitting = ref(false)

const STEPS = ["Photo & Info", "Ingredients", "Method", "Nutrition"]

const form = ref({
  title: '',
  description: '',
  photo: '',
  time: '',
  servings: '',
  tag: '',
  ingredients: [{ name: '', quantity: '', ingredient: null }] as IngredientRow[],
  steps: [{ text: '' }],
  cals: '',
  protein: '',
  carbs: '',
  fat: ''
})

const addIngredient = () => form.value.ingredients.push({ name: '', quantity: '', ingredient: null })
const removeIngredient = (i: number) => form.value.ingredients.splice(i, 1)

const onSelectIngredient = (i: number, ing: Ingredient) => {
  form.value.ingredients[i].ingredient = ing
}
const onClearIngredient = (i: number) => {
  form.value.ingredients[i].ingredient = null
}

const nutritionRows = computed<NutritionRow[]>(() =>
  form.value.ingredients.map(r => ({
    ingredient: r.ingredient,
    amount: r.quantity,
    isCustom: !r.ingredient,
  })),
)
const yieldAmount = computed(() => form.value.servings || '1')
const { perServing, hasData } = useNutritionCalc(nutritionRows, yieldAmount)

watch(perServing, p => {
  form.value.cals = p.energy ? p.energy.toFixed(0) : ''
  form.value.protein = p.protein ? p.protein.toFixed(1) : ''
  form.value.carbs = p.carb ? p.carb.toFixed(1) : ''
  form.value.fat = p.fat ? p.fat.toFixed(1) : ''
}, { deep: true })

const addStep = () => form.value.steps.push({ text: '' })
const removeStep = (i: number) => form.value.steps.splice(i, 1)

async function handleSubmit() {
  if (!form.value.title || !form.value.photo) {
    uiStore.showToast('Title and photo are required', 'error')
    step.value = 0
    return
  }

  isSubmitting.value = true
  try {
    const postData = {
      title: form.value.title,
      description: form.value.description,
      imageUrl: form.value.photo,
      category: PostCategory.Recipe,
      tags: form.value.tag ? [form.value.tag.toLowerCase()] : [],
      recipe: {
        servings: parseInt(form.value.servings) || undefined,
        totalTime: parseInt(form.value.time) || undefined,
        ingredients: form.value.ingredients.filter(i => i.name && i.quantity),
        instructions: form.value.steps.filter(s => s.text).map((s, idx) => ({ step: idx + 1, text: s.text })),
        nutrition: {
          calories: parseInt(form.value.cals) || 0,
          protein: parseInt(form.value.protein) || 0,
          carbs: parseInt(form.value.carbs) || 0,
          fat: parseInt(form.value.fat) || 0
        }
      }
    }

    await postsApi.create(postData as any)
    step.value = 4 // Success step
  } catch (error) {
    uiStore.showToast('Failed to create recipe', 'error')
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  router.push('/')
}
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75 animate-revamp">
    <div class="create-modal relative bg-background w-full max-w-[50vw] h-[800px] max-h-[90vh] rounded-[28px] border-1.5 border-border shadow-modal flex flex-col overflow-hidden animate-modalIn">
      <button @click="handleClose" class="absolute top-6 right-6 z-50 w-9 h-9 rounded-full bg-background-secondary border-1.5 border-border flex items-center justify-center text-text-muted hover:border-orange hover:text-orange transition-all">✕</button>

      <!-- Header -->
      <header class="p-5 border-b border-border flex items-center gap-3">
        <div class="flex gap-1.5 flex-1 pr-12">
          <div
            v-for="(s, i) in STEPS"
            :key="i"
            class="h-1.5 flex-1 rounded-full bg-background-secondary overflow-hidden"
          >
            <div
              class="h-full bg-orange transition-all duration-500"
              :style="{ width: step > i ? '100%' : step === i ? '100%' : '0%' }"
            ></div>
          </div>
        </div>
        <span class="text-[12px] font-bold text-text-dim whitespace-nowrap">Step {{ Math.min(step + 1, 4) }} of 4 — {{ STEPS[Math.min(step, 3)] }}</span>
      </header>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-8 flex flex-col">

        <!-- Success Step -->
        <div v-if="step === 4" class="flex-1 flex flex-col items-center justify-center py-12 text-center animate-revamp">
          <div class="w-20 h-20 rounded-full bg-orange flex items-center justify-center text-white mb-6 animate-popIn"><BaseIcons name="check" size="xl" /></div>
          <h2 class="font-montserrat font-extrabold text-3xl mb-2">Recipe shared!</h2>
          <p class="text-text-muted text-sm max-w-xs mx-auto mb-8">
            <strong class="text-text">{{ form.title }}</strong> is now live. The community can't wait to try it!
          </p>
          <button @click="handleClose" class="btn-primary px-10">Back to feed</button>
        </div>

        <div v-else>
          <h2 class="font-montserrat font-extrabold text-2xl mb-1.5">{{ STEPS[step] }}</h2>
          <p class="text-text-dim text-sm mb-8">
            {{ step === 0 ? 'Add a photo and basic info about your dish.' :
               step === 1 ? 'List everything needed for this recipe.' :
               step === 2 ? 'Break it down into clear, simple steps.' :
               'Enter macros per serving for the community.' }}
          </p>

          <!-- Step 0: Photo & Info -->
          <div v-if="step === 0" class="space-y-6">
            <ImageUpload v-model="form.photo" :max-size="10" />

            <div class="space-y-4">
              <div>
                <label class="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-2 block">Recipe name</label>
                <input v-model="form.title" class="w-full bg-background-secondary border-1.5 border-border rounded-xl p-4 text-[15px] outline-none focus:border-orange" placeholder="e.g. Golden Turmeric Buddha Bowl" />
              </div>
              <div>
                <label class="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-2 block">Description</label>
                <textarea v-model="form.description" rows="3" class="w-full bg-background-secondary border-1.5 border-border rounded-xl p-4 text-[15px] outline-none focus:border-orange" placeholder="What makes this dish special?"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-2 block">Cook time (min)</label>
                  <input v-model="form.time" type="number" class="w-full bg-background-secondary border-1.5 border-border rounded-xl p-4 text-[15px] outline-none focus:border-orange" placeholder="e.g. 25" />
                </div>
                <div>
                  <label class="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-2 block">Servings</label>
                  <input v-model="form.servings" type="number" class="w-full bg-background-secondary border-1.5 border-border rounded-xl p-4 text-[15px] outline-none focus:border-orange" placeholder="e.g. 2" />
                </div>
              </div>
            </div>
          </div>

          <!-- Step 1: Ingredients -->
          <div v-if="step === 1" class="animate-revamp">
            <div class="space-y-4 mb-8">
               <div v-for="(ing, i) in form.ingredients" :key="i" class="flex gap-3">
                  <IngredientAutocomplete
                    v-model="ing.name"
                    :placeholder="`Ingredient ${i+1}`"
                    class="flex-1"
                    @select-ingredient="onSelectIngredient(i, $event)"
                    @clear-ingredient="onClearIngredient(i)"
                  />
                  <input v-model="ing.quantity" type="number" min="0" class="w-32 bg-background-secondary border border-border rounded-xl p-4 text-sm outline-none focus:border-orange font-bold" placeholder="Grams" />
                  <button @click="removeIngredient(i)" class="w-13 h-13 shrink-0 border border-border rounded-full flex items-center justify-center text-text-dim hover:text-red-500">✕</button>
               </div>
            </div>
            <button @click="addIngredient" class="w-full py-3.5 border-1.5 border-dashed border-border rounded-xl text-text-dim font-bold text-xs hover:border-orange hover:text-orange">+ Add ingredient</button>
          </div>

          <!-- Step 2: Method -->
          <div v-if="step === 2" class="space-y-4">
            <div v-for="(s, i) in form.steps" :key="i" class="flex gap-4">
              <div class="w-9 h-9 rounded-full bg-orange text-white font-montserrat font-extrabold text-sm flex items-center justify-center shrink-0 mt-1">{{ i + 1 }}</div>
              <textarea v-model="s.text" rows="2" class="flex-1 bg-background-secondary border-1.5 border-border rounded-xl p-3.5 text-sm outline-none focus:border-orange" :placeholder="`Describe step ${i+1}...`"></textarea>
              <button @click="removeStep(i)" class="w-10 h-10 shrink-0 border-1.5 border-border rounded-full flex items-center justify-center text-text-dim hover:border-red-500 hover:text-red-500 transition-all">✕</button>
            </div>
            <button @click="addStep" class="w-full py-3.5 border-1.5 border-dashed border-border rounded-xl text-text-dim font-bold text-xs hover:border-orange hover:text-orange">+ Add step</button>
          </div>

          <!-- Step 3: Nutrition (auto-calculated from ingredients) -->
          <div v-if="step === 3" class="space-y-6">
            <div v-if="!hasData" class="p-6 bg-background-secondary border-1.5 border-dashed border-border rounded-2xl text-center">
              <p class="text-sm text-text-dim">
                Pick ingredients from suggestions and enter grams in step 2 to auto-calculate nutrition.
              </p>
            </div>

            <NutritionFactsLabel
              v-else
              :data="perServing"
              :yield-amount="form.servings || '1'"
            />

            <div class="grid grid-cols-4 gap-3">
              <div v-for="n in [
                {v: perServing.energy, l: 'Calories', u: 'kcal', d: 0, i: 'fire'},
                {v: perServing.protein, l: 'Protein', u: 'g', d: 1, i: 'bolt'},
                {v: perServing.carb, l: 'Carbs', u: 'g', d: 1, i: 'circle-stack'},
                {v: perServing.fat, l: 'Fat', u: 'g', d: 1, i: 'beaker'},
              ]" :key="n.l" class="p-3 bg-background-secondary border-1.5 border-border rounded-xl text-center">
                <BaseIcons :name="n.i" size="md" class="mx-auto text-text-dim" />
                <div class="font-montserrat font-extrabold text-lg text-text">{{ n.v.toFixed(n.d) }}</div>
                <div class="text-[10px] font-bold text-text-dim uppercase tracking-wider">{{ n.l }} ({{ n.u }})</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer v-if="step < 4" class="p-6 px-8 border-t border-border flex gap-4">
        <button v-if="step > 0" @click="step--" class="px-8 py-3.5 rounded-xl border-1.5 border-border font-bold text-sm text-text-muted hover:bg-background-secondary">Back</button>
        <button
          @click="step < 3 ? step++ : handleSubmit()"
          class="flex-1 btn-primary py-3.5 !text-sm"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Sharing...' : step < 3 ? 'Next step →' : 'Share Recipe' }}
        </button>
      </footer>

    </div>
  </div>
</template>

<style scoped>
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(30px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-modalIn {
  animation: modalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}
.animate-popIn {
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
