<template>
  <div class="inline-flex items-center gap-2">
    <div class="inline-flex gap-0.5">
      <span
        v-for="star in 5"
        :key="star"
        class="inline-block transition-transform duration-150 ease-in-out"
        :class="{ 'cursor-pointer hover:scale-110': !readonly }"
        @click="!readonly && handleClick(star)"
        @mouseenter="!readonly && handleMouseEnter(star)"
        @mouseleave="!readonly && handleMouseLeave()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="transition-all duration-200"
          :class="[
            size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-7 h-7' : 'w-5 h-5',
            star <= (hoverRating || currentRating)
              ? (readonly ? 'fill-amber-500 stroke-amber-500' : 'fill-amber-400 stroke-amber-400')
              : 'fill-none stroke-neutral-300 dark:stroke-neutral-600'
          ]"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      </span>
    </div>
    <span v-if="showCount && count !== undefined" class="text-sm text-text-muted">
      ({{ count }})
    </span>
    <span
      v-if="showValue"
      class="font-semibold text-text"
      :class="size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'"
    >
      {{ displayValue }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: number
  readonly?: boolean
  size?: 'small' | 'medium' | 'large'
  showValue?: boolean
  showCount?: boolean
  count?: number
}

interface Emits {
  (e: 'update:modelValue', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  readonly: false,
  size: 'medium',
  showValue: false,
  showCount: false
})

const emit = defineEmits<Emits>()

const hoverRating = ref(0)

const currentRating = computed(() => props.modelValue)

const displayValue = computed(() => {
  return currentRating.value.toFixed(1)
})

function handleClick(rating: number) {
  emit('update:modelValue', rating)
}

function handleMouseEnter(rating: number) {
  hoverRating.value = rating
}

function handleMouseLeave() {
  hoverRating.value = 0
}
</script>
