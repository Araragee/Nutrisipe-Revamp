import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

export const useUiStore = defineStore('ui', () => {
  const pinModalOpen = ref(false)
  const selectedPostId = ref<string | null>(null)
  const sidebarCollapsed = ref(false)

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

  function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    const toast = useToast()
    toast.addToast(message, type)
  }

  return {
    pinModalOpen,
    selectedPostId,
    sidebarCollapsed,
    openPinModal,
    closePinModal,
    toggleSidebar,
    showToast,
  }
})
