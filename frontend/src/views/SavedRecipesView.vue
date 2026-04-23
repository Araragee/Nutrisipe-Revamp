<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api'
import type { Recipe } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const recipes = ref<Recipe[]>([])
const loading = ref(true)

const loadSavedRecipes = async () => {
  if (!authStore.user) return

  loading.value = true
  try {
    const response = await usersApi.getUserSavedRecipes(authStore.user!.id as any)
    recipes.value = response.data.data
  } catch (error) {
    console.error('Failed to load saved recipes:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSavedRecipes()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-heading-2 font-bold text-gray-900 mb-2">Saved Recipes</h1>
      <p class="text-gray-600">Your collection of saved recipes</p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-base"></div>
      <p class="text-gray-600 mt-4">Loading saved recipes...</p>
    </div>

    <div v-else-if="recipes.length === 0" class="text-center py-12 bg-white rounded-xl shadow-sm">
      <p class="text-gray-600 text-lg">No saved recipes yet</p>
      <p class="text-gray-500 mt-2">Start exploring and save recipes you love</p>
      <button
        @click="router.push('/recipes')"
        class="mt-4 px-6 py-2 bg-primary-base text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Browse Recipes
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="recipe in recipes"
        :key="recipe.id"
        @click="router.push(`/recipes/${recipe.id}`)"
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
    </div>
  </div>
</template>
