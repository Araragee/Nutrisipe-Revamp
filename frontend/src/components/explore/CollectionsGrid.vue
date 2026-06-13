<script setup lang="ts">
import { resolveImage } from '@/utils/imageUrl'
import type { Collection } from '@/http/endpoints/collections'

withDefaults(
  defineProps<{
    collections: Collection[]
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

defineEmits<{
  open: [id: string]
}>()

const collectionGradients = [
  'from-green-400 to-emerald-500',
  'from-orange-400 to-red-500',
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-yellow-400 to-amber-500',
  'from-purple-400 to-violet-500',
]
</script>

<template>
  <div class="mb-12">
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-montserrat font-extrabold text-2xl">Your Collections</h2>
      <RouterLink to="/saved" class="text-orange font-bold text-sm hover:underline">View All</RouterLink>
    </div>
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-48 bg-background-secondary rounded-3xl animate-pulse"></div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="(col, idx) in collections.slice(0, 6)"
        :key="col.id"
        @click="$emit('open', col.id)"
        class="group relative h-48 rounded-3xl overflow-hidden cursor-pointer shadow-card transition-all hover:-translate-y-1"
      >
        <img
          :src="resolveImage(col.thumbnailUrl, col.id)"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div :class="['absolute inset-0 bg-gradient-to-t opacity-60', collectionGradients[idx % collectionGradients.length]]"></div>
        <div class="absolute inset-0 p-6 flex flex-col justify-end">
          <h3 class="font-montserrat font-extrabold text-xl text-white drop-shadow-md">{{ col.name }}</h3>
          <p class="text-white/80 text-sm font-medium">{{ col.postCount ?? 0 }} recipes</p>
        </div>
      </div>
    </div>
  </div>
</template>
