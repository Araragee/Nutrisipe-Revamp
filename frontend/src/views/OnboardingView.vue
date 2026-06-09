<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { preferencesApi } from '@/http/endpoints/preferences'
import { usersApi } from '@/http/endpoints/users'
import { socialApi } from '@/http/endpoints/social'
import { resolveImage } from '@/utils/imageUrl'
import BrandMeshBackground from '@/components/common/BrandMeshBackground.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const step = ref(0)
const isSaving = ref(false)
const isLoadingCreators = ref(false)

const steps = ['Dietary Preferences', 'Health Goals', 'Follow Creators'] as const

const diets = [
  'Vegan',
  'Vegetarian',
  'Keto',
  'Paleo',
  'Gluten-Free',
  'Dairy-Free',
  'Pescatarian',
  'Low-Carb',
  'Mediterranean',
  'No restrictions',
]
const selectedDiets = ref<string[]>([])

const goals = [
  { id: 'lose', icon: '🏃', label: 'Lose Weight', desc: 'Caloric deficit meals' },
  { id: 'muscle', icon: '💪', label: 'Build Muscle', desc: 'High-protein focus' },
  { id: 'health', icon: '🥗', label: 'Eat Healthier', desc: 'Balanced nutrition' },
  { id: 'explore', icon: '🌍', label: 'Explore Cuisines', desc: 'Try new flavors' },
]
const selectedGoals = ref<string[]>([])

interface CreatorCard {
  id: string
  displayName: string
  username: string
  avatarUrl: string | null
  followerCount: number
  postCount: number
  bio: string | null
}
const creators = ref<CreatorCard[]>([])
const selectedCreators = ref<Set<string>>(new Set())

function toggleArr<T>(arr: T[], val: T) {
  const i = arr.indexOf(val)
  if (i > -1) arr.splice(i, 1)
  else arr.push(val)
}

function toggleCreator(id: string) {
  const next = new Set(selectedCreators.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedCreators.value = next
}

async function loadCreators() {
  if (creators.value.length > 0) return
  isLoadingCreators.value = true
  try {
    const response = await usersApi.getPopular(12)
    creators.value = response.data.data.map((u: any) => ({
      id: u.id,
      displayName: u.displayName,
      username: u.username,
      avatarUrl: u.avatarUrl,
      followerCount: u.followerCount ?? 0,
      postCount: u.postCount ?? 0,
      bio: u.bio,
    }))
  } catch (error) {
    console.error('Failed to load creators:', error)
  } finally {
    isLoadingCreators.value = false
  }
}

const fillPct = (i: number) =>
  step.value > i ? '100%' : step.value === i ? '60%' : '0%'

const ctaLabel = computed(() => (step.value < 2 ? 'Continue →' : 'Start exploring →'))

const canContinue = computed(() => {
  if (step.value === 0) return selectedDiets.value.length > 0
  if (step.value === 1) return selectedGoals.value.length > 0
  return true
})

const goalIconMap = computed(() =>
  Object.fromEntries(goals.map((g) => [g.id, g.icon])),
)

async function finish() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const followIds = Array.from(selectedCreators.value)
    await Promise.allSettled([
      preferencesApi.update({
        dietary: selectedDiets.value,
        cuisines: selectedGoals.value,
      }),
      ...followIds.map((id) => socialApi.followUser(id)),
    ])
    uiStore.showToast('You’re all set!', 'success')
    router.push('/')
  } catch (error) {
    logger.error('Failed to save onboarding:', error)
    uiStore.showToast('Failed to save preferences', 'error')
    router.push('/')
  } finally {
    isSaving.value = false
  }
}

