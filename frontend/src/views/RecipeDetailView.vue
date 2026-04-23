<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { recipesApi, commentsApi } from '@/api'
import type { Recipe, Comment } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const recipe = ref<Recipe | null>(null)
const comments = ref<Comment[]>([])
const relatedRecipes = ref<Recipe[]>([])
const loading = ref(true)
const commentText = ref('')
const submittingComment = ref(false)

const recipeId = computed(() => Number(route.params.id))
const isOwner = computed(() => authStore.user?.id === recipe.value?.user_id)
const isSaved = computed(() => recipe.value?.is_saved || false)

const loadRecipe = async () => {
  loading.value = true
  try {
    const response = await recipesApi.getRecipe(recipeId.value)
    recipe.value = response.data.data
    await Promise.all([loadComments(), loadRelatedRecipes()])
  } catch (error) {
    console.error('Failed to load recipe:', error)
    router.push('/')
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  try {
    const response = await commentsApi.getComments(recipeId.value)
    comments.value = response.data.data
  } catch (error) {
    console.error('Failed to load comments:', error)
  }
}

const loadRelatedRecipes = async () => {
  try {
    const response = await recipesApi.getRelatedRecipes(recipeId.value)
    relatedRecipes.value = response.data.data
  } catch (error) {
    console.error('Failed to load related recipes:', error)
  }
}

const toggleSave = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    if (isSaved.value) {
      await recipesApi.unsaveRecipe(recipeId.value)
    } else {
      await recipesApi.saveRecipe(recipeId.value)
    }
    await loadRecipe()
  } catch (error) {
    console.error('Failed to toggle save:', error)
  }
}

const submitComment = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (!commentText.value.trim()) return

  submittingComment.value = true
  try {
    await commentsApi.createComment(recipeId.value, commentText.value)
    commentText.value = ''
    await loadComments()
  } catch (error) {
    console.error('Failed to submit comment:', error)
  } finally {
    submittingComment.value = false
  }
}

const deleteComment = async (commentId: number) => {
  if (!confirm('Are you sure you want to delete this comment?')) return

  try {
    await commentsApi.deleteComment(commentId)
    await loadComments()
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}

const deleteRecipe = async () => {
  if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) return

  try {
    await recipesApi.deleteRecipe(recipeId.value)
    router.push('/')
  } catch (error) {
    console.error('Failed to delete recipe:', error)
  }
}

const toggleHide = async () => {
  try {
    await recipesApi.toggleHide(recipeId.value)
    await loadRecipe()
  } catch (error) {
    console.error('Failed to toggle hide:', error)
  }
}

onMounted(() => {
  loadRecipe()
})
</script>

