<script setup lang="ts">
import { ref, computed } from 'vue'
import { postsApi } from '@/http/endpoints/posts'
import type { Post } from '@/typescript/interface/Post'

interface CreatePostData {
  title: string
  description?: string
  imageUrl: string
  category: string
  tags: string[]
  isPublic?: boolean
}
import { useFeedStore } from '@/stores/feed'
import { useModal } from '@/composables/useModal'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import RichTextEditor from '@/components/ui/RichTextEditor.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'

const showImageUpload = ref(false)

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

// Handle modal body scroll lock
useModal(() => props.show, () => emit('close'))

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

    const newPost = (await postsApi.create(data as Partial<Post>)).data.data

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
  <BaseModal :show="show" title="Create Post" size="lg" @close="handleClose">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Error Message -->
      <div
        v-if="error"
        class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
      >
        {{ error }}
      </div>

      <!-- Title -->
      <div>
        <label
          for="title"
          class="mb-2 block font-montserrat text-[11px] font-bold uppercase tracking-widest text-text-dim"
        >
          Title <span class="text-orange">*</span>
        </label>
        <input
          id="title"
          v-model="title"
          type="text"
          required
          placeholder="What are you cooking?"
          class="w-full rounded-xl border-1.5 border-border bg-background-secondary px-4 py-3 text-sm text-text outline-none transition-colors duration-200 focus:border-orange"
        />
      </div>

      <!-- Category -->
      <div>
        <label
          for="category"
          class="mb-2 block font-montserrat text-[11px] font-bold uppercase tracking-widest text-text-dim"
        >
          Category <span class="text-orange">*</span>
        </label>
        <select
          id="category"
          v-model="category"
          required
          class="w-full rounded-xl border-1.5 border-border bg-background-secondary px-4 py-3 text-sm text-text outline-none transition-colors duration-200 focus:border-orange"
        >
          <option v-for="cat in categories" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
        </select>
      </div>

      <!-- Image Upload -->
      <div>
        <label
          class="mb-2 block font-montserrat text-[11px] font-bold uppercase tracking-widest text-text-dim"
        >
          Post Image <span class="text-orange">*</span>
        </label>
        <ImageUpload v-model="imageUrl" :max-size="5" @error="(msg) => (error = msg)" />
        <p class="mt-2 text-xs text-text-dim">Upload an image for your post (max 5MB).</p>
      </div>

      <!-- Description -->
      <div>
        <label
          class="mb-2 block font-montserrat text-[11px] font-bold uppercase tracking-widest text-text-dim"
        >
          Description
        </label>
        <RichTextEditor v-model="description" placeholder="Tell the story behind it…" :max-length="2000" />
      </div>

      <!-- Tags -->
      <div>
        <label
          for="tags"
          class="mb-2 block font-montserrat text-[11px] font-bold uppercase tracking-widest text-text-dim"
        >
          Tags
        </label>
        <input
          id="tags"
          v-model="tags"
          type="text"
          placeholder="healthy, quick, easy"
          class="w-full rounded-xl border-1.5 border-border bg-background-secondary px-4 py-3 text-sm text-text outline-none transition-colors duration-200 focus:border-orange"
        />
        <p class="mt-2 text-xs text-text-dim">Separate tags with commas.</p>
        <div v-if="tagsArray.length > 0" class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="tag in tagsArray"
            :key="tag"
            class="rounded-full bg-orange-soft px-3 py-1 text-xs font-semibold text-orange"
          >
            #{{ tag }}
          </span>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex gap-3">
        <BaseButton
          buttonType="primaryOutlined"
          rounded="full"
          @click="handleClose"
          :disabled="isSubmitting"
          class="flex-1"
        >
          Cancel
        </BaseButton>
        <BaseButton
          buttonType="primary"
          rounded="full"
          :disabled="!canSubmit"
          :loading="isSubmitting"
          class="flex-1"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Creating…' : 'Create Post' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
