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

    // TODO(audit:F-09) [MEDIUM] Overlapping toasts race: a second showToast within 3s gets cleared early by the first timer — keep the timer handle and clearTimeout before re-arming.
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
