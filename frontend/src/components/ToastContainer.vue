<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const typeClasses = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
  error: 'bg-red-500/15 border-red-500/30 text-red-200',
  warning: 'bg-orange-500/15 border-orange-500/30 text-orange-200',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
}

const typeIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<template>
  <div class="fixed top-6 right-6 z-[9999] space-y-3 max-w-[360px] w-full pointer-events-none">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[typeClasses[toast.type], 'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl bg-[rgba(28,22,17,0.85)]']"
      >
        <span class="text-lg font-bold shrink-0 mt-0.5" :class="typeClasses[toast.type].split(' ')[2]">{{ typeIcons[toast.type] }}</span>
        <p class="flex-1 text-[13px] font-semibold text-white/90 leading-snug pt-0.5">{{ toast.message }}</p>
        <button
          @click="removeToast(toast.id)"
          class="text-white/40 hover:text-white transition-colors shrink-0 p-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
