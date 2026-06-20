<template>
  <div class="bg-surface border border-border rounded-card p-6 shadow-card">
    <h3 class="font-montserrat font-extrabold text-lg tracking-tight text-text mb-5">{{ title }}</h3>

    <div class="mb-6">
      <label class="block text-[11px] font-montserrat font-bold uppercase tracking-widest text-text-dim mb-2.5">Your Rating</label>
      <div class="flex flex-wrap items-center gap-3">
        <StarRating v-model="localRating" :readonly="false" size="large" />
        <span
          v-if="localRating > 0"
          class="px-3 py-1 rounded-full bg-orange-soft text-orange-deep dark:text-orange-light text-xs font-montserrat font-bold uppercase tracking-wide"
        >
          {{ getRatingText(localRating) }}
        </span>
      </div>
    </div>

    <div class="mb-6">
      <label for="review" class="block text-[11px] font-montserrat font-bold uppercase tracking-widest text-text-dim mb-2.5">
        Write a Review <span class="text-text-dim/60 normal-case tracking-normal font-medium">(optional)</span>
      </label>
      <textarea
        id="review"
        v-model="localReview"
        rows="5"
        maxlength="1000"
        placeholder="Share your experience with this recipe…"
        class="w-full p-3.5 bg-background border border-border rounded-2xl text-sm text-text leading-relaxed resize-y transition-colors duration-200 ease-out focus:outline-none focus:border-orange placeholder:text-text-dim"
      ></textarea>
      <div class="text-right text-xs text-text-dim mt-1.5 tabular-nums">
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


