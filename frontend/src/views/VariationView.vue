<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { variationsApi } from '@/http/endpoints/variations'
import { postsApi } from '@/http/endpoints/posts'
import type { Post } from '@/typescript/interface/Post'

const route = useRoute()
const router = useRouter()
const variationPost = ref<Post | null>(null)
const originalPost = ref<Post | null>(null)
const loading = ref(true)

async function loadData() {
  const id = route.params.id as string
  try {
    const [varRes, origRes] = await Promise.all([
      postsApi.getById(id),
      variationsApi.getOriginal(id)
    ])
    variationPost.value = varRes.data.data as Post
    const data = origRes.data.data as any
    originalPost.value = data.originalPost
  } catch (error) {
    logger.error('Failed to load variation comparison:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="variation-view min-h-screen bg-background py-16 px-6">
    <div class="max-w-7xl mx-auto">
      <button @click="router.back()" class="mb-12 flex items-center gap-2 text-text-dim font-bold hover:text-orange transition-colors">
        <span>←</span> BACK
      </button>

      <div v-if="loading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="originalPost && variationPost" class="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-revamp">
        <!-- Original -->
        <div class="bg-background-secondary rounded-[40px] border border-border p-8 shadow-xl">
           <div class="flex items-center gap-3 mb-6">
              <span class="px-3 py-1 bg-background-tertiary rounded-full text-[10px] font-bold uppercase tracking-widest text-text-dim">Original</span>
              <h2 class="font-montserrat font-extrabold text-xl truncate">{{ originalPost.title }}</h2>
           </div>
           
           <div class="space-y-8">
              <section>
                 <h3 class="text-xs font-bold uppercase tracking-widest text-orange mb-4">Ingredients</h3>
                 <ul class="space-y-2">
                    <li v-for="(ing, i) in originalPost.recipe?.ingredients" :key="i" class="text-sm flex justify-between border-b border-border pb-2">
                       <span class="font-medium">{{ ing.name }}</span>
                       <span class="text-text-dim">{{ ing.quantity }}</span>
                    </li>
                 </ul>
              </section>

              <section>
                 <h3 class="text-xs font-bold uppercase tracking-widest text-orange mb-4">Instructions</h3>
                 <div class="space-y-4">
                    <div v-for="step in originalPost.recipe?.instructions" :key="step.step" class="flex gap-3 text-sm">
                       <span class="font-montserrat font-bold text-orange">{{ step.step }}.</span>
                       <p class="text-text-muted leading-relaxed">{{ step.text }}</p>
                    </div>
                 </div>
              </section>
           </div>
        </div>

        <!-- Variation -->
        <div class="bg-white/5 rounded-[40px] border border-orange/30 p-8 shadow-2xl relative overflow-hidden">
           <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <BaseIcons name="sparkles" size="custom" custom-size="w-24 h-24" class="text-text-dim" />
           </div>

           <div class="flex items-center gap-3 mb-6">
              <span class="px-3 py-1 bg-orange/20 text-orange rounded-full text-[10px] font-bold uppercase tracking-widest">Variation</span>
              <h2 class="font-montserrat font-extrabold text-xl truncate">{{ variationPost.title }}</h2>
           </div>

           <div class="space-y-8">
              <section>
                 <h3 class="text-xs font-bold uppercase tracking-widest text-orange mb-4">Ingredients</h3>
                 <ul class="space-y-2">
                    <li 
                      v-for="(ing, i) in variationPost.recipe?.ingredients" 
                      :key="i" 
                      class="text-sm flex justify-between border-b border-orange/10 pb-2"
                      :class="{ 'font-bold text-orange': !originalPost.recipe?.ingredients?.some(oi => oi.name === ing.name) }"
                    >
                       <span>{{ ing.name }}</span>
                       <span class="text-text-dim">{{ ing.quantity }}</span>
                    </li>
                 </ul>
              </section>

              <section>
                 <h3 class="text-xs font-bold uppercase tracking-widest text-orange mb-4">Instructions</h3>
                 <div class="space-y-4">
                    <div 
                      v-for="step in variationPost.recipe?.instructions" 
                      :key="step.step" 
                      class="flex gap-3 text-sm"
                      :class="{ 'font-bold': !originalPost.recipe?.instructions?.some(os => os.text === step.text) }"
                    >
                       <span class="font-montserrat font-bold text-orange">{{ step.step }}.</span>
                       <p class="text-text-muted leading-relaxed">{{ step.text }}</p>
                    </div>
                 </div>
              </section>
           </div>
        </div>
      </div>

      <div v-else class="text-center py-20">
         <p class="text-text-dim font-bold uppercase tracking-widest">Variation details not found</p>
      </div>
    </div>
  </div>
</template>
