import { watch, onUnmounted } from 'vue'

/**
 * Composable to handle modal behavior
 * - Prevents body scroll when modal is open
 * - Manages z-index stacking
 * - Handles escape key to close
 */
export function useModal(isOpen: () => boolean, onClose?: () => void) {
  // Track if we locked the body scroll
  let hasLockedScroll = false

  // Lock/unlock body scroll based on modal state
  watch(
    isOpen,
    (open) => {
      if (open) {
        // Lock body scroll
        document.body.classList.add('modal-open')
        document.body.style.overflow = 'hidden'
        hasLockedScroll = true
      } else if (hasLockedScroll) {
        // Unlock body scroll
        document.body.classList.remove('modal-open')
        document.body.style.overflow = ''
        hasLockedScroll = false
      }
    },
    { immediate: true }
  )

  // Handle escape key
  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen() && onClose) {
      onClose()
    }
  }

  // Add escape listener if onClose provided
  if (onClose) {
    document.addEventListener('keydown', handleEscape)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (hasLockedScroll) {
      document.body.classList.remove('modal-open')
      document.body.style.overflow = ''
    }
    if (onClose) {
      document.removeEventListener('keydown', handleEscape)
    }
  })

  return {
    // Can add more modal utilities here if needed
  }
}
