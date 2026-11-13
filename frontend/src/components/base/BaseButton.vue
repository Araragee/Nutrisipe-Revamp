<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  to?: RouteLocationRaw
  icon?: boolean
  block?: boolean
  loading?: boolean
  disabled?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  to: undefined,
  icon: false,
  block: false,
  loading: false,
  disabled: false,
})

const isDisabled = computed(() => props.disabled || props.loading)

const variantClass = computed(() => ({
  primary: 'bg-orange text-white shadow-[0_6px_24px_var(--orange-glow)] hover:bg-orange-deep',
  secondary: 'bg-surface text-text border border-border hover:border-orange hover:text-orange',
  ghost: 'bg-transparent text-text-muted hover:bg-background-secondary hover:text-text',
  danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
}[props.variant]))

const sizeClass = computed(() => {
  if (props.icon) {
    return {
      sm: 'h-9 w-9 rounded-full',
      md: 'h-11 w-11 rounded-full',
      lg: 'h-[52px] w-[52px] rounded-full',
    }[props.size]
  }
  return {
    sm: 'h-9 px-3.5 text-[13px] rounded-btn',
    md: 'h-11 px-5 text-sm rounded-btn',
    lg: 'h-[52px] px-6 text-[15px] rounded-btn',
  }[props.size]
})
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : isDisabled"
    :aria-disabled="to && isDisabled ? 'true' : undefined"
    :aria-busy="loading || undefined"
    class="inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-montserrat font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-revamp focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
    :class="[variantClass, sizeClass, { 'w-full': block }]"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin motion-reduce:animate-none"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <slot v-if="!(loading && icon)" />
  </component>
</template>
