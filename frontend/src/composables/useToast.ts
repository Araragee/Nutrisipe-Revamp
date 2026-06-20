import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  /** Auto-dismiss duration in ms. `0` (or less) keeps the toast until dismissed. */
  duration?: number
  /** Optional action button, e.g. an "Undo" affordance. */
  action?: ToastAction
}

export interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
  action?: ToastAction
}

const DEFAULT_DURATION = 4000

const toasts = ref<Toast[]>([])
let toastId = 0

/**
 * Normalize the legacy `(message, type, duration)` call shape and the new
 * `(message, type, options)` shape into a single options object. Keeps every
 * existing `addToast`/`showToast` caller working unchanged.
 */
function normalizeOptions(options?: number | ToastOptions): ToastOptions {
  if (typeof options === 'number') return { duration: options }
  return options ?? {}
}

export function useToast() {
  const addToast = (
    message: string,
    type: ToastType = 'info',
    options?: number | ToastOptions,
  ) => {
    const { duration = DEFAULT_DURATION, action } = normalizeOptions(options)

    // De-dupe identical, action-less toasts so rapid repeats don't stack.
    if (!action) {
      const isDuplicate = toasts.value.some(t => t.message === message && t.type === type && !t.action)
      if (isDuplicate) return -1
    }

    const id = toastId++
    toasts.value.push({ id, message, type, duration, action })

    return id
  }

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, options?: number | ToastOptions) =>
    addToast(message, 'success', options)

  const error = (message: string, options?: number | ToastOptions) =>
    addToast(message, 'error', options)

  const warning = (message: string, options?: number | ToastOptions) =>
    addToast(message, 'warning', options)

  const info = (message: string, options?: number | ToastOptions) =>
    addToast(message, 'info', options)

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
