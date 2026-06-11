<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { ref, watch } from 'vue'
import { debounce } from '@/utils/performance'

const props = defineProps<{
  initialQuery?: string
}>()

const emit = defineEmits<{
  search: [query: string],
  filter: [category: string]
}>()

const searchQuery = ref(props.initialQuery || '')
const activeCategory = ref('All')

const categories = [
  'All', 'Vegan', 'Keto', 'Gluten-Free', 'Quick', 'Desserts', 'Breakfast', 'Dinner'
]

const debouncedSearch = debounce(() => {
  emit('search', searchQuery.value)
}, 500)

watch(searchQuery, () => {
  debouncedSearch()
})

function handleSearch() {
  emit('search', searchQuery.value)
}

function selectCategory(cat: string) {
  activeCategory.value = cat
  emit('filter', cat)
}
</script>

<template>
  <header class="feed-header sticky top-0 z-20 bg-background/90 border-b border-border px-8 py-5 flex items-center gap-4">
    <!-- Search Bar -->
    <div class="search-bar flex-1 flex items-center gap-3 bg-surface border-1.5 border-border rounded-xl px-4.5 py-3 transition-all focus-within:border-orange">
      <BaseIcons name="magnifying-glass" size="sm" class="search-icon text-text-dim" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search recipes, creators, cuisines…"
        class="flex-1 bg-transparent border-none outline-none text-sm text-text font-inter"
        @keyup.enter="handleSearch"
      />
    </div>

    <!-- Filter Chips -->
    <div class="filter-chips-wrap relative flex-[1.5] min-w-0">
      <div class="filter-chips flex gap-2 overflow-x-auto scrollbar-none py-0.5 pr-10">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectCategory(cat)"
          :class="[
            'filter-chip px-4 py-2 rounded-full border-1.5 border-border text-[13px] font-medium whitespace-nowrap transition-all flex-shrink-0',
            activeCategory === cat ? 'bg-orange border-orange text-white' : 'bg-transparent text-text-muted hover:border-orange hover:text-orange'
          ]"
        >
          {{ cat }}
        </button>
      </div>
      <div class="filter-fade-right absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background/90 to-transparent pointer-events-none"></div>
    </div>
  </header>
</template>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
