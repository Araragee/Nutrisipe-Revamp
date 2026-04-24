<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { PostCategory } from '@/typescript/types/enums'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const uiStore = useUiStore()
const step = ref(0)
const isSubmitting = ref(false)

const STEPS = ["Photo & Info", "Ingredients", "Method", "Nutrition"]

const form = ref({
  title: '',
  description: '',
  photo: null as string | null,
  time: '',
  servings: '',
  tag: '',
  ingredients: [{ name: '', qty: '' }],
  steps: [{ text: '' }],
  cals: '',
  protein: '',
  carbs: '',
  fat: ''
})

const addIngredient = () => form.value.ingredients.push({ name: '', qty: '' })
const removeIngredient = (i: number) => form.value.ingredients.splice(i, 1)

const addStep = () => form.value.steps.push({ text: '' })
const removeStep = (i: number) => form.value.steps.splice(i, 1)

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const postData = {
      title: form.value.title,
      description: form.value.description,
      imageUrl: form.value.photo || 'https://picsum.photos/800/600',
      category: PostCategory.Recipe,
      tags: form.value.tag ? [form.value.tag.toLowerCase()] : [],
      recipe: {
        servings: parseInt(form.value.servings) || undefined,
        totalTime: parseInt(form.value.time) || undefined,
        ingredients: form.value.ingredients.filter(i => i.name),
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
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75 backdrop-blur-md animate-revamp">
    <div class="create-modal bg-background w-full max-w-[720px] max-h-[90vh] rounded-[28px] border-1.5 border-glass-border shadow-modal flex flex-col overflow-hidden animate-modalIn">

      <!-- Header -->
      <header class="p-7 pb-5 border-b border-glass-border flex items-center gap-4">
        <div class="flex gap-1.5 flex-1">
          <div
            v-for="(s, i) in STEPS"
            :key="i"
            class="h-1.5 flex-1 rounded-full bg-background-secondary overflow-hidden"
          >
            <div
              class="h-full bg-orange transition-all duration-500"
              :style="{ width: step > i ? '100%' : step === i ? '60%' : '0%' }"
            ></div>
          </div>
        </div>
        <span class="text-[12px] font-bold text-text-dim whitespace-nowrap">Step {{ Math.min(step + 1, 4) }} of 4 — {{ STEPS[Math.min(step, 3)] }}</span>
        <button @click="handleClose" class="w-8.5 h-8.5 rounded-full border-1.5 border-glass-border flex items-center justify-center text-text-muted hover:border-orange hover:text-orange">✕</button>
      </header>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-8">

        <!-- Success Step -->
        <div v-if="step === 4" class="flex flex-col items-center justify-center py-12 text-center">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-orange to-orange-light flex items-center justify-center text-3xl text-white shadow-lg mb-6 animate-popIn">🎉</div>
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
            <div
              class="upload-zone border-2 border-dashed border-glass-border rounded-2xl p-12 bg-background-secondary flex flex-col items-center gap-3 cursor-pointer hover:border-orange hover:bg-orange-soft transition-all"
              @click="form.photo = 'https://picsum.photos/800/600'"
            >
              <template v-if="!form.photo">
                <span class="text-4xl">📸</span>
                <span class="font-bold text-text">Drop your photo here</span>
                <span class="text-xs text-text-dim">JPG, PNG or HEIC · Max 20MB</span>
                <button class="mt-2 px-5 py-2 rounded-full border-1.5 border-orange text-orange font-bold text-xs">Upload from device</button>
              </template>
              <img v-else :src="form.photo" class="w-full h-48 object-cover rounded-xl" />
            </div>

            <div class="space-y-4">
              <div>
                <label class="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-2 block">Recipe name</label>
                <input v-model="form.title" class="w-full bg-background-secondary border-1.5 border-glass-border rounded-xl p-4 text-[15px] outline-none focus:border-orange" placeholder="e.g. Golden Turmeric Buddha Bowl" />
              </div>
              <div>
                <label class="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-2 block">Description</label>
                <textarea v-model="form.description" rows="3" class="w-full bg-background-secondary border-1.5 border-glass-border rounded-xl p-4 text-[15px] outline-none focus:border-orange" placeholder="What makes this dish special?"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-2 block">Cook time (min)</label>
                  <input v-model="form.time" type="number" class="w-full bg-background-secondary border-1.5 border-glass-border rounded-xl p-4 text-[15px] outline-none focus:border-orange" placeholder="e.g. 25" />
                </div>
                <div>
                  <label class="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-2 block">Servings</label>
                  <input v-model="form.servings" type="number" class="w-full bg-background-secondary border-1.5 border-glass-border rounded-xl p-4 text-[15px] outline-none focus:border-orange" placeholder="e.g. 2" />
                </div>
              </div>
            </div>
          </div>

          <!-- Step 1: Ingredients -->
          <div v-if="step === 1" class="space-y-4">
            <div v-for="(ing, i) in form.ingredients" :key="i" class="flex gap-3">
              <input v-model="ing.name" class="flex-1 bg-background-secondary border-1.5 border-glass-border rounded-xl p-3.5 text-sm outline-none focus:border-orange" :placeholder="`Ingredient ${i+1}`" />
              <input v-model="ing.qty" class="w-24 bg-background-secondary border-1.5 border-glass-border rounded-xl p-3.5 text-sm outline-none focus:border-orange" placeholder="Amount" />
              <button @click="removeIngredient(i)" class="w-10 h-10 shrink-0 border-1.5 border-glass-border rounded-full flex items-center justify-center text-text-dim hover:border-red-500 hover:text-red-500 transition-all">✕</button>
            </div>
            <button @click="addIngredient" class="w-full py-3.5 border-1.5 border-dashed border-glass-border rounded-xl text-text-dim font-bold text-xs hover:border-orange hover:text-orange">+ Add ingredient</button>
          </div>

          <!-- Step 2: Method -->
          <div v-if="step === 2" class="space-y-4">
            <div v-for="(s, i) in form.steps" :key="i" class="flex gap-4">
              <div class="w-9 h-9 rounded-full bg-orange text-white font-montserrat font-extrabold text-sm flex items-center justify-center shrink-0 mt-1">{{ i + 1 }}</div>
              <textarea v-model="s.text" rows="2" class="flex-1 bg-background-secondary border-1.5 border-glass-border rounded-xl p-3.5 text-sm outline-none focus:border-orange" :placeholder="`Describe step ${i+1}...`"></textarea>
              <button @click="removeStep(i)" class="w-10 h-10 shrink-0 border-1.5 border-glass-border rounded-full flex items-center justify-center text-text-dim hover:border-red-500 hover:text-red-500 transition-all">✕</button>
            </div>
            <button @click="addStep" class="w-full py-3.5 border-1.5 border-dashed border-glass-border rounded-xl text-text-dim font-bold text-xs hover:border-orange hover:text-orange">+ Add step</button>
          </div>

          <!-- Step 3: Nutrition -->
          <div v-if="step === 3" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div v-for="n in [
                {k:'cals', i:'⚡', l:'Calories', u:'kcal'},
                {k:'protein', i:'💪', l:'Protein', u:'g'},
                {k:'carbs', i:'🌾', l:'Carbs', u:'g'},
                {k:'fat', i:'🥑', l:'Fat', u:'g'}
              ]" :key="n.k" class="p-5 bg-background-secondary border-1.5 border-glass-border rounded-2xl focus-within:border-orange transition-all">
                <span class="text-2xl mb-2 block">{{ n.i }}</span>
                <label class="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1 block">{{ n.l }}</label>
                <input v-model="form[n.k as keyof typeof form]" type="number" class="w-full bg-transparent border-none outline-none font-montserrat font-extrabold text-2xl text-text" placeholder="0" />
                <span class="text-xs text-text-dim">{{ n.u }} per serving</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer v-if="step < 4" class="p-6 px-8 border-t border-glass-border flex gap-4">
        <button v-if="step > 0" @click="step--" class="px-8 py-3.5 rounded-xl border-1.5 border-glass-border font-bold text-sm text-text-muted hover:bg-background-secondary">Back</button>
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
