<script setup lang="ts">
import { ref, computed } from 'vue'
import { createPost, type CreatePostData } from '@/http/posts'
import { useFeedStore } from '@/stores/feed'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const feedStore = useFeedStore()

const title = ref('')
const description = ref('')
const imageUrl = ref('')
const category = ref('recipe')
const tags = ref('')
const isSubmitting = ref(false)
const error = ref<string | null>(null)

const categories = [
  { value: 'recipe', label: 'Recipe' },
  { value: 'meal_photo', label: 'Meal Photo' },
  { value: 'nutrition_tip', label: 'Nutrition Tip' },
  { value: 'cooking_technique', label: 'Cooking Technique' },
]

const tagsArray = computed(() => {
  return tags.value
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
})

const canSubmit = computed(() => {
  return title.value.trim() && imageUrl.value.trim() && !isSubmitting.value
})

async function handleSubmit() {
  if (!canSubmit.value) return

  isSubmitting.value = true
  error.value = null

  try {
    const data: CreatePostData = {
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      imageUrl: imageUrl.value.trim(),
      category: category.value,
      tags: tagsArray.value,
      isPublic: true,
    }

    const newPost = await createPost(data)

    // Add to feed store
    feedStore.addPost(newPost)

    // Reset form
    title.value = ''
    description.value = ''
    imageUrl.value = ''
    category.value = 'recipe'
    tags.value = ''

    emit('created')
    emit('close')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create post'
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('close')
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
        <h2 class="text-2xl font-bold text-gray-900">Create Post</h2>
        <button
          @click="handleClose"
          :disabled="isSubmitting"
          class="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <!-- Title -->
        <div>
          <label for="title" class="block text-sm font-semibold text-gray-700 mb-2">
            Title *
          </label>
          <input
            id="title"
            v-model="title"
            type="text"
            required
            placeholder="Enter post title"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <!-- Category -->
        <div>
          <label for="category" class="block text-sm font-semibold text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            v-model="category"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          >
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>

        <!-- Image URL -->
        <div>
          <label for="imageUrl" class="block text-sm font-semibold text-gray-700 mb-2">
            Image URL *
          </label>
          <input
            id="imageUrl"
            v-model="imageUrl"
            type="url"
            required
            placeholder="https://example.com/image.jpg"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <p class="mt-2 text-sm text-gray-500">
            Enter a URL to an image for your post
          </p>
        </div>

        <!-- Image Preview -->
        <div v-if="imageUrl" class="rounded-lg overflow-hidden border border-gray-200">
          <img
            :src="imageUrl"
            alt="Preview"
            class="w-full h-48 object-cover"
            @error="() => {}"
          />
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            v-model="description"
            rows="4"
            placeholder="Tell us about your post..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <!-- Tags -->
        <div>
          <label for="tags" class="block text-sm font-semibold text-gray-700 mb-2">
            Tags
          </label>
          <input
            id="tags"
            v-model="tags"
            type="text"
            placeholder="healthy, quick, easy (comma separated)"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <p class="mt-2 text-sm text-gray-500">
            Separate tags with commas
          </p>
          <div v-if="tagsArray.length > 0" class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="tag in tagsArray"
              :key="tag"
              class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <BaseButton
            type="button"
            variant="secondary"
            @click="handleClose"
            :disabled="isSubmitting"
            class="flex-1"
          >
            Cancel
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            :disabled="!canSubmit"
            :loading="isSubmitting"
            class="flex-1"
          >
            {{ isSubmitting ? 'Creating...' : 'Create Post' }}
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
