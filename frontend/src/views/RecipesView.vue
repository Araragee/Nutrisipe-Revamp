<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { recipesApi } from '@/api'
import type { Recipe } from '@/types'

const router = useRouter()

const recipes = ref<Recipe[]>([])
const loading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)
const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Beverage']
const selectedCategory = ref<string | null>(null)
const searchQuery = ref('')

const loadRecipes = async (page = 1) => {
  loading.value = true
  try {
    const params: any = { page }
    if (selectedCategory.value) params.category = selectedCategory.value
    if (searchQuery.value) params.search = searchQuery.value

    const response = await recipesApi.getRecipes(params)
    recipes.value = response.data.data
    currentPage.value = response.data.meta.current_page
    lastPage.value = response.data.meta.last_page
  } catch (error) {
    console.error('Failed to load recipes:', error)
  } finally {
    loading.value = false
  }
}

const filterByCategory = (category: string | null) => {
  selectedCategory.value = category
  loadRecipes(1)
}

const search = () => {
  loadRecipes(1)
}

const nextPage = () => {
  if (currentPage.value < lastPage.value) {
    loadRecipes(currentPage.value + 1)
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    loadRecipes(currentPage.value - 1)
  }
}

onMounted(() => {
  loadRecipes()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-heading-2 font-bold text-gray-900 mb-2">All Recipes</h1>
      <p class="text-gray-600">Browse and discover delicious healthy recipes</p>
    </div>

    <div class="mb-6">
      <div class="flex gap-2 mb-4">
        <input
          v-model="searchQuery"
          @keyup.enter="search"
          type="text"
          placeholder="Search recipes by title, description, or author..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
        />
        <button
          @click="search"
          class="px-6 py-2 bg-primary-base text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Search
        </button>
      </div>

      <div class="flex gap-2 flex-wrap">
        <button
          @click="filterByCategory(null)"
          :class="[
            'px-4 py-2 rounded-lg transition-colors font-medium',
            selectedCategory === null
              ? 'bg-primary-base text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          ]"
        >
          All Categories
        </button>
        <button
          v-for="category in categories"
          :key="category"
          @click="filterByCategory(category)"
          :class="[
            'px-4 py-2 rounded-lg transition-colors font-medium',
            selectedCategory === category
              ? 'bg-primary-base text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          ]"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-base"></div>
      <p class="text-gray-600 mt-4">Loading recipes...</p>
    </div>

    <div v-else-if="recipes.length === 0" class="text-center py-12 bg-white rounded-xl shadow-sm">
      <p class="text-gray-600 text-lg">No recipes found</p>
      <p class="text-gray-500 mt-2">Try adjusting your search or filters</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <div v-if="lastPage > 1" class="flex justify-center items-center gap-4 mt-8">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="text-gray-700">
          Page {{ currentPage }} of {{ lastPage }}
        </span>
        <button
          @click="nextPage"
          :disabled="currentPage === lastPage"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </template>
  </div>
</template>
