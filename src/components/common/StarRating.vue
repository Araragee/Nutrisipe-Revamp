<template>
  <div class="star-rating" :class="{ interactive: !readonly }">
    <div class="stars">
      <span
        v-for="star in 5"
        :key="star"
        class="star"
        :class="{
          filled: star <= currentRating,
          hovered: !readonly && star <= hoverRating
        }"
        @click="!readonly && handleClick(star)"
        @mouseenter="!readonly && handleMouseEnter(star)"
        @mouseleave="!readonly && handleMouseLeave()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          :fill="getStarFill(star)"
          :stroke="getStarStroke(star)"
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
    <span v-if="showCount && count !== undefined" class="rating-count">
      ({{ count }})
    </span>
    <span v-if="showValue" class="rating-value">
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

function getStarFill(star: number): string {
  const rating = hoverRating.value || currentRating.value

  if (star <= rating) {
    return props.readonly ? '#f59e0b' : '#fbbf24'
  }

  // Partial fill for decimal ratings
  if (star - 1 < rating && rating < star) {
    return `url(#gradient-${star})`
  }

  return 'none'
}

function getStarStroke(star: number): string {
  const rating = hoverRating.value || currentRating.value
  return star <= rating ? '#f59e0b' : '#d1d5db'
}

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

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.stars {
  display: inline-flex;
  gap: 2px;
}

.star {
  display: inline-block;
  cursor: default;
  transition: transform 0.15s ease;
}

.interactive .star {
  cursor: pointer;
}

.interactive .star:hover {
  transform: scale(1.1);
}

.star svg {
  width: 20px;
  height: 20px;
  transition: all 0.2s ease;
}

.star-rating.small .star svg {
  width: 16px;
  height: 16px;
}

.star-rating.large .star svg {
  width: 28px;
  height: 28px;
}

.star.filled svg,
.star.hovered svg {
  filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3));
}

.rating-count {
  font-size: 14px;
  color: #6b7280;
}

.rating-value {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.star-rating.small .rating-value {
  font-size: 14px;
}

.star-rating.large .rating-value {
  font-size: 18px;
}
</style>
