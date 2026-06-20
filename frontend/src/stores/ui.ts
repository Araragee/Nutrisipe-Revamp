import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast, type ToastType, type ToastOptions } from '@/composables/useToast'

export const useUiStore = defineStore('ui', () => {
  const pinModalOpen = ref(false)
  const createModalOpen = ref(false)
  const selectedPostId = ref<string | null>(null)
  const sidebarCollapsed = ref(false)

  function openCreateModal() {
    createModalOpen.value = true
  }

  function closeCreateModal() {
    createModalOpen.value = false
  }

  function openPinModal(postId: string) {
    selectedPostId.value = postId
    pinModalOpen.value = true
  }

  function closePinModal() {
    pinModalOpen.value = false
    selectedPostId.value = null
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // Backward-compatible: existing callers use showToast(message, type).
  // New (optional) 4th arg accepts a duration (ms) or an options object
  // ({ duration, action }) to render an action button like "Undo".
  function showToast(
    message: string,
    type: ToastType = 'info',
    options?: number | ToastOptions,
  ) {
    const toast = useToast()
    return toast.addToast(message, type, options)
  }

  return {
    pinModalOpen,
    createModalOpen,
    selectedPostId,
    sidebarCollapsed,
    openPinModal,
    closePinModal,
    openCreateModal,
    closeCreateModal,
    toggleSidebar,
    showToast,
  }
})
