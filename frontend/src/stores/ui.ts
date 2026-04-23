import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const pinModalOpen = ref(false)
  const selectedPostId = ref<string | null>(null)
  const sidebarCollapsed = ref(false)
  const toastMessage = ref<string | null>(null)
  const toastType = ref<'success' | 'error' | 'info'>('info')

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

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toastMessage.value = message
    toastType.value = type

    setTimeout(() => {
      toastMessage.value = null
    }, 3000)
  }

  return {
    pinModalOpen,
    selectedPostId,
    sidebarCollapsed,
    toastMessage,
    toastType,
    openPinModal,
    closePinModal,
    toggleSidebar,
    showToast,
  }
})
