<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Instruction {
  step: number
  text: string
}

const props = defineProps<{
  show: boolean
  title: string
  instructions: Instruction[]
}>()

const emit = defineEmits<{
  close: []
}>()

const currentIndex = ref(0)
let wakeLock: any = null
const wakeLockActive = ref(false)

const total = computed(() => props.instructions.length)
const current = computed(() => props.instructions[currentIndex.value])
const progress = computed(() =>
  total.value > 0 ? ((currentIndex.value + 1) / total.value) * 100 : 0,
)
const isFirst = computed(() => currentIndex.value === 0)
const isLast = computed(() => currentIndex.value >= total.value - 1)

function next() {
  if (!isLast.value) currentIndex.value++
}
function prev() {
  if (!isFirst.value) currentIndex.value--
}
function close() {
  emit('close')
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen')
      wakeLockActive.value = true
      wakeLock?.addEventListener('release', () => {
        wakeLockActive.value = false
      })
    }
  } catch (error) {
    logger.warn('Wake lock unavailable:', error)
  }
}

async function releaseWakeLock() {
  try {
    if (wakeLock) {
      await wakeLock.release()
      wakeLock = null
      wakeLockActive.value = false
    }
  } catch {
    // ignore
  }
}

function handleVisibility() {
  if (document.visibilityState === 'visible' && props.show && !wakeLockActive.value) {
    requestWakeLock()
  }
}

function handleKey(e: KeyboardEvent) {
  if (!props.show) return
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

watch(
  () => props.show,
  async (val) => {
    if (val) {
      currentIndex.value = 0
      await requestWakeLock()
    } else {
      await releaseWakeLock()
    }
  },
)

onMounted(() => {
  document.addEventListener('keydown', handleKey)
  document.addEventListener('visibilitychange', handleVisibility)
  if (props.show) requestWakeLock()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKey)
  document.removeEventListener('visibilitychange', handleVisibility)
  releaseWakeLock()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="cook-mode fixed inset-0 z-[200] flex flex-col bg-background"
    >
      <!-- Header -->
      <header class="px-6 py-5 flex items-center justify-between border-b border-border bg-surface/80">
        <div class="flex-1 min-w-0">
          <p class="text-text-dim text-[10px] font-bold uppercase tracking-widest mb-0.5">Cook Mode</p>
          <h2 class="font-montserrat font-extrabold text-lg truncate">{{ title }}</h2>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="wakeLockActive" class="text-[10px] font-bold uppercase tracking-widest text-green-500 hidden sm:inline">● Screen on</span>
          <button @click="close" class="w-10 h-10 rounded-full bg-background-secondary border border-border text-xl flex items-center justify-center hover:text-orange">✕</button>
        </div>
      </header>

      <!-- Progress -->
      <div class="h-1.5 bg-background-secondary">
        <div class="h-full bg-orange transition-all duration-500" :style="{ width: `${progress}%` }"></div>
      </div>

      <!-- Step body -->
      <main class="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center overflow-y-auto">
        <p class="font-montserrat font-extrabold text-orange text-[11px] uppercase tracking-[0.3em] mb-6">
          Step {{ current?.step ?? currentIndex + 1 }} of {{ total }}
        </p>
        <p class="font-montserrat font-extrabold text-3xl md:text-5xl leading-snug max-w-3xl">{{ current?.text }}</p>
      </main>

      <!-- Footer controls -->
      <footer class="p-6 md:p-8 border-t border-border bg-surface/80">
        <div class="max-w-3xl mx-auto flex items-center gap-4">
          <button
            @click="prev"
            :disabled="isFirst"
            class="flex-1 h-14 rounded-2xl bg-background-secondary border-1.5 border-border text-sm font-bold disabled:opacity-40 hover:border-orange transition-all"
          >← Previous</button>
          <button
            v-if="!isLast"
            @click="next"
            class="flex-1 h-14 rounded-2xl bg-orange text-white text-sm font-bold shadow-lg shadow-orange/30 active:scale-95 transition-all"
          >Next →</button>
          <button
            v-else
            @click="close"
            class="flex-1 h-14 rounded-2xl bg-green-500 text-white text-sm font-bold shadow-lg shadow-green-500/30 active:scale-95 transition-all"
          >✓ Done</button>
        </div>
        <p class="text-text-dim text-[10px] text-center mt-3 hidden md:block">Use ← → arrows or Space · Esc to exit</p>
      </footer>
    </div>
  </Teleport>
</template>
