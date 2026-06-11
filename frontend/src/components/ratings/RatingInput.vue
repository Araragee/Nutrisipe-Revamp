<template>
  <div class="bg-surface border border-border rounded-xl p-6 shadow-card">
    <h3 class="text-lg font-semibold text-text mb-5">{{ title }}</h3>

    <div class="mb-6">
      <label class="block text-sm font-medium text-text-muted mb-2">Your Rating</label>
      <StarRating v-model="localRating" :readonly="false" size="large" />
      <p v-if="localRating > 0" class="mt-2 text-sm font-medium text-amber-500">
        {{ getRatingText(localRating) }}
      </p>
    </div>

    <div class="mb-6">
      <label for="review" class="block text-sm font-medium text-text-muted mb-2">
        Write a Review (Optional)
      </label>
      <textarea
        id="review"
        v-model="localReview"
        rows="5"
        maxlength="1000"
        placeholder="Share your experience with this recipe..."
        class="w-full p-3 bg-background-secondary border border-border rounded-lg text-sm text-text font-inherit resize-y transition-colors focus:outline-none focus:border-orange"
      ></textarea>
      <div class="text-right text-xs text-text-dim mt-1">
        {{ localReview.length }} / 1000
      </div>
    </div>

    <div class="flex gap-3 justify-end">
      <BaseButton
        @click="handleCancel"
        buttonType="plainOutlined"
        :disabled="isSubmitting"
        size="sm"
        rounded="lg"
        widthClass="w-auto"
        textStyle="normal-case"
      >
        Cancel
      </BaseButton>
      <BaseButton
        @click="handleSubmit"
        buttonType="primary"
        :disabled="localRating === 0"
        :loading="isSubmitting"
        size="sm"
        rounded="lg"
        widthClass="w-auto"
        textStyle="normal-case"
      >
        {{ isEditing ? 'Update Rating' : 'Submit Rating' }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import StarRating from '@/components/common/StarRating.vue'
import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  title?: string
  rating?: number
  review?: string
  isEditing?: boolean
}

interface Emits {
  (e: 'submit', data: { rating: number; review?: string }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Rate this Recipe',
  rating: 0,
  review: '',
  isEditing: false
})

const emit = defineEmits<Emits>()

const localRating = ref(props.rating)
const localReview = ref(props.review)
const isSubmitting = ref(false)

// Watch for prop changes (when editing existing rating)
watch(() => props.rating, (newVal) => {
  localRating.value = newVal
})

watch(() => props.review, (newVal) => {
  localReview.value = newVal || ''
})

function getRatingText(rating: number): string {
  const texts = [
    '',
    'Poor',
    'Fair',
    'Good',
    'Very Good',
    'Excellent'
  ]
  return texts[rating] || ''
}

async function handleSubmit() {
  if (localRating.value === 0) return

  isSubmitting.value = true

  try {
    emit('submit', {
      rating: localRating.value,
      review: localReview.value.trim() || undefined
    })
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>


