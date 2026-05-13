<script setup lang="ts">
import { computed } from 'vue'

export interface BaseModalProps {
  show: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeButton?: boolean
  clickBackdropToClose?: boolean
}

const props = withDefaults(defineProps<BaseModalProps>(), {
  size: 'md',
  closeButton: true,
  clickBackdropToClose: true,
})

const emit = defineEmits<{
  close: []
}>()

const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return sizes[props.size]
})

function handleBackdropClick() {
  if (props.clickBackdropToClose) {
    emit('close')
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 dark:bg-black/70"
    @click.self="handleBackdropClick"
  >
    <div
      class="relative w-full rounded-2xl shadow-xl bg-white dark:bg-zinc-800 max-h-[90vh] overflow-hidden flex flex-col"
      :class="sizeClasses"
    >
      <!-- Close Button -->
      <button
        v-if="closeButton"
        @click="emit('close')"
        type="button"
        aria-label="Close modal"
        class="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Header -->
      <div v-if="$slots.header || title" class="sticky top-0 z-10 px-6 py-4 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <slot name="header">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white" v-if="title">{{ title }}</h2>
        </slot>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <slot />
      </div>

      <!-- Footer -->
      <div v-if="$slots.footer" class="sticky bottom-0 z-10 px-6 py-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
