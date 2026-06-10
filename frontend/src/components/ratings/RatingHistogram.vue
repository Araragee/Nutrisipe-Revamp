<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, computed, onMounted, watch } from 'vue'
import { ratingsApi, type RatingDistribution } from '@/http/endpoints/ratings'

const props = defineProps<{
  postId: string
}>()

const distribution = ref<RatingDistribution>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
const averageRating = ref(0)
const totalRatings = ref(0)
const isLoading = ref(false)

const total = computed(() =>
  Object.values(distribution.value).reduce((a, b) => a + b, 0),
)

const rows = computed(() =>
  ([5, 4, 3, 2, 1] as const).map((star) => {
    const count = distribution.value[star] ?? 0
    const pct = total.value > 0 ? (count / total.value) * 100 : 0
    return { star, count, pct }
  }),
)

async function load() {
  isLoading.value = true
  try {
    const res = await ratingsApi.getPostRatings(props.postId, 1, 1)
    averageRating.value = res.averageRating
    totalRatings.value = res.totalRatings
    if (res.distribution) {
      distribution.value = res.distribution
    }
  } catch (error) {
    logger.error('Failed to load rating distribution:', error)
  } finally {
    isLoading.value = false
  }
}

defineExpose({ refresh: load })
onMounted(load)
watch(() => props.postId, load)
</script>

<template>
  <div class="rating-histogram bg-background-secondary/40 border border-glass-border rounded-3xl p-6">
    <div class="flex items-start gap-8">
      <!-- Average summary -->
      <div class="text-center shrink-0">
        <div class="font-montserrat font-extrabold text-5xl text-orange leading-none">
          {{ averageRating ? averageRating.toFixed(1) : '—' }}
        </div>
        <div class="flex items-center justify-center gap-0.5 mt-2 text-orange text-sm">
          <span v-for="i in 5" :key="i">{{ i <= Math.round(averageRating) ? '★' : '☆' }}</span>
        </div>
        <p class="text-text-dim text-[10px] font-bold uppercase tracking-widest mt-2">
          {{ totalRatings }} {{ totalRatings === 1 ? 'rating' : 'ratings' }}
        </p>
      </div>

      <!-- Distribution bars -->
      <div class="flex-1 space-y-2">
        <div v-for="row in rows" :key="row.star" class="flex items-center gap-3">
          <span class="w-6 text-xs font-bold text-text-dim text-right">{{ row.star }}★</span>
          <div class="flex-1 h-2.5 bg-background-secondary rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-orange to-orange-light transition-all duration-500"
              :style="{ width: `${row.pct}%` }"
            ></div>
          </div>
          <span class="w-10 text-xs font-bold text-text-muted tabular-nums">{{ row.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
