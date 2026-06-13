<script setup lang="ts">
import { ref } from 'vue'
import PinCard from '@/components/feed/PinCard.vue'
import type { Post } from '@/typescript/interface/Post'

withDefaults(
  defineProps<{
    posts: Post[]
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

defineEmits<{
  'open-post': [postId: string]
}>()

const scroller = ref<HTMLElement | null>(null)

function scrollBy(direction: -1 | 1) {
  const el = scroller.value
  if (!el) return
  const card = el.querySelector('.trend-card') as HTMLElement | null
  const step = card ? card.offsetWidth + 24 : 280
  el.scrollBy({ left: step * direction * 2, behavior: 'smooth' })
}
</script>

<template>
  <div class="mb-12">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-montserrat font-extrabold text-2xl">Trending This Week</h2>
      <div class="flex gap-2">
        <button
          @click="scrollBy(-1)"
          aria-label="Scroll left"
          class="w-10 h-10 rounded-full border border-border bg-surface/70 flex items-center justify-center text-text-dim hover:text-orange hover:border-orange transition-all"
        >‹</button>
        <button
          @click="scrollBy(1)"
          aria-label="Scroll right"
          class="w-10 h-10 rounded-full border border-border bg-surface/70 flex items-center justify-center text-text-dim hover:text-orange hover:border-orange transition-all"
        >›</button>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="h-64 bg-background-secondary rounded-card animate-pulse"></div>
    </div>

    <div
      v-else
      ref="scroller"
      class="trend-scroll flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
    >
      <div
        v-for="post in posts"
        :key="post.id"
        class="trend-card shrink-0 snap-start w-[260px] md:w-[280px]"
      >
        <PinCard :post="post" @click="$emit('open-post', $event)" />
      </div>
    </div>
  </div>
</template>
