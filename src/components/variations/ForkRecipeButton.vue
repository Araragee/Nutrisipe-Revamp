<template>
  <button
    @click="handleFork"
    :disabled="disabled || loading"
    :class="buttonClass"
    class="fork-button"
  >
    <svg v-if="!loading" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
    <span v-if="loading" class="spinner"></span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  postId: string
  label?: string
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline'
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Fork Recipe',
  disabled: false,
  variant: 'outline'
})

const emit = defineEmits<{
  fork: [postId: string]
}>()

const loading = ref(false)

const buttonClass = computed(() => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline'
  }
  return variants[props.variant]
})

const handleFork = () => {
  if (!props.disabled && !loading.value) {
    emit('fork', props.postId)
  }
}
</script>

<style scoped>
.fork-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.fork-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 1.25rem;
  height: 1.25rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-primary {
  background: var(--color-primary, #10b981);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #059669);
}

.btn-secondary {
  background: var(--color-secondary, #6366f1);
  color: white;
  border: none;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-secondary-dark, #4f46e5);
}

.btn-outline {
  background: transparent;
  color: var(--color-text, #374151);
  border: 1px solid var(--color-border, #d1d5db);
}

.btn-outline:hover:not(:disabled) {
  background: var(--color-bg-hover, #f9fafb);
  border-color: var(--color-primary, #10b981);
  color: var(--color-primary, #10b981);
}
</style>
