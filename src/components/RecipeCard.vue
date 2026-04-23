<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Recipe } from '@/types'

interface Props {
  recipe: Recipe
}

const props = defineProps<Props>()
const router = useRouter()

const goToRecipe = () => {
  router.push(`/recipes/${props.recipe.id}`)
}
</script>

<template>
  <div
    @click="goToRecipe"
    class="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
  >
    <div class="aspect-video bg-gray-200 overflow-hidden">
      <img
        v-if="recipe.image"
        :src="`http://localhost:8000/storage/${recipe.image}`"
        :alt="recipe.title"
        class="w-full h-full object-cover"
      />
    </div>
    <div class="p-4">
      <div class="flex items-start justify-between mb-2">
        <h3 class="font-semibold text-lg text-gray-900 line-clamp-1">{{ recipe.title }}</h3>
        <span class="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap ml-2">
          {{ recipe.category }}
        </span>
      </div>
      <p class="text-gray-600 text-sm line-clamp-2 mb-3">{{ recipe.description }}</p>
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2 text-gray-700">
          <span class="font-medium">{{ recipe.user.name }}</span>
        </div>
        <div class="flex items-center gap-3 text-gray-500">
          <span>❤️ {{ recipe.saved_by_count }}</span>
          <span>💬 {{ recipe.comments_count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
