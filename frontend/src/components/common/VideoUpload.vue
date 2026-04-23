<template>
  <div class="video-upload">
    <div v-if="!videoUrl" class="upload-area" @click="triggerFileInput">
      <input
        ref="fileInputRef"
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
        @change="handleFileSelect"
        class="file-input"
      />

      <div class="upload-content">
        <div class="upload-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h4>Upload Video</h4>
        <p>Click to select or drag and drop</p>
        <div class="file-info">
          <span>Supported: MP4, WebM, MOV, AVI</span>
          <span>Max size: 100MB</span>
          <span>Max duration: 10 minutes</span>
        </div>
      </div>
    </div>

    <div v-else class="video-preview">
      <video
        :src="videoUrl"
        :poster="thumbnailUrl"
        controls
        class="preview-video"
      />

      <div class="video-info">
        <div class="info-row">
          <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          <span>Duration: {{ formatDuration(duration) }}</span>
        </div>

        <button @click="removeVideo" class="remove-button">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove Video
        </button>
      </div>
    </div>

    <div v-if="uploading" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <span class="progress-text">Uploading... {{ uploadProgress }}%</span>
    </div>

    <div v-if="error" class="error-message">
      <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Optional thumbnail upload -->
    <div v-if="videoUrl && allowThumbnail" class="thumbnail-section">
      <h4>Custom Thumbnail (Optional)</h4>
      <div v-if="!customThumbnail" class="thumbnail-upload" @click="triggerThumbnailInput">
        <input
          ref="thumbnailInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="handleThumbnailSelect"
          class="file-input"
        />
        <div class="thumbnail-content">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Upload custom thumbnail</span>
        </div>
      </div>
      <div v-else class="thumbnail-preview">
        <img :src="customThumbnail" alt="Thumbnail" />
        <button @click="removeThumbnail" class="remove-thumbnail">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { httpClient } from '@/http/client'
import type { AxiosProgressEvent } from 'axios'

interface Props {
  modelValue?: {
    videoUrl: string
    thumbnailUrl?: string
    duration: number
  } | null
  allowThumbnail?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  allowThumbnail: true
})

const emit = defineEmits<{
  'update:modelValue': [value: { videoUrl: string; thumbnailUrl?: string; duration: number } | null]
  error: [message: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const thumbnailInputRef = ref<HTMLInputElement | null>(null)

const videoUrl = ref(props.modelValue?.videoUrl || '')
const thumbnailUrl = ref(props.modelValue?.thumbnailUrl || '')
const duration = ref(props.modelValue?.duration || 0)
const customThumbnail = ref<string | null>(null)

const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref<string | null>(null)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const triggerThumbnailInput = () => {
  thumbnailInputRef.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file
  error.value = null

  // Check file size (100MB)
  if (file.size > 100 * 1024 * 1024) {
    error.value = 'Video file is too large. Maximum size is 100MB.'
    emit('error', error.value)
    return
  }

  // Check file type
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Invalid video format. Please use MP4, WebM, MOV, or AVI.'
    emit('error', error.value)
    return
  }

  await uploadVideo(file)
}

const uploadVideo = async (file: File) => {
  uploading.value = true
  uploadProgress.value = 0
  error.value = null

  try {
    const formData = new FormData()
    formData.append('video', file)

    if (customThumbnail.value && thumbnailInputRef.value?.files?.[0]) {
      formData.append('thumbnail', thumbnailInputRef.value.files[0])
    }

    const response = await httpClient.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })

    videoUrl.value = response.data.data.videoUrl
    thumbnailUrl.value = response.data.data.thumbnailUrl
    duration.value = response.data.data.duration

    emit('update:modelValue', {
      videoUrl: videoUrl.value,
      thumbnailUrl: thumbnailUrl.value,
      duration: duration.value
    })
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to upload video'
    emit('error', error.value || 'Failed to upload video')
  } finally {
    uploading.value = false
  }
}

const handleThumbnailSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    customThumbnail.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeVideo = () => {
  videoUrl.value = ''
  thumbnailUrl.value = ''
  duration.value = 0
  customThumbnail.value = null
  error.value = null

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }

  emit('update:modelValue', null)
}

const removeThumbnail = () => {
  customThumbnail.value = null
  if (thumbnailInputRef.value) {
    thumbnailInputRef.value.value = ''
  }
}

const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.video-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
}

.upload-area:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.upload-icon {
  width: 4rem;
  height: 4rem;
  background: #ecfdf5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
}

.upload-icon svg {
  width: 2rem;
  height: 2rem;
}

.upload-content h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.upload-content p {
  color: #6b7280;
  margin: 0;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.file-info span {
  font-size: 0.75rem;
  color: #9ca3af;
}

.video-preview {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #000;
}

.preview-video {
  width: 100%;
  max-height: 400px;
  display: block;
}

.video-info {
  padding: 1rem;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.info-row .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.remove-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.remove-button:hover {
  background: #fecaca;
}

.remove-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.upload-progress {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.error-message .icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.thumbnail-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.thumbnail-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.thumbnail-upload {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.thumbnail-upload:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.thumbnail-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.thumbnail-content svg {
  width: 2rem;
  height: 2rem;
}

.thumbnail-preview {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  max-width: 400px;
}

.thumbnail-preview img {
  width: 100%;
  display: block;
}

.remove-thumbnail {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-thumbnail:hover {
  background: rgba(0, 0, 0, 0.9);
}

.remove-thumbnail svg {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
