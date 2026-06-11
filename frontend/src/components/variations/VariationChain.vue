<template>
  <div class="py-6">
    <div class="mb-6">
      <h3 class="text-2xl font-semibold text-text mb-1">Recipe Lineage</h3>
      <p class="text-sm text-text-muted">Trace the evolution of this recipe</p>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-12 px-4 text-center text-text-muted">
      <div class="w-10 h-10 border-3 border-neutral-200 dark:border-neutral-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
      <span>Loading chain...</span>
    </div>

    <div v-else-if="error" class="flex flex-col items-center justify-center py-12 px-4 text-center text-red-600 dark:text-red-400 font-medium">
      {{ error }}
    </div>

    <div v-else-if="chain.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center text-text-muted">
      <p>This is an original recipe with no variations yet.</p>
    </div>

    <div v-else class="bg-surface border border-border rounded-xl p-6 shadow-sm">
      <div class="flex items-center gap-2 px-4 py-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-blue-800 dark:text-blue-300 mb-6 text-sm font-medium">
        <svg class="w-5 h-5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <span>{{ depth }} generation{{ depth === 1 ? '' : 's' }} deep</span>
      </div>

      <div class="flex flex-col gap-4">
        <div
          v-for="(item, index) in chain"
          :key="item.post.id"
          class="relative"
        >
          <div class="flex items-center my-2 pl-8 sm:pl-12" v-if="index > 0">
            <div class="flex-1 h-0.5 bg-gradient-to-r from-neutral-300 dark:from-neutral-700 to-emerald-500"></div>
            <div class="text-emerald-500 ml-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>

          <div
            class="flex flex-col sm:flex-row gap-4 p-4 bg-background border-2 border-border rounded-xl cursor-pointer transition-all hover:border-emerald-500 hover:shadow-md"
            :class="{ 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-500': index === chain.length - 1 }"
            @click="navigateToPost(item.post.id)"
          >
            <div class="relative w-full sm:w-[120px] h-[200px] sm:h-[120px] shrink-0 rounded-lg overflow-hidden">
              <img :src="item.post.imageUrl" :alt="item.post.title" class="w-full h-full object-cover" />
              <div v-if="index === 0" class="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded">Original</div>
              <div v-else-if="index === chain.length - 1" class="absolute bottom-2 left-2 px-2 py-0.5 bg-indigo-500 text-white text-xs font-medium rounded">Current</div>
              <div v-else class="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs font-medium rounded">Fork {{ index }}</div>
            </div>

            <div class="flex-1 flex flex-col gap-3">
              <div class="flex items-start justify-between gap-4">
                <h4 class="text-lg font-semibold text-text">{{ item.post.title }}</h4>
                <div class="px-2.5 py-1 bg-surface border border-border rounded-md text-xs font-semibold text-text-muted whitespace-nowrap">Gen {{ index + 1 }}</div>
              </div>

              <div class="flex items-center gap-2">
                <img
                  :src="item.post.user.avatarUrl || '/default-avatar.png'"
                  :alt="item.post.user.displayName"
                  class="w-6 h-6 rounded-full object-cover"
                />
                <span class="text-sm text-text-muted">{{ item.post.user.displayName }}</span>
              </div>

              <p v-if="item.variation?.description" class="flex items-start gap-2 p-3 bg-surface border-l-3 border-emerald-500 rounded-md text-sm text-text italic">
                <svg class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <span>{{ item.variation.description }}</span>
              </p>

              <div class="flex gap-4">
                <div class="flex items-center gap-1.5 text-text-muted text-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                  </svg>
                  <span>{{ item.post.likeCount || 0 }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-text-muted text-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{{ item.post.variationCount || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 pt-6 border-t border-border">
        <h4 class="text-base font-semibold text-text mb-2">Evolution Summary</h4>
        <p class="text-sm text-text-muted leading-relaxed mb-4">This recipe has evolved through {{ depth }} generation{{ depth === 1 ? '' : 's' }}, with each creator adding their unique twist.</p>
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-text-muted">Contributors:</span>
          <AvatarStack :users="chain.map(item => item.post.user)" :max="5" size="md" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVariationsStore } from '@/stores/variations'
import AvatarStack from '@/components/common/AvatarStack.vue'
import type { VariationChainItem } from '@/http/endpoints/variations'

interface Props {
  postId: string
}

const props = defineProps<Props>()
const router = useRouter()
const variationsStore = useVariationsStore()

const chain = ref<VariationChainItem[]>([])
const depth = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  await loadChain()
})

const loadChain = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await variationsStore.getVariationChain(props.postId)
    chain.value = response.chain
    depth.value = response.depth
  } catch (err: any) {
    error.value = 'Failed to load variation chain'
  } finally {
    loading.value = false
  }
}

const navigateToPost = (postId: string) => {
  router.push(`/recipes/${postId}`)
}
</script>
