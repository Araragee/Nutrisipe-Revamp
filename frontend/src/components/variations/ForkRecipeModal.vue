<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content relative">
      <button @click="close" class="close-button absolute top-4 right-4 z-10">×</button>
      <div class="modal-header">
        <h2 class="modal-title">Create Recipe Variation</h2>
      </div>

      <div class="modal-body">
        <div class="original-info">
          <p class="info-label">Forking recipe:</p>
          <p class="info-value">{{ originalPost?.title }}</p>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Title*</label>
            <input v-model="formData.title" required maxlength="255" placeholder="Give your variation a unique name..." />
          </div>

          <div class="form-group">
            <label>What Did You Change?*</label>
            <textarea v-model="formData.variationDescription" required rows="4" maxlength="1000" placeholder="Explain your modifications..."></textarea>
          </div>

          <div class="actions">
            <button type="button" @click="close" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="!isFormValid">Create Variation</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

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

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #6b7280;
  line-height: 1;
}

.modal-body {
  padding: 24px;
}

.original-info {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 4px 0;
}

.info-value {
  font-weight: 600;
  margin: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
