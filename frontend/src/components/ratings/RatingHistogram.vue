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
  <div class="rating-histogram bg-background-secondary border border-border rounded-card p-6 shadow-card">
    <div class="flex items-center gap-6 sm:gap-8">
      <!-- Average summary -->
      <div class="text-center shrink-0 pr-6 sm:pr-8 border-r border-border">
        <div class="font-montserrat font-black text-5xl sm:text-6xl text-orange leading-none tabular-nums">
          {{ averageRating ? averageRating.toFixed(1) : '—' }}
        </div>
        <div class="flex items-center justify-center gap-0.5 mt-2.5 text-orange text-base">
          <span v-for="i in 5" :key="i" :class="i <= Math.round(averageRating) ? 'text-orange' : 'text-border'">★</span>
        </div>
        <p class="text-text-dim text-[10px] font-montserrat font-bold uppercase tracking-widest mt-2.5 tabular-nums">
          {{ totalRatings }} {{ totalRatings === 1 ? 'rating' : 'ratings' }}
        </p>
      </div>

      <!-- Distribution bars -->
      <div class="flex-1 space-y-2">
        <div v-for="row in rows" :key="row.star" class="flex items-center gap-3">
          <span class="w-7 text-xs font-bold text-text-dim text-right tabular-nums">{{ row.star }}<span class="text-orange/70">★</span></span>
          <div class="flex-1 h-2.5 bg-border/60 rounded-full overflow-hidden">
            <div
              class="h-full bg-orange rounded-full transition-[width] duration-700 ease-out"
              :style="{ width: `${row.pct}%` }"
            ></div>
          </div>
          <span class="w-8 text-xs font-bold text-text-muted tabular-nums text-right">{{ row.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