<template>
  <div v-if="loading" class="max-w-7xl mx-auto px-4 py-8">
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-base"></div>
      <p class="text-gray-600 mt-4">Loading recipe...</p>
    </div>
  </div>

  <div v-else-if="recipe" class="max-w-7xl mx-auto px-4 py-8">
    <div class="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
      <div class="aspect-video bg-gray-200 overflow-hidden">
        <img
          v-if="recipe.image"
          :src="`http://localhost:8000/storage/${recipe.image}`"
          :alt="recipe.title"
          class="w-full h-full object-cover"
        />
      </div>

      <div class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-heading-2 font-bold text-gray-900">{{ recipe.title }}</h1>
              <span class="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                {{ recipe.category }}
              </span>
              <span v-if="recipe.is_hidden" class="px-3 py-1 bg-error-100 text-error-700 text-sm font-medium rounded-full">
                Hidden
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <router-link :to="`/users/${recipe.user.id}`" class="hover:text-primary-base">
                By {{ recipe.user.name }}
              </router-link>
              <span>• Serves {{ recipe.nutrition_fact.yield_amount }}</span>
              <span>• {{ recipe.saved_by_count }} saves</span>
              <span>• {{ recipe.comments_count }} comments</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="toggleSave"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                isSaved
                  ? 'bg-error-base text-white hover:bg-error-700'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
            >
              {{ isSaved ? '❤️ Saved' : '🤍 Save' }}
            </button>

            <template v-if="isOwner || authStore.isAdmin">
              <router-link
                v-if="isOwner"
                :to="`/recipes/${recipe.id}/edit`"
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit
              </router-link>
              <button
                v-if="isOwner"
                @click="toggleHide"
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {{ recipe.is_hidden ? 'Unhide' : 'Hide' }}
              </button>
              <button
                @click="deleteRecipe"
                class="px-4 py-2 bg-error-base text-white rounded-lg hover:bg-error-700 transition-colors"
              >
                Delete
              </button>
            </template>
          </div>
        </div>

        <p class="text-gray-700 mb-6">{{ recipe.description }}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 class="text-heading-4 font-semibold text-gray-900 mb-4">Ingredients</h2>
            <ul class="space-y-2">
              <li
                v-for="ingredient in recipe.recipe_ingredients"
                :key="ingredient.id"
                class="flex items-center gap-2 text-gray-700"
              >
                <span class="w-2 h-2 bg-primary-base rounded-full"></span>
                <span>{{ ingredient.amount }}g {{ ingredient.name }}</span>
                <span v-if="ingredient.is_custom" class="text-xs text-gray-500">(custom)</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 class="text-heading-4 font-semibold text-gray-900 mb-4">Nutrition Facts</h2>
            <div class="bg-gray-50 rounded-lg p-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Serving Size:</span>
                <span class="font-medium text-gray-900">{{ recipe.nutrition_fact.serving_size }}g</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Energy:</span>
                <span class="font-medium text-gray-900">{{ recipe.nutrition_fact.energy }} kcal</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Protein:</span>
                <span class="font-medium text-gray-900">{{ recipe.nutrition_fact.protein }}g</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Fat:</span>
                <span class="font-medium text-gray-900">{{ recipe.nutrition_fact.fat }}g</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Carbohydrates:</span>
                <span class="font-medium text-gray-900">{{ recipe.nutrition_fact.carb }}g</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Calcium:</span>
                <span class="font-medium text-gray-900">{{ recipe.nutrition_fact.calcium }}mg</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Iron:</span>
                <span class="font-medium text-gray-900">{{ recipe.nutrition_fact.iron }}mg</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-heading-4 font-semibold text-gray-900 mb-4">Instructions</h2>
          <ol class="space-y-3">
            <li
              v-for="(step, index) in recipe.procedure"
              :key="index"
              class="flex gap-4"
            >
              <span class="flex-shrink-0 w-8 h-8 bg-primary-base text-white rounded-full flex items-center justify-center font-semibold">
                {{ index + 1 }}
              </span>
              <p class="text-gray-700 pt-1">{{ step }}</p>
            </li>
          </ol>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-heading-4 font-semibold text-gray-900 mb-4">
        Comments ({{ comments.length }})
      </h2>

      <div v-if="authStore.isAuthenticated" class="mb-6">
        <textarea
          v-model="commentText"
          placeholder="Add a comment..."
          rows="3"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent resize-none"
        ></textarea>
        <button
          @click="submitComment"
          :disabled="!commentText.trim() || submittingComment"
          class="mt-2 px-4 py-2 bg-primary-base text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submittingComment ? 'Posting...' : 'Post Comment' }}
        </button>
      </div>

      <div v-else class="mb-6 p-4 bg-gray-50 rounded-lg text-center">
        <p class="text-gray-600">
          <router-link to="/login" class="text-primary-base hover:underline">Sign in</router-link>
          to leave a comment
        </p>
      </div>

      <div class="space-y-4">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="border-b border-gray-200 pb-4 last:border-0"
        >
          <div class="flex items-start justify-between mb-2">
            <div>
              <router-link :to="`/users/${comment.user.id}`" class="font-medium text-gray-900 hover:text-primary-base">
                {{ comment.user.name }}
              </router-link>
              <span class="text-sm text-gray-500 ml-2">
                {{ new Date(comment.created_at).toLocaleDateString() }}
              </span>
            </div>
            <button
              v-if="authStore.user?.id === comment.user.id || authStore.isAdmin"
              @click="deleteComment(comment.id)"
              class="text-sm text-error-base hover:text-error-700"
            >
              Delete
            </button>
          </div>
          <p class="text-gray-700">{{ comment.comment }}</p>
        </div>
      </div>
    </div>

    <div v-if="relatedRecipes.length > 0" class="bg-white rounded-xl shadow-lg p-6">
      <h2 class="text-heading-4 font-semibold text-gray-900 mb-4">Related Recipes</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="related in relatedRecipes"
          :key="related.id"
          @click="router.push(`/recipes/${related.id}`)"
          class="cursor-pointer hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-200"
        >
          <div class="aspect-video bg-gray-200 overflow-hidden">
            <img
              v-if="related.image"
              :src="`http://localhost:8000/storage/${related.image}`"
              :alt="related.title"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="p-3">
            <h3 class="font-medium text-gray-900 line-clamp-1">{{ related.title }}</h3>
            <p class="text-sm text-gray-600 line-clamp-1">{{ related.user.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
