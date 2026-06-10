<template>
  <div class="rating-list">
    <div class="rating-header">
      <h3 class="rating-list-title">
        Reviews ({{ totalRatings }})
      </h3>

      <div class="rating-summary" v-if="averageRating > 0">
        <StarRating :model-value="averageRating" readonly size="medium" show-value />
        <span class="average-text">{{ averageRating.toFixed(1) }} out of 5</span>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-orange mx-auto"></div>
    </div>

    <div v-else-if="ratings.length > 0" class="ratings-container">
      <div
        v-for="rating in ratings"
        :key="rating.id"
        class="rating-item"
      >
        <div class="rating-item-header">
          <div class="user-info">
            <img
              v-if="rating.user.avatarUrl"
              :src="rating.user.avatarUrl"
              :alt="rating.user.username"
              class="user-avatar"
            />
            <div v-else class="user-avatar-placeholder">
              {{ rating.user.username[0].toUpperCase() }}
            </div>

            <div class="user-details">
              <div class="user-name">{{ rating.user.displayName }}</div>
              <div class="rating-meta">
                <StarRating :model-value="rating.rating" readonly size="small" />
                <span class="rating-date">{{ formatDate(rating.createdAt) }}</span>
              </div>
            </div>
          </div>

          <button
            v-if="canDelete(rating)"
            @click="handleDeleteRating(rating.id)"
            class="delete-button"
            title="Delete rating"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>

        <p v-if="rating.review" class="rating-review">
          {{ rating.review }}
        </p>
      </div>
    </div>

    <div v-else class="no-ratings">
      <p>No reviews yet. Be the first to review this recipe!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, computed, onMounted, watch } from 'vue'
import StarRating from '@/components/common/StarRating.vue'
import { useAuthStore } from '@/stores/auth'
import { ratingsApi, type Rating } from '@/http/endpoints/ratings'

interface Props {
  postId: string
  // Optional initial data
  initialRatings?: Rating[]
  initialAverage?: number
  initialTotal?: number
}

const props = defineProps<Props>()

const authStore = useAuthStore()

const ratings = ref<Rating[]>(props.initialRatings || [])
const averageRating = ref(props.initialAverage || 0)
const totalRatings = ref(props.initialTotal || 0)
const isLoading = ref(false)

const currentUserId = computed(() => authStore.user?.id)

async function fetchRatings() {
  isLoading.value = true
  try {
    const data = await ratingsApi.getPostRatings(props.postId)
    ratings.value = data.ratings
    averageRating.value = data.averageRating
    totalRatings.value = data.totalRatings
  } catch (error) {
    logger.error('Failed to fetch ratings:', error)
  } finally {
    isLoading.value = false
  }
}

function canDelete(rating: Rating): boolean {
  return rating.userId === currentUserId.value
}

async function handleDeleteRating(ratingId: string) {
  if (!confirm('Are you sure you want to delete your review?')) return
  try {
    await ratingsApi.deleteRating(ratingId)
    await fetchRatings() // Refresh
  } catch (error) {
    logger.error('Failed to delete rating:', error)
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

onMounted(fetchRatings)
watch(() => props.postId, fetchRatings)

defineExpose({ refresh: fetchRatings })
</script>

<style scoped>
.rating-list {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.rating-list-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.average-text {
  font-size: 14px;
  color: #6b7280;
}

.ratings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rating-item {
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
}

.rating-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.rating-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.rating-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-date {
  font-size: 12px;
  color: #6b7280;
}

.rating-review {
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.delete-button:hover {
  background: #fee2e2;
}

.no-ratings {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}
</style>
