<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Toast } from '@/composables/useToast'

interface Props {
  toast: Toast
  /** Skip the auto-dismiss timer + progress bar (e.g. prefers-reduced-motion). */
  reducedMotion?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  reducedMotion: false,
})

const emit = defineEmits<{
  (e: 'dismiss', id: number): void
  (e: 'action', id: number): void
}>()

// --- role-aware styling -----------------------------------------------------
const roleStyle = computed(() => ({
  success: {
    accent: 'text-emerald-600 dark:text-emerald-400',
    ring: 'bg-emerald-500/12 ring-emerald-500/25',
    bar: 'bg-emerald-500 dark:bg-emerald-400',
  },
  error: {
    accent: 'text-red-600 dark:text-red-400',
    ring: 'bg-red-500/12 ring-red-500/25',
    bar: 'bg-red-500 dark:bg-red-400',
  },
  warning: {
    accent: 'text-amber-600 dark:text-amber-400',
    ring: 'bg-amber-500/12 ring-amber-500/25',
    bar: 'bg-amber-500 dark:bg-amber-400',
  },
  info: {
    accent: 'text-orange dark:text-orange',
    ring: 'bg-orange/12 ring-orange/25',
    bar: 'bg-orange',
  },
}[props.toast.type]))

// error speaks assertively, everything else politely
const liveMode = computed(() => (props.toast.type === 'error' ? 'assertive' : 'polite'))
const liveRole = computed(() => (props.toast.type === 'error' ? 'alert' : 'status'))

// --- auto-dismiss timer + progress -----------------------------------------
const duration = computed(() => props.toast.duration)
const hasTimer = computed(() => !props.reducedMotion && duration.value > 0)

const progress = ref(1) // 1 -> 0
const paused = ref(false)
let rafId = 0
let startedAt = 0
let elapsedBeforePause = 0

function tick(now: number) {
  if (paused.value) return
  const elapsed = elapsedBeforePause + (now - startedAt)
  const remaining = Math.max(0, 1 - elapsed / duration.value)
  progress.value = remaining
  if (remaining <= 0) {
    emit('dismiss', props.toast.id)
    return
  }
  rafId = requestAnimationFrame(tick)
}

function startTimer() {
  if (!hasTimer.value) return
  startedAt = performance.now()
  rafId = requestAnimationFrame(tick)
}

function pauseTimer() {
  if (!hasTimer.value || paused.value) return
  paused.value = true
  cancelAnimationFrame(rafId)
  elapsedBeforePause += performance.now() - startedAt
}

function resumeTimer() {
  if (!hasTimer.value || !paused.value) return
  paused.value = false
  startedAt = performance.now()
  rafId = requestAnimationFrame(tick)
}

// --- swipe-to-dismiss -------------------------------------------------------
const dragX = ref(0)
const dragging = ref(false)
const exiting = ref(false)
let pointerId: number | null = null
let pointerStartX = 0

const SWIPE_THRESHOLD = 96 // px to trigger dismiss

const cardTransform = computed(() => {
  if (exiting.value) {
    return 'translate3d(120%, 0, 0)'
  }
  if (dragX.value !== 0) {
    return `translate3d(${dragX.value}px, 0, 0)`
  }
  return ''
})

// fade the card as it is dragged toward the dismiss edge
const cardOpacity = computed(() => {
  if (dragX.value <= 0) return 1
  return Math.max(0.35, 1 - dragX.value / (SWIPE_THRESHOLD * 2.2))
})

function onPointerDown(e: PointerEvent) {
  // ignore non-primary buttons; allow touch/pen/mouse
  if (e.button !== 0) return
  pointerId = e.pointerId
  pointerStartX = e.clientX
  dragging.value = true
  pauseTimer()
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) return
  // only allow rightward drag (matches exit direction)
  dragX.value = Math.max(0, e.clientX - pointerStartX)
}

function onPointerUp(e: PointerEvent) {
  if (!dragging.value || e.pointerId !== pointerId) return
  dragging.value = false
  pointerId = null
  if (dragX.value >= SWIPE_THRESHOLD) {
    exiting.value = true
    // spring-y exit handled by CSS transition on `transform`
    window.setTimeout(() => emit('dismiss', props.toast.id), 260)
  } else {
    // snap back, then keep counting down
    dragX.value = 0
    resumeTimer()
  }
}

// --- handlers ---------------------------------------------------------------
function onActionClick() {
  props.toast.action?.onClick()
  emit('action', props.toast.id)
  emit('dismiss', props.toast.id)
}

function dismiss() {
  emit('dismiss', props.toast.id)
}

onMounted(startTimer)
onBeforeUnmount(() => cancelAnimationFrame(rafId))
</script>

<template>
  <div
    :role="liveRole"
    :aria-live="liveMode"
    aria-atomic="true"
    class="toast-card group/toast pointer-events-auto relative w-full select-none overflow-hidden rounded-2xl border border-glass-border/70 bg-glass/80 shadow-modal ring-1 ring-black/[0.04] backdrop-blur-xl dark:border-white/10 dark:ring-white/[0.04]"
    :class="{ 'is-dragging': dragging, 'is-exiting': exiting }"
    :style="{ transform: cardTransform, opacity: cardOpacity, touchAction: 'pan-y' }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
    @focusin="pauseTimer"
    @focusout="resumeTimer"
  >
    <div class="flex items-start gap-3 p-3.5 pr-2.5">
      <!-- role icon -->
      <span
        class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1"
        :class="[roleStyle.ring, roleStyle.accent]"
        aria-hidden="true"
      >
        <svg v-if="toast.type === 'success'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        <svg v-else-if="toast.type === 'error'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        <svg v-else-if="toast.type === 'warning'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
      </span>

      <!-- message + action -->
      <div class="min-w-0 flex-1 pt-0.5">
        <p class="font-inter text-[13.5px] font-medium leading-snug text-text [text-wrap:pretty]">
          {{ toast.message }}
        </p>
        <button
          v-if="toast.action"
          type="button"
          class="mt-2 inline-flex items-center rounded-lg px-2.5 py-1 font-montserrat text-[11px] font-bold uppercase tracking-wide transition-[color,background-color,transform] duration-150 ease-revamp active:scale-[0.96]"
          :class="roleStyle.accent"
          @click.stop="onActionClick"
        >
          {{ toast.action.label }}
        </button>
      </div>

      <!-- dismiss -->
      <button
        type="button"
        aria-label="Dismiss notification"
        class="relative -m-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-text-dim transition-[color,background-color,transform] duration-150 ease-revamp hover:bg-black/5 hover:text-text active:scale-[0.96] dark:hover:bg-white/10"
        @click.stop="dismiss"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>

    <!-- auto-dismiss progress bar -->
    <div
      v-if="hasTimer"
      class="absolute inset-x-0 bottom-0 h-[3px] origin-left rounded-full transition-opacity duration-150"
      :class="[roleStyle.bar, paused ? 'opacity-40' : 'opacity-90']"
      :style="{ transform: `scaleX(${progress})` }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.toast-card {
  transition:
    transform 0.32s cubic-bezier(0.34, 1.2, 0.64, 1),
    opacity 0.24s ease-out;
  will-change: transform;
}

/* while finger/pointer is down, follow it 1:1 with no easing lag */
.toast-card.is-dragging {
  transition: none;
}

/* spring-y fling-off on dismiss */
.toast-card.is-exiting {
  transition:
    transform 0.26s cubic-bezier(0.34, 1.2, 0.64, 1),
    opacity 0.26s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .toast-card,
  .toast-card.is-exiting {
    transition: opacity 0.12s linear;
  }
}
</style>
