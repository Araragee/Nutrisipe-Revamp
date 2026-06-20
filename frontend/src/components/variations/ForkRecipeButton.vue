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
  transition: background-color 0.2s ease-out, border-color 0.2s ease-out, color 0.2s ease-out, transform 0.15s ease-out;
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

.fork-button {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.8125rem;
  border-radius: var(--radius-btn);
}
.fork-button:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary {
  background: var(--orange);
  color: #fff;
  border: none;
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
}
.btn-primary:hover:not(:disabled) {
  background: var(--orange-deep);
}

.btn-secondary {
  background: var(--bg2);
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-secondary:hover:not(:disabled) {
  border-color: var(--orange);
  color: var(--orange);
}

.btn-outline {
  background: transparent;
  color: var(--text2);
  border: 1px solid var(--border);
}
.btn-outline:hover:not(:disabled) {
  background: var(--orange-soft);
  border-color: var(--orange);
  color: var(--orange);
}
</style>
