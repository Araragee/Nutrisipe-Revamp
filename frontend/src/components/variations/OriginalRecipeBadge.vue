<template>
  <div v-if="originalRecipe" class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/30 border-2 border-emerald-500 rounded-xl p-4 mb-6">
    <div class="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <span class="font-semibold text-xs uppercase tracking-wider">Forked from</span>
    </div>

    <div class="flex items-center gap-4 p-3 bg-surface border border-glass-border rounded-lg cursor-pointer transition-all hover:shadow-md hover:translate-x-1" @click="navigateToOriginal">
      <div class="w-[60px] h-[60px] rounded-lg overflow-hidden shrink-0">
        <img
          :src="originalRecipe.originalPost.imageUrl"
          :alt="originalRecipe.originalPost.title"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-base font-semibold text-text mb-1.5 truncate">{{ originalRecipe.originalPost.title }}</h4>
        <div class="flex items-center gap-2">
          <img
            :src="originalRecipe.originalPost.user.avatarUrl || '/default-avatar.png'"
            :alt="originalRecipe.originalPost.user.displayName"
            class="w-5 h-5 rounded-full object-cover"
          />
          <span class="text-sm text-text-muted">by {{ originalRecipe.originalPost.user.displayName }}</span>
        </div>
      </div>
      <svg class="w-6 h-6 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>

    <div v-if="originalRecipe.variation.description" class="flex items-start gap-2 mt-3 p-3 bg-surface border border-glass-border rounded-lg text-sm text-text">
      <svg class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      <span>{{ originalRecipe.variation.description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVariationsStore } from '@/stores/variations'

interface Props {
  postId: string
}

const props = defineProps<Props>()
const router = useRouter()
const variationsStore = useVariationsStore()

const originalRecipe = ref<any>(null)

onMounted(async () => {
  try {
    const result = await variationsStore.getOriginalRecipe(props.postId)
    originalRecipe.value = result
  } catch (err) {
    // Not a variation, which is fine
  }
})

const navigateToOriginal = () => {
  if (originalRecipe.value) {
    router.push(`/recipes/${originalRecipe.value.originalPost.id}`)
  }
}
</script>
