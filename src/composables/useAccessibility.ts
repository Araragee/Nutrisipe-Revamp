import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Composable for handling modal accessibility (focus trap, escape key)
 */
export function useModalAccessibility(isOpen: () => boolean, onClose: () => void) {
  const modalRef = ref<HTMLElement | null>(null)
  let previouslyFocusedElement: HTMLElement | null = null

  function trapFocus(e: KeyboardEvent) {
    if (!isOpen() || !modalRef.value) return
    if (e.key !== 'Tab') return

    const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen()) {
      onClose()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', trapFocus)
    document.addEventListener('keydown', handleEscape)

    // Store currently focused element
    previouslyFocusedElement = document.activeElement as HTMLElement

    // Focus first focusable element in modal
    if (isOpen() && modalRef.value) {
      const firstFocusable = modalRef.value.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', trapFocus)
    document.removeEventListener('keydown', handleEscape)

    // Restore focus to previously focused element
    previouslyFocusedElement?.focus()
  })

  return { modalRef }
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}
