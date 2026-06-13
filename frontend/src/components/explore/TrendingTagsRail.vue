<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import type { TrendingTag } from '@/http/endpoints/search'

defineProps<{
  tags: TrendingTag[]
}>()

defineEmits<{
  select: [tag: string]
}>()
</script>

<template>
  <div class="mt-10 mb-12">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="font-montserrat font-extrabold text-lg tracking-tight flex items-center gap-2">
        <BaseIcons name="fire" size="md" class="text-orange" /> Trending Tags
      </h2>
      <span class="text-text-dim text-[10px] font-bold uppercase tracking-widest">Past 14 days</span>
    </div>
    <div class="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
      <button
        v-for="tag in tags"
        :key="tag.name"
        @click="$emit('select', tag.name)"
        class="shrink-0 px-4 py-2 rounded-full border-1.5 border-border bg-surface/60 text-sm font-bold hover:border-orange hover:text-orange transition-all"
      >
        #{{ tag.name }}
        <span class="ml-2 text-[10px] text-text-dim tabular-nums">{{ tag.count }}</span>
      </button>
    </div>
  </div>
</template>
