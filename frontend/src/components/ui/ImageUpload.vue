<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: string
  maxSize?: number // in MB
  accept?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  maxSize: 5, // 5MB default
  accept: 'image/*',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  error: [message: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const previewUrl = ref(props.modelValue)

const hasImage = computed(() => !!previewUrl.value)

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await processFile(file)
  }
}

async function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    await processFile(file)
  }
}

async function processFile(file: File) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    emit('error', 'Please select an image file')
    return
  }

  // Validate file size
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > props.maxSize) {
    emit('error', `Image size must be less than ${props.maxSize}MB`)
    return
  }

  isUploading.value = true

  try {
    // Convert to base64 or upload to cloud storage
    // For now, we'll use base64 for simplicity
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      previewUrl.value = result
      emit('update:modelValue', result)
      isUploading.value = false
    }

    reader.onerror = () => {
      emit('error', 'Failed to read image file')
      isUploading.value = false
    }

    reader.readAsDataURL(file)
  } catch (error) {
    emit('error', 'Failed to upload image')
    isUploading.value = false
  }
}

function removeImage() {
  previewUrl.value = ''
  emit('update:modelValue', '')
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}
</script>

<template>
  <div class="space-y-4">
    <!-- Upload Area -->
    <div
      v-if="!hasImage"
      @click="openFilePicker"
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      :class="[
        'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragging
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
          : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500',
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        @change="handleFileSelect"
        class="hidden"
      />

      <div v-if="isUploading" class="flex flex-col items-center">
        <svg
          class="w-12 h-12 text-orange-500 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
      </div>

      <div v-else class="flex flex-col items-center">
        <svg
          class="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Click to upload or drag and drop
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          PNG, JPG, GIF up to {{ maxSize }}MB
        </p>
      </div>
    </div>

    <!-- Image Preview -->
    <div v-if="hasImage" class="relative">
      <img
        :src="previewUrl"
        alt="Preview"
        class="w-full h-64 object-cover rounded-lg"
      />
      <button
        @click="removeImage"
        class="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
