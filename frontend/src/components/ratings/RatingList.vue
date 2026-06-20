<template>
  <div class="rating-list">
    <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-border">
      <h3 class="font-montserrat font-extrabold text-lg tracking-tight">
        Reviews <span class="text-text-dim tabular-nums">({{ totalRatings }})</span>
      </h3>

      <div v-if="averageRating > 0" class="flex items-center gap-2">
        <StarRating :model-value="averageRating" readonly size="medium" />
        <span class="text-sm text-text-muted font-medium tabular-nums">{{ averageRating.toFixed(1) }} out of 5</span>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin rounded-full h-9 w-9 border-2 border-orange border-t-transparent mx-auto"></div>
    </div>

    <ul v-else-if="ratings.length > 0" class="flex flex-col">
      <li
        v-for="(rating, idx) in ratings"
        :key="rating.id"
        class="py-5 first:pt-0 last:pb-0"
        :class="idx < ratings.length - 1 ? 'border-b border-border' : ''"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 min-w-0">
            <img
              v-if="rating.user.avatarUrl"
              :src="rating.user.avatarUrl"
              :alt="rating.user.username"
              class="w-10 h-10 rounded-full object-cover shrink-0 outline outline-1 outline-black/10 dark:outline-white/10"
            />
            <div
              v-else
              class="w-10 h-10 rounded-full shrink-0 grid place-items-center bg-orange text-white font-montserrat font-bold text-base"
            >
              {{ rating.user.username[0].toUpperCase() }}
            </div>

            <div class="min-w-0">
              <div class="font-montserrat font-bold text-[15px] truncate">{{ rating.user.displayName }}</div>
              <div class="flex items-center gap-2.5 mt-0.5">
                <StarRating :model-value="rating.rating" readonly size="small" />
                <span class="text-xs text-text-dim">{{ formatDate(rating.createdAt) }}</span>
              </div>
            </div>
          </div>

          <button
            v-if="canDelete(rating)"
            @click="handleDeleteRating(rating.id)"
            class="shrink-0 w-9 h-9 grid place-items-center rounded-full text-text-dim transition-colors duration-200 ease-out hover:bg-red-500/10 hover:text-red-500 active:scale-[0.92]"
            title="Delete your review"
            aria-label="Delete your review"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-[18px] h-[18px]">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>

        <p v-if="rating.review" class="mt-3 text-text-muted leading-relaxed text-pretty">
          {{ rating.review }}
        </p>
      </li>
    </ul>

    <div v-else class="text-center py-14 px-6 bg-background-secondary border border-dashed border-border rounded-card">
      <div class="text-3xl mb-2 text-orange">★</div>
      <p class="font-montserrat font-bold text-sm">No reviews yet</p>
      <p class="text-sm text-text-dim mt-1">Be the first to share what you thought.</p>
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
