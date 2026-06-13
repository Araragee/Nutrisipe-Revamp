<script setup lang="ts">
import RecipeMosaicBackground from '@/components/common/RecipeMosaicBackground.vue'
import type { Post } from '@/typescript/interface/Post'
import type { SearchType } from '@/composables/useExploreSearch'

withDefaults(
  defineProps<{
    query: string
    activeType: SearchType
    posts?: Post[]
  }>(),
  {
    posts: () => [],
  },
)

const emit = defineEmits<{
  'update:query': [value: string]
  search: []
  clear: []
  'select-filter': [value: SearchType]
}>()

const filterChips: { label: string; value: SearchType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Recipes', value: 'recipes' },
  { label: 'People', value: 'people' },
]

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:query', value)
  if (!value) emit('clear')
}
</script>

<template>
  <div
    class="explore-hero relative h-[420px] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
  >
    <RecipeMosaicBackground :posts="posts" :count="12" :intensity="0.45" fallback-variant="sunset" />

    <div class="relative z-10 w-full max-w-2xl animate-revamp">
      <h1 class="font-montserrat font-extrabold text-5xl tracking-tight mb-4 drop-shadow-sm">
        Explore Nutrisipe
      </h1>
      <p class="text-text-muted text-base md:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
        Search recipes, follow chefs, find collections shaped for your taste.
      </p>

      <!-- Search Bar -->
      <div class="relative group">
        <div
          class="absolute inset-y-0 left-5 flex items-center pointer-events-none text-xl group-focus-within:text-orange transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <input
          :value="query"
          @input="onInput"
          @keyup.enter="emit('search')"
          type="text"
          placeholder="Try ‘miso soup’, ‘chef’, or a tag…"
          class="w-full h-16 pl-14 pr-32 bg-surface/80 border-1.5 border-border rounded-2xl text-[15px] font-medium outline-none focus:border-orange focus:ring-4 focus:ring-orange/10 shadow-lg transition-all"
        />
        <button
          @click="emit('search')"
          class="absolute right-2.5 top-2.5 bottom-2.5 px-6 bg-orange text-white rounded-xl font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
        >Search</button>
      </div>

      <!-- Type chips -->
      <div class="flex gap-2 justify-center mt-5">
        <button
          v-for="chip in filterChips"
          :key="chip.value"
          @click="emit('select-filter', chip.value)"
          :class="[
            'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border-1.5',
            activeType === chip.value
              ? 'bg-orange border-orange text-white'
              : 'bg-surface/70 border-border text-text-muted hover:border-orange hover:text-orange',
          ]"
        >{{ chip.label }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes revamp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-revamp { animation: revamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
</style>
