<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useToast } from '@/composables/useToast'
import Toast from '@/components/ui/Toast.vue'

const { toasts, removeToast } = useToast()

// Respect prefers-reduced-motion: disables the auto-dismiss progress timer
// inside each Toast and swaps TransitionGroup for instant fades.
const reducedMotion = ref(false)
let mql: MediaQueryList | null = null

function syncMotion(e: MediaQueryList | MediaQueryListEvent) {
  reducedMotion.value = e.matches
}

onMounted(() => {
  if (typeof window === 'undefined' || !window.matchMedia) return
  mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncMotion(mql)
  mql.addEventListener('change', syncMotion)
})

onBeforeUnmount(() => {
  mql?.removeEventListener('change', syncMotion)
})
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-4 top-4 z-[9999] flex flex-col items-center gap-2.5 sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-[380px] sm:items-stretch"
    role="region"
    aria-label="Notifications"
  >
    <TransitionGroup :name="reducedMotion ? 'toast-fade' : 'toast'" tag="div" class="flex w-full flex-col gap-2.5">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        :reduced-motion="reducedMotion"
        @dismiss="removeToast"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Enter: slide in from the right with a subtle spring + scale.
   Leave: softer, smaller drift so exits feel quieter than enters.
   Move: smoothly reflow remaining toasts when one is removed (stacking). */
.toast-enter-active {
  transition:
    transform 0.42s cubic-bezier(0.34, 1.2, 0.64, 1),
    opacity 0.42s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.toast-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1),
    opacity 0.3s ease-out;
  /* take out of flow so siblings glide up via .toast-move */
  position: absolute;
  width: 100%;
}

.toast-move {
  transition: transform 0.42s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translate3d(40px, 0, 0) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translate3d(0, -10px, 0) scale(0.97);
}

/* Reduced-motion variant: instant, opacity-only. */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.12s linear;
}

.toast-fade-leave-active {
  position: absolute;
  width: 100%;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}
</style>
