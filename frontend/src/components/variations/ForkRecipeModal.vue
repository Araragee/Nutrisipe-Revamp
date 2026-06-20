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
      <div class="flex items-center gap-3 bg-orange-soft border border-orange/20 p-3.5 rounded-2xl">
        <span class="shrink-0 w-9 h-9 rounded-full bg-orange/15 text-orange grid place-items-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </span>
        <div class="min-w-0">
          <p class="text-[10px] font-montserrat font-bold uppercase tracking-widest text-text-dim mb-0.5">Forking recipe</p>
          <p class="font-montserrat font-bold text-text truncate">{{ originalPost?.title }}</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label for="title" class="block text-[11px] font-montserrat font-bold uppercase tracking-widest text-text-dim">
            Title <span class="text-orange">*</span>
          </label>
          <input
            id="title"
            v-model="formData.title"
            required
            maxlength="255"
            type="text"
            placeholder="Give your variation a unique name…"
            class="w-full px-4 py-3 bg-background border border-border rounded-2xl text-text outline-none transition-colors duration-200 ease-out focus:border-orange placeholder:text-text-dim"
          />
        </div>

        <div class="space-y-2">
          <label for="description" class="block text-[11px] font-montserrat font-bold uppercase tracking-widest text-text-dim">
            What Did You Change? <span class="text-orange">*</span>
          </label>
          <textarea
            id="description"
            v-model="formData.variationDescription"
            required
            maxlength="1000"
            rows="4"
            placeholder="Explain your modifications…"
            class="w-full px-4 py-3 bg-background border border-border rounded-2xl text-text leading-relaxed outline-none transition-colors duration-200 ease-out focus:border-orange placeholder:text-text-dim resize-y"
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
