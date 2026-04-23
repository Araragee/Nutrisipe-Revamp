<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { recipesApi } from '@/api'
import type { Recipe, RecipeCategory } from '@/types'

const route = useRoute()
const router = useRouter()

const recipe = ref<Recipe | null>(null)
const title = ref('')
const description = ref('')
const category = ref<RecipeCategory>('Breakfast')
const image = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const procedure = ref<string[]>([''])
const isHidden = ref(false)

const categories: RecipeCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Beverage']

const loading = ref(true)
const submitting = ref(false)
const error = ref('')

const recipeId = computed(() => Number(route.params.id))

const loadRecipe = async () => {
  loading.value = true
  try {
    const response = await recipesApi.getRecipe(recipeId.value)
    recipe.value = response.data.data

    title.value = recipe.value.title
    description.value = recipe.value.description
    category.value = recipe.value.category as RecipeCategory
    procedure.value = [...recipe.value.procedure]
    isHidden.value = recipe.value.is_hidden
    imagePreview.value = `http://localhost:8000/storage/${recipe.value.image}`
  } catch (err) {
    error.value = 'Failed to load recipe'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const addProcedureStep = () => {
  procedure.value.push('')
}

const removeProcedureStep = (index: number) => {
  procedure.value.splice(index, 1)
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    image.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const validateForm = (): boolean => {
  if (!title.value.trim()) {
    error.value = 'Please enter a recipe title'
    return false
  }
  if (!description.value.trim()) {
    error.value = 'Please enter a description'
    return false
  }
  if (procedure.value.filter(step => step.trim()).length === 0) {
    error.value = 'Please add at least one instruction step'
    return false
  }

  return true
}

const submitRecipe = async () => {
  error.value = ''

  if (!validateForm()) return

  submitting.value = true
  try {
    await recipesApi.updateRecipe(recipeId.value, {
      title: title.value,
      description: description.value,
      category: category.value,
      image: image.value || undefined,
      procedure: procedure.value.filter(step => step.trim()),
    })

    router.push(`/recipes/${recipeId.value}`)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update recipe'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadRecipe()
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-base"></div>
      <p class="text-gray-600 mt-4">Loading recipe...</p>
    </div>

    <div v-else class="bg-white rounded-xl shadow-lg p-6">
      <h1 class="text-heading-2 font-bold text-gray-900 mb-6">Edit Recipe</h1>

      <div v-if="error" class="mb-6 p-4 bg-error-100 border border-error-base rounded-lg">
        <p class="text-error-base">{{ error }}</p>
      </div>

      <form @submit.prevent="submitRecipe" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            v-model="title"
            type="text"
            placeholder="Enter recipe title"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            v-model="description"
            rows="3"
            placeholder="Describe your recipe"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent resize-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            v-model="category"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Recipe Image</label>
          <div v-if="imagePreview" class="mb-4">
            <img :src="imagePreview" alt="Preview" class="w-full max-w-md h-64 object-cover rounded-lg" />
          </div>
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
          />
          <p class="text-sm text-gray-500 mt-1">Leave empty to keep current image</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
          <div class="space-y-3">
            <div
              v-for="(step, index) in procedure"
              :key="index"
              class="flex gap-2"
            >
              <span class="flex-shrink-0 w-8 h-8 bg-primary-base text-white rounded-full flex items-center justify-center font-semibold text-sm">
                {{ index + 1 }}
              </span>
              <textarea
                v-model="procedure[index]"
                rows="2"
                placeholder="Enter instruction step"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent resize-none"
              ></textarea>
              <button
                v-if="procedure.length > 1"
                type="button"
                @click="removeProcedureStep(index)"
                class="text-error-base hover:text-error-700"
              >
                Remove
              </button>
            </div>
          </div>
          <button
            type="button"
            @click="addProcedureStep"
            class="mt-3 px-4 py-2 border border-primary-base text-primary-base rounded-lg hover:bg-primary-50 transition-colors"
          >
            Add Step
          </button>
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600 mb-2">
            <strong>Note:</strong> Ingredients and nutrition facts cannot be edited after creation.
            If you need to change ingredients, please create a new recipe.
          </p>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            :disabled="submitting"
            class="flex-1 px-6 py-3 bg-primary-base text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {{ submitting ? 'Saving Changes...' : 'Save Changes' }}
          </button>
          <button
            type="button"
            @click="router.push(`/recipes/${recipeId}`)"
            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
