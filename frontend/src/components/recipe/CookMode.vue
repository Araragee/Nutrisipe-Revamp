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

interface StepTimer {
  id: number
  label: string
  remaining: number
}

const timers = ref<StepTimer[]>([])
let timerId = 0
let tick: ReturnType<typeof setInterval> | null = null
let touchX = 0

const total = computed(() => props.instructions.length)
const current = computed(() => props.instructions[currentIndex.value])
const progress = computed(() =>
  total.value > 0 ? ((currentIndex.value + 1) / total.value) * 100 : 0,
)
const isFirst = computed(() => currentIndex.value === 0)
const isLast = computed(() => currentIndex.value >= total.value - 1)

const stepDurations = computed(() => {
  const text = current.value?.text ?? ''
  const re = /(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/gi
  const out: { label: string; seconds: number }[] = []
  for (const m of text.matchAll(re)) {
    const n = parseFloat(m[2] ?? m[1])
    const unit = m[3].toLowerCase()
    const mult = unit.startsWith('h') ? 3600 : unit.startsWith('s') ? 1 : 60
    if (n > 0) out.push({ label: m[0], seconds: Math.round(n * mult) })
  }
  return out
})

function next() {
  if (!isLast.value) currentIndex.value++
}
function prev() {
  if (!isFirst.value) currentIndex.value--
}
function close() {
  emit('close')
}

function formatClock(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return `${h ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`
}

function startTimer(label: string, seconds: number) {
  timers.value.push({ id: ++timerId, label, remaining: seconds })
  tick ??= setInterval(onTick, 1000)
}

function removeTimer(id: number) {
  timers.value = timers.value.filter(t => t.id !== id)
  if (!timers.value.length && tick) {
    clearInterval(tick)
    tick = null
  }
}

function onTick() {
  for (const t of timers.value) {
    if (t.remaining <= 0) continue
    t.remaining--
    if (t.remaining === 0) {
      navigator.vibrate?.([300, 150, 300])
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        osc.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.6)
      } catch {
      }
    }
  }
}

function onTouchStart(e: TouchEvent) {
  touchX = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchX
  if (Math.abs(dx) < 60) return
  if (dx < 0) next()
  else prev()
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
      timers.value.forEach(t => removeTimer(t.id))
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
  if (tick) clearInterval(tick)
  releaseWakeLock()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="cook-mode fixed inset-0 z-[200] flex flex-col bg-background"
    >
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

      <div class="h-1.5 bg-background-secondary">
        <div class="h-full bg-orange transition-all duration-500" :style="{ width: `${progress}%` }"></div>
      </div>

      <main
        class="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 md:p-16 text-center overflow-y-auto"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <p class="font-montserrat font-extrabold text-orange text-[11px] uppercase tracking-[0.3em] mb-6">
          Step {{ current?.step ?? currentIndex + 1 }} of {{ total }}
        </p>
        <p class="font-montserrat font-extrabold text-2xl sm:text-3xl md:text-5xl leading-snug max-w-3xl">{{ current?.text }}</p>
        <div v-if="stepDurations.length" class="mt-8 flex flex-wrap justify-center gap-2">
          <button
            v-for="d in stepDurations"
            :key="d.label"
            @click="startTimer(d.label, d.seconds)"
            class="h-11 px-5 rounded-full bg-orange/10 text-orange border border-orange/30 text-sm font-bold hover:bg-orange/20 active:scale-95 transition-all dark:bg-orange/15"
          >⏱ Start {{ d.label }} timer</button>
        </div>
      </main>

      <div v-if="timers.length" class="px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto border-t border-border bg-surface/80" aria-live="polite">
        <div
          v-for="t in timers"
          :key="t.id"
          :class="t.remaining === 0 ? 'bg-green-500 text-white border-green-500 animate-pulse' : 'bg-background-secondary text-text border-border'"
          class="shrink-0 h-11 pl-4 pr-1 rounded-full border flex items-center gap-3 tabular-nums"
        >
          <span class="text-xs font-semibold opacity-70 max-w-32 truncate">{{ t.label }}</span>
          <span class="font-montserrat font-extrabold">{{ t.remaining === 0 ? 'Done!' : formatClock(t.remaining) }}</span>
          <button @click="removeTimer(t.id)" class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10" :aria-label="`Dismiss ${t.label} timer`">✕</button>
        </div>
      </div>

      <footer class="p-4 sm:p-6 md:p-8 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-surface/80">
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
        <p class="text-text-dim text-[10px] text-center mt-3 md:hidden">Swipe to change step</p>
      </footer>
    </div>
  </Teleport>
</template>
