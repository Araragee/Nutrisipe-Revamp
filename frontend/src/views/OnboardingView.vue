<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { preferencesApi } from '@/http/endpoints/preferences'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const step = ref(0)
const isSaving = ref(false)

const steps = ['Dietary Preferences', 'Health Goals', 'Follow Creators'] as const

const diets = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Pescatarian', 'Low-Carb', 'Mediterranean', 'No restrictions']
const selectedDiets = ref<string[]>([])

const goals = [
  { id: 'lose', icon: '🏃', label: 'Lose Weight', desc: 'Caloric deficit meals' },
  { id: 'muscle', icon: '💪', label: 'Build Muscle', desc: 'High-protein focus' },
  { id: 'health', icon: '🥗', label: 'Eat Healthier', desc: 'Balanced nutrition' },
  { id: 'explore', icon: '🌍', label: 'Explore Cuisines', desc: 'Try new flavors' },
]
const selectedGoals = ref<string[]>([])

const creators = [
  { id: 1, name: 'Maya Chen', img: 'https://picsum.photos/80/80?random=11' },
  { id: 2, name: 'James Rivera', img: 'https://picsum.photos/80/80?random=12' },
  { id: 3, name: 'Emma Lake', img: 'https://picsum.photos/80/80?random=13' },
  { id: 4, name: 'Yuki Tanaka', img: 'https://picsum.photos/80/80?random=14' },
  { id: 5, name: 'Sofia Reyes', img: 'https://picsum.photos/80/80?random=15' },
]
const selectedCreators = ref<number[]>([])

function toggleArr<T>(arr: T[], val: T) {
  const i = arr.indexOf(val)
  if (i > -1) arr.splice(i, 1)
  else arr.push(val)
}

const fillPct = (i: number) => step.value > i ? '100%' : step.value === i ? '60%' : '0%'

const ctaLabel = computed(() => step.value < 2 ? 'Continue →' : 'Start exploring →')

async function finish() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await preferencesApi.update({
      dietary: selectedDiets.value,
      cuisines: selectedGoals.value,
    })
    uiStore.showToast('Preferences saved!', 'success')
    router.push('/')
  } catch (error) {
    console.error('Failed to save preferences:', error)
    uiStore.showToast('Failed to save preferences', 'error')
    router.push('/')
  } finally {
    isSaving.value = false
  }
}

function next() {
  if (step.value < 2) step.value++
  else finish()
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-background p-6">
    <div class="ob-card w-full max-w-[560px] bg-surface dark:bg-zinc-900 border border-glass-border rounded-[32px] p-12 px-12 shadow-modal animate-revamp">

      <!-- Progress bars -->
      <div class="flex gap-2 mb-10">
        <div v-for="(s, i) in steps" :key="i" class="flex-1 h-1 rounded-full bg-background-secondary overflow-hidden">
          <div class="h-full rounded-full bg-orange transition-all duration-500" :style="{ width: fillPct(i) }"></div>
        </div>
      </div>

      <!-- Step number -->
      <p class="text-xs text-text-dim font-bold mb-2 uppercase tracking-widest font-montserrat">Step {{ step + 1 }} of 3 — {{ steps[step] }}</p>

      <!-- Step 0: Dietary -->
      <div v-if="step === 0" class="animate-fadeIn">
        <h2 class="font-montserrat font-extrabold text-[28px] tracking-tight text-text mb-2">What's your diet?</h2>
        <p class="text-text-muted text-[15px] mb-8 leading-relaxed">We'll personalize your recipe feed based on your preferences.</p>
        <div class="flex flex-wrap gap-2.5 mb-9">
          <button
            v-for="diet in diets" :key="diet"
            @click="toggleArr(selectedDiets, diet)"
            :class="[
              'px-4.5 py-2.5 rounded-full border-1.5 text-sm font-medium transition-all',
              selectedDiets.includes(diet)
                ? 'bg-orange border-orange text-white shadow-[0_4px_14px_var(--orange-glow)]'
                : 'bg-transparent border-glass-border text-text hover:border-orange',
            ]"
          >{{ diet }}</button>
        </div>
      </div>

      <!-- Step 1: Goals -->
      <div v-else-if="step === 1" class="animate-fadeIn">
        <h2 class="font-montserrat font-extrabold text-[28px] tracking-tight text-text mb-2">What's your goal?</h2>
        <p class="text-text-muted text-[15px] mb-8 leading-relaxed">Choose what matters most — you can always change this later.</p>
        <div class="grid grid-cols-2 gap-3 mb-9">
          <button
            v-for="g in goals" :key="g.id"
            @click="toggleArr(selectedGoals, g.id)"
            :class="[
              'p-5 rounded-[18px] border-1.5 text-left transition-all',
              selectedGoals.includes(g.id)
                ? 'border-orange bg-orange/10'
                : 'border-glass-border bg-transparent hover:border-orange',
            ]"
          >
            <span class="text-2xl mb-2 block">{{ g.icon }}</span>
            <div class="font-montserrat font-bold text-sm mb-1" :class="selectedGoals.includes(g.id) ? 'text-orange' : 'text-text'">{{ g.label }}</div>
            <div class="text-xs text-text-dim">{{ g.desc }}</div>
          </button>
        </div>
      </div>

      <!-- Step 2: Creators -->
      <div v-else class="animate-fadeIn">
        <h2 class="font-montserrat font-extrabold text-[28px] tracking-tight text-text mb-2">Follow 5 creators</h2>
        <p class="text-text-muted text-[15px] mb-8 leading-relaxed">Start your feed with content from people who inspire you.</p>
        <div class="grid grid-cols-5 gap-3.5 mb-7">
          <button
            v-for="c in creators" :key="c.id"
            @click="toggleArr(selectedCreators, c.id)"
            class="flex flex-col items-center gap-2 cursor-pointer"
          >
            <div :class="[
              'w-14 h-14 rounded-full overflow-hidden transition-all',
              selectedCreators.includes(c.id) ? 'border-[3px] border-orange scale-105' : 'border-[3px] border-transparent',
            ]">
              <img :src="c.img" :alt="c.name" class="w-full h-full object-cover" />
            </div>
            <div class="text-[11px] text-text-muted font-medium text-center">{{ c.name.split(' ')[0] }}</div>
          </button>
        </div>
        <div class="text-[13px] text-text-dim mb-6">{{ selectedCreators.length }} / 5 selected</div>
      </div>

      <!-- Footer buttons -->
      <div class="flex gap-3">
        <button v-if="step > 0" @click="step--" class="flex-1 px-6 py-3.5 rounded-btn border-1.5 border-glass-border font-montserrat font-semibold text-sm text-text hover:border-orange hover:text-orange transition-all">Back</button>
        <button @click="next" :disabled="isSaving" class="flex-1 px-6 py-3.5 rounded-btn bg-gradient-to-br from-orange to-orange-light text-white font-montserrat font-bold text-sm shadow-[0_6px_24px_var(--orange-glow)] hover:-translate-y-0.5 transition-all disabled:opacity-60">
          {{ isSaving ? 'Saving...' : ctaLabel }}
        </button>
      </div>

      <button v-if="step < 2" @click="finish" class="w-full mt-5 text-xs font-bold text-text-dim hover:text-orange transition-all">Skip for now</button>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.4s ease-out; }
.animate-revamp { animation: fadeIn 0.5s var(--transition); }
</style>
