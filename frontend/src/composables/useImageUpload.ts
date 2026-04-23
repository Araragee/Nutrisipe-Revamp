import { ref } from 'vue'

export function useImageUpload() {
  const file = ref<File | null>(null)
  const preview = ref<string | null>(null)
  const error = ref<string | null>(null)

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']

  const handleUpload = (event: Event) => {
    error.value = null
    const target = event.target as HTMLInputElement
    const selectedFile = target.files?.[0]

    if (!selectedFile) return

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      error.value = 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
      file.value = null
      preview.value = null
      return
    }

    if (selectedFile.size > MAX_SIZE) {
      error.value = 'Image size must be less than 5MB'
      file.value = null
      preview.value = null
      return
    }

    file.value = selectedFile

    const reader = new FileReader()
    reader.onload = (e) => {
      preview.value = e.target?.result as string
    }
    reader.readAsDataURL(selectedFile)
  }

  const reset = () => {
    file.value = null
    preview.value = null
    error.value = null
  }

  return {
    file,
    preview,
    error,
    handleUpload,
    reset,
  }
}
