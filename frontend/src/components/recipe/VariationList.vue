<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, onMounted } from 'vue'
import { variationsApi, type Variation } from '@/http/endpoints/variations'
import { useRouter } from 'vue-router'

const props = defineProps<{
  postId: string
}>()

const router = useRouter()
const variations = ref<Variation[]>([])
const loading = ref(true)

async function loadVariations() {
  try {
    const response = await variationsApi.getVariations(props.postId)
    variations.value = response.data.data
  } catch (error) {
    logger.error('Failed to load variations:', error)
  } finally {
    loading.value = false
  }
}

function compare(variationId: string) {
  router.push(`/recipes/${variationId}/variations/compare`)
}

onMounted(loadVariations)
</script>

<template>
  <div class="variation-list space-y-6">
    <div class="flex items-center justify-between">
       <h3 class="font-montserrat font-extrabold text-lg">Community Variations</h3>
       <span class="text-[10px] font-bold text-text-dim uppercase tracking-widest">{{ variations.length }} versions</span>
    </div>

    <div v-if="loading" class="flex justify-center py-6">
       <div class="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="variations.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
       <button
         v-for="v in variations"
         :key="v.id"
         type="button"
         class="bg-background-secondary border border-border rounded-card p-4 flex gap-4 text-left transition-colors duration-200 ease-out hover:border-orange hover:shadow-card-hover active:scale-[0.99] cursor-pointer group"
         @click="compare(v.variationPost.id)"
       >
          <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 outline outline-1 outline-black/10 dark:outline-white/10">
             <img :src="v.variationPost.imageUrl" :alt="v.variationPost.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
          </div>
          <div class="flex-1 min-w-0">
             <div class="font-montserrat font-bold text-sm truncate mb-1">{{ v.variationPost.title }}</div>
             <div class="text-[10px] text-text-dim flex items-center gap-2">
                <span class="truncate">By {{ v.variationPost.user?.displayName || 'Anonymous' }}</span>
                <span class="w-1 h-1 bg-text-dim/40 rounded-full shrink-0"></span>
                <span class="text-orange font-bold uppercase tracking-wide shrink-0">Compare</span>
             </div>
             <p v-if="v.description" class="text-[11px] text-text-muted mt-2 line-clamp-1 italic">"{{ v.description }}"</p>
          </div>
       </button>
    </div>

    <div v-else class="text-center py-12 px-6 bg-background-secondary rounded-card border border-dashed border-border">
       <div class="text-2xl mb-2 text-orange">⑂</div>
       <p class="font-montserrat font-bold text-sm">No variations yet</p>
       <p class="text-xs text-text-dim mt-1">Be the first to fork this recipe and make it your own.</p>
    </div>
  </div>
</template>
