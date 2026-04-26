<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { preferencesApi } from '@/http/endpoints/preferences'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const step = ref(0)
const isSaving = ref(false)

const steps = ["Dietary Preferences", "Health Goals", "Follow Creators"]

const diets = ["Vegan", "Vegetarian", "Keto", "Paleo", "Gluten-Free", "Dairy-Free", "Pescatarian", "Low-Carb", "Mediterranean", "No restrictions"]
const selectedDiets = ref<string[]>([])

const goals = [
  { id: "lose", icon: "🏃", label: "Lose Weight", desc: "Caloric deficit meals" },
  { id: "muscle", icon: "💪", label: "Build Muscle", desc: "High-protein focus" },
  { id: "health", icon: "🥗", label: "Eat Healthier", desc: "Balanced nutrition" },
  { id: "explore", icon: "🌍", label: "Explore Cuisines", desc: "Try new flavors" },
]
const selectedGoals = ref<string[]>([])

function toggle(arr: string[], val: string) {
  const index = arr.indexOf(val)
  if (index > -1) arr.splice(index, 1)
  else arr.push(val)
}

async function finish() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await preferencesApi.update({
      dietary: selectedDiets.value,
      cuisines: selectedGoals.value, // Mapping goals to cuisines for now as per schema
    })
    uiStore.showToast('Preferences saved!', 'success')
    router.push('/')
  } catch (error) {
    console.error('Failed to save preferences:', error)
    uiStore.showToast('Failed to save preferences', 'error')
    router.push('/') // Still go to home if failed
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="onboarding-page h-screen flex items-center justify-center bg-background p-6">
    <div class="ob-card w-full max-w-[520px] bg-glass backdrop-blur-2xl border-1.5 border-glass-border rounded-[32px] p-10 shadow-modal animate-revamp">

      <!-- Progress -->
      <div class="flex gap-2 mb-8">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="h-1.5 flex-1 rounded-full transition-all duration-500"
          :class="step >= i ? 'bg-orange' : 'bg-background-secondary'"
        ></div>
      </div>

      <div v-if="step === 0" class="animate-fadeIn">
        <h2 class="font-montserrat font-extrabold text-3xl tracking-tight mb-2">Eat how you like</h2>
        <p class="text-text-dim text-sm mb-8">Choose your dietary preferences so we can personalize your feed.</p>

        <div class="flex flex-wrap gap-2.5 mb-10">
          <button
            v-for="diet in diets"
            :key="diet"
            @click="toggle(selectedDiets, diet)"
            :class="[
              'px-5 py-2.5 rounded-full border-1.5 text-sm font-semibold transition-all',
              selectedDiets.includes(diet) ? 'bg-orange border-orange text-white shadow-card' : 'bg-transparent border-glass-border text-text-muted hover:border-orange'
            ]"
          >
            {{ diet }}
          </button>
        </div>
      </div>

      <div v-if="step === 1" class="animate-fadeIn">
        <h2 class="font-montserrat font-extrabold text-3xl tracking-tight mb-2">What's your goal?</h2>
        <p class="text-text-dim text-sm mb-8">This helps us recommend the best macros for your daily intake.</p>

        <div class="grid grid-cols-2 gap-4 mb-10">
          <button
            v-for="goal in goals"
            :key="goal.id"
            @click="toggle(selectedGoals, goal.id)"
            :class="[
              'p-5 rounded-2xl border-1.5 text-left transition-all',
              selectedGoals.includes(goal.id) ? 'bg-orange-soft border-orange' : 'bg-transparent border-glass-border hover:border-orange'
            ]"
          >
            <span class="text-2xl mb-3 block">{{ goal.icon }}</span>
            <div class="font-bold text-sm mb-1" :class="selectedGoals.includes(goal.id) ? 'text-orange' : 'text-text'">{{ goal.label }}</div>
            <div class="text-[11px] text-text-dim leading-tight">{{ goal.desc }}</div>
          </button>
        </div>
      </div>

      <div v-if="step === 2" class="animate-fadeIn">
        <div class="text-center py-10">
          <div class="w-20 h-20 bg-orange-soft rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✨</div>
          <h2 class="font-montserrat font-extrabold text-3xl tracking-tight mb-2">All set!</h2>
          <p class="text-text-dim text-sm max-w-xs mx-auto mb-8">Your personalized Nutrisipe experience is ready. Let's start cooking!</p>
        </div>
      </div>

      <div class="flex gap-4">
        <button
          v-if="step > 0"
          @click="step--"
          class="px-8 py-4 rounded-btn border-1.5 border-glass-border font-montserrat font-bold text-sm text-text-muted hover:bg-background-secondary transition-all"
        >
          Back
        </button>
        <button
          @click="step < 2 ? step++ : finish()"
          class="flex-1 btn-primary"
        >
          {{ step < 2 ? 'Continue →' : 'Get Started' }}
        </button>
      </div>

      <button v-if="step < 2" @click="finish" class="w-full mt-6 text-xs font-bold text-text-dim hover:text-orange transition-all">
        Skip for now
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.4s ease-out;
}
</style>