function next() {
  if (step.value < 2) {
    step.value++
    if (step.value === 2) loadCreators()
  } else {
    finish()
  }
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>

<template>
  <div class="onboarding-view relative min-h-screen bg-background overflow-hidden">
    <BrandMeshBackground variant="morning" :intensity="0.85" />

    <div class="relative z-10 min-h-screen flex flex-col lg:flex-row">
      <!-- Left: copy + nav -->
      <aside class="lg:w-2/5 xl:w-1/3 flex flex-col justify-between p-8 md:p-12 lg:p-16">
        <div>
          <div class="flex items-center gap-2.5 mb-12">
            <span class="logo-mark w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 22 28" fill="none" class="w-[22px] h-[26px]">
                <path d="M 4,25 C 4,18 4,9 5,4 C 9,10 13,19 17,25 C 17,17 17,9 18,4"
                  stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="font-montserrat font-black text-xl tracking-tight text-text">
              Nutri<span class="text-orange">sipe</span>
            </span>
          </div>

          <p class="text-orange font-bold text-[11px] uppercase tracking-[0.3em] mb-3">
            Step {{ step + 1 }} of 3
          </p>
          <h1 class="font-montserrat font-extrabold text-4xl md:text-5xl tracking-tight leading-[1.05] mb-4 text-text">
            <template v-if="step === 0">What's your<br /><span class="text-orange">flavor</span>?</template>
            <template v-else-if="step === 1">Your<br /><span class="text-orange">goal</span> sets the tone.</template>
            <template v-else>Find your<br /><span class="text-orange">people</span>.</template>
          </h1>
          <p class="text-text-muted text-base leading-relaxed max-w-md">
            <template v-if="step === 0">Tell us your dietary preferences. We'll filter the feed so every scroll feels made for you.</template>
            <template v-else-if="step === 1">Pick what matters most right now — the feed weighs recipes accordingly.</template>
            <template v-else>Follow chefs and home cooks whose food makes you hungry. Tap any tile.</template>
          </p>

          <!-- Live taste preview -->
          <div v-if="step > 0" class="mt-10 space-y-3">
            <p class="text-text-dim text-[10px] font-bold uppercase tracking-widest">Your taste so far</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="d in selectedDiets"
                :key="d"
                class="px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-bold border border-orange/30"
              >{{ d }}</span>
              <template v-if="step > 1">
                <span
                  v-for="g in selectedGoals"
                  :key="g"
                  class="px-3 py-1 rounded-full bg-background-secondary text-text text-xs font-bold border border-glass-border"
                >{{ goalIconMap[g] }} {{ goals.find(x => x.id === g)?.label }}</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Progress bars + Skip -->
        <div class="mt-12">
          <div class="flex gap-2 mb-4">
            <div
              v-for="(s, i) in steps"
              :key="s"
              class="flex-1 h-1 rounded-full bg-background-secondary overflow-hidden"
            >
              <div
                class="h-full rounded-full bg-orange transition-all duration-500"
                :style="{ width: fillPct(i) }"
              ></div>
            </div>
          </div>
          <button
            v-if="step < 2"
            @click="finish"
            class="text-xs font-bold text-text-dim hover:text-orange transition-all"
          >Skip for now →</button>
        </div>
      </aside>

      <!-- Right: step content -->
      <section class="flex-1 flex flex-col p-8 md:p-12 lg:p-16">
        <div class="flex-1">
          <!-- Step 0: Dietary -->
          <div v-if="step === 0" class="animate-fadeIn">
            <div class="flex flex-wrap gap-2.5 max-w-3xl">
              <button
                v-for="diet in diets"
                :key="diet"
                @click="toggleArr(selectedDiets, diet)"
                :class="[
                  'px-5 py-3 rounded-full border-1.5 text-sm font-bold transition-all backdrop-blur-sm',
                  selectedDiets.includes(diet)
                    ? 'bg-orange border-orange text-white shadow-[0_4px_18px_var(--orange-glow)] scale-105'
                    : 'bg-surface/60 border-glass-border text-text hover:border-orange',
                ]"
              >{{ diet }}</button>
            </div>
          </div>

          <!-- Step 1: Goals -->
          <div v-else-if="step === 1" class="animate-fadeIn">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              <button
                v-for="g in goals"
                :key="g.id"
                @click="toggleArr(selectedGoals, g.id)"
                :class="[
                  'group p-7 rounded-3xl border-1.5 text-left transition-all backdrop-blur-sm',
                  selectedGoals.includes(g.id)
                    ? 'border-orange bg-orange/15 shadow-[0_8px_30px_var(--orange-glow)]'
                    : 'border-glass-border bg-surface/60 hover:border-orange hover:-translate-y-0.5',
                ]"
              >
                <span class="text-3xl mb-3 block">{{ g.icon }}</span>
                <div
                  class="font-montserrat font-extrabold text-lg mb-1"
                  :class="selectedGoals.includes(g.id) ? 'text-orange' : 'text-text'"
                >{{ g.label }}</div>
                <div class="text-sm text-text-dim">{{ g.desc }}</div>
              </button>
            </div>
          </div>

          <!-- Step 2: Creators wall -->
          <div v-else class="animate-fadeIn">
            <div v-if="isLoadingCreators" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div
                v-for="i in 8"
                :key="i"
                class="aspect-[3/4] bg-background-secondary rounded-2xl animate-pulse"
              ></div>
            </div>

            <div v-else-if="creators.length > 0">
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <button
                  v-for="c in creators"
                  :key="c.id"
                  @click="toggleCreator(c.id)"
                  :class="[
                    'creator-tile relative aspect-[3/4] rounded-2xl overflow-hidden group transition-all',
                    selectedCreators.has(c.id)
                      ? 'ring-[3px] ring-orange scale-[1.03] shadow-[0_10px_30px_var(--orange-glow)]'
                      : 'ring-1 ring-glass-border hover:-translate-y-0.5',
                  ]"
                >
                  <img
                    :src="resolveImage(c.avatarUrl, c.id)"
                    :alt="c.displayName"
                    class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                  <div
                    v-if="selectedCreators.has(c.id)"
                    class="absolute top-2 right-2 w-7 h-7 rounded-full bg-orange flex items-center justify-center text-white text-sm font-bold shadow-lg"
                  >✓</div>

                  <div
                    v-if="c.followerCount > 0"
                    class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider"
                  >{{ c.followerCount }} ★</div>

                  <div class="absolute inset-x-0 bottom-0 p-3 text-left">
                    <p class="text-white font-montserrat font-extrabold text-sm leading-tight drop-shadow-md truncate">{{ c.displayName }}</p>
                    <p class="text-white/75 text-[11px] font-bold truncate">@{{ c.username }}</p>
                    <p class="text-white/60 text-[10px] mt-0.5">{{ c.postCount }} recipes</p>
                  </div>
                </button>
              </div>

              <p class="mt-6 text-text-dim text-sm">
                <span class="font-extrabold text-orange">{{ selectedCreators.size }}</span> selected — follow as many as you like
              </p>
            </div>

            <div v-else class="text-center py-16 text-text-dim">
              <p class="text-base">No creators yet. You can find them later from the Explore page.</p>
            </div>
          </div>
        </div>

        <!-- Footer CTA -->
        <div class="flex gap-3 mt-10 max-w-3xl">
          <button
            v-if="step > 0"
            @click="step--"
            class="flex-1 sm:flex-none sm:px-10 py-4 rounded-2xl border-1.5 border-glass-border bg-surface/60 backdrop-blur font-montserrat font-bold text-sm text-text hover:border-orange hover:text-orange transition-all"
          >← Back</button>
          <button
            @click="next"
            :disabled="isSaving || !canContinue"
            class="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-br from-orange to-orange-light text-white font-montserrat font-bold text-sm shadow-[0_8px_28px_var(--orange-glow)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
          >{{ isSaving ? 'Saving…' : ctaLabel }}</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-mark {
  background: linear-gradient(135deg, var(--orange) 0%, var(--orange-light) 100%);
  box-shadow: 0 4px 14px var(--orange-glow);
}

.creator-tile {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease;
}
</style>
