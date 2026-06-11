<template>
  <div class="rating-input">
    <h3 class="rating-title">{{ title }}</h3>

    <div class="rating-stars-section">
      <label class="rating-label">Your Rating</label>
      <StarRating v-model="localRating" :readonly="false" size="large" />
      <p v-if="localRating > 0" class="rating-text">
        {{ getRatingText(localRating) }}
      </p>
    </div>

    <div class="review-section">
      <label for="review" class="review-label">
        Write a Review (Optional)
      </label>
      <textarea
        id="review"
        v-model="localReview"
        rows="5"
        maxlength="1000"
        placeholder="Share your experience with this recipe..."
        class="review-textarea"
      ></textarea>
      <div class="character-count">
        {{ localReview.length }} / 1000
      </div>
    </div>

    <div class="rating-actions">
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

<style scoped>
.rating-input {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rating-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
}

.rating-stars-section {
  margin-bottom: 24px;
}

.rating-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.rating-text {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #f59e0b;
}

.review-section {
  margin-bottom: 24px;
}

.review-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.review-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.review-textarea:focus {
  outline: none;
  border-color: #4caf50;
}

.character-count {
  text-align: right;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.rating-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}
</style>
