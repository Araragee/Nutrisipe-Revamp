export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleTab(e: KeyboardEvent) {
    if (e.key !== 'Tab') return

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

  element.addEventListener('keydown', handleTab)

  firstElement?.focus()

  return () => {
    element.removeEventListener('keydown', handleTab)
  }
}

export function onEscape(callback: () => void): () => void {
  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      callback()
    }
  }

  document.addEventListener('keydown', handleEscape)

  return () => {
    document.removeEventListener('keydown', handleEscape)
  }
}

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

export function isElementVisible(element: HTMLElement): boolean {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  )
}

let idCounter = 0
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`
}

export function handleArrowNavigation(
  event: KeyboardEvent,
  elements: HTMLElement[],
  currentIndex: number,
  onSelect?: (index: number) => void
): number {
  let newIndex = currentIndex

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      newIndex = Math.min(currentIndex + 1, elements.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      newIndex = Math.max(currentIndex - 1, 0)
      break
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
    case 'End':
      event.preventDefault()
      newIndex = elements.length - 1
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (onSelect) {
        onSelect(currentIndex)
      }
      return currentIndex
  }

  if (newIndex !== currentIndex) {
    elements[newIndex]?.focus()
  }

  return newIndex
}

export function createSkipLink(): HTMLAnchorElement {
  const skipLink = document.createElement('a')
  skipLink.href = '#main-content'
  skipLink.textContent = 'Skip to main content'
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white focus:rounded-lg focus:shadow-lg'
  skipLink.addEventListener('click', (e) => {
    e.preventDefault()
    const main = document.getElementById('main-content')
    main?.focus()
    main?.scrollIntoView()
  })

  return skipLink
}
