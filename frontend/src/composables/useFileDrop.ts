import { ref } from 'vue'

export function useFileDrop(onFileDrop: (file: File) => void | Promise<void>) {
  const isDragging = ref(false)

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragging.value = true
  }

  function handleDragLeave() {
    isDragging.value = false
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      await onFileDrop(file)
    }
  }

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
