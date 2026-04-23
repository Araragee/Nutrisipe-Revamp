<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const typeClasses = {
  success: 'bg-emerald-50 border-emerald-500 text-emerald-900',
  error: 'bg-error-100 border-error-base text-error-900',
  warning: 'bg-amber-50 border-amber-500 text-amber-900',
  info: 'bg-blue-50 border-blue-500 text-blue-900',
}

const typeIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 max-w-md">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[typeClasses[toast.type], 'flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg']"
      >
        <span class="text-xl font-bold">{{ typeIcons[toast.type] }}</span>
        <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
        <button
          @click="removeToast(toast.id)"
          class="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ✕
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
