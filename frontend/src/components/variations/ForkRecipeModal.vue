<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  isOpen: boolean
  originalPost: any
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = ref({
  title: '',
  variationDescription: ''
})

const isFormValid = computed(() => {
  return formData.value.title.trim().length > 0 && formData.value.variationDescription.trim().length > 0
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    formData.value = {
      title: props.originalPost?.title ? `${props.originalPost.title} (My Variation)` : '',
      variationDescription: ''
    }
  }
})

function close() {
  emit('close')
}

function handleSubmit() {
  if (!isFormValid.value) return
  emit('submit', formData.value)
}
</script>

<template>
  <BaseModal :show="isOpen" title="Create Recipe Variation" @close="close">
    <div class="space-y-6">
      <div class="bg-gray-50 dark:bg-zinc-700 p-3 rounded-lg">
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Forking recipe:</p>
        <p class="font-semibold text-gray-900 dark:text-white">{{ originalPost?.title }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="title" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            id="title"
            v-model="formData.title"
            required
            maxlength="255"
            type="text"
            placeholder="Give your variation a unique name..."
            class="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all dark:bg-zinc-700 dark:text-white"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            What Did You Change? *
          </label>
          <textarea
            id="description"
            v-model="formData.variationDescription"
            required
            maxlength="1000"
            rows="4"
            placeholder="Explain your modifications..."
            class="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all dark:bg-zinc-700 dark:text-white resize-none"
          />
        </div>
      </form>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <BaseButton type="button" variant="secondary" class="flex-1" @click="close">
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          class="flex-1"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          Create Variation
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
