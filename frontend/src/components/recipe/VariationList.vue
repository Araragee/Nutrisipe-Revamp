<script setup lang="ts">
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
    console.error('Failed to load variations:', error)
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
       <div 
         v-for="v in variations" 
         :key="v.id"
         class="bg-background-secondary border border-glass-border rounded-2xl p-4 flex gap-4 hover:border-orange transition-all cursor-pointer group"
         @click="compare(v.variationPost.id)"
       >
          <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-glass-border">
             <img :src="v.variationPost.imageUrl" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div class="flex-1 min-w-0">
             <div class="font-bold text-sm truncate mb-1">{{ v.variationPost.title }}</div>
             <div class="text-[10px] text-text-dim flex items-center gap-2">
                <span>By {{ v.variationPost.user?.displayName || 'Anonymous' }}</span>
                <span class="w-1 h-1 bg-text-dim/30 rounded-full"></span>
                <span>View comparison</span>
             </div>
             <p v-if="v.description" class="text-[11px] text-text-muted mt-2 line-clamp-1 italic">"{{ v.description }}"</p>
          </div>
       </div>
    </div>

    <div v-else class="text-center py-10 bg-background-tertiary rounded-3xl border border-dashed border-glass-border">
       <p class="text-xs text-text-dim">No variations yet. Be the first to fork this recipe!</p>
    </div>
  </div>
</template>
