import { watch, onUnmounted } from 'vue'

export function useModal(isOpen: () => boolean, onClose?: () => void) {
  let hasLockedScroll = false

  watch(
    isOpen,
    (open) => {
      if (open) {
        document.body.classList.add('modal-open')
        document.body.style.overflow = 'hidden'
        hasLockedScroll = true
      } else if (hasLockedScroll) {
        document.body.classList.remove('modal-open')
        document.body.style.overflow = ''
        hasLockedScroll = false
      }
    },
    { immediate: true }
  )

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen() && onClose) {
      onClose()
    }
  }

  if (onClose) {
    document.addEventListener('keydown', handleEscape)
  }

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
  }
}
