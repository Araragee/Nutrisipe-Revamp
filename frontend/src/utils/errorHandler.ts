import { useUiStore } from '@/stores/ui'
import type { AxiosError } from 'axios'

export interface ApiError {
  message: string
  statusCode?: number
  errors?: Record<string, string[]>
}

export function handleApiError(error: unknown): ApiError {
  const uiStore = useUiStore()

  if (isAxiosError(error)) {
    const statusCode = error.response?.status
    const message = error.response?.data?.message || error.message

    // Handle specific status codes
    switch (statusCode) {
      case 400:
        uiStore.showToast(message || 'Invalid request', 'error')
        break
      case 401:
        uiStore.showToast('Please log in to continue', 'error')
        // Could redirect to login here
        break
      case 403:
        uiStore.showToast('You do not have permission to do this', 'error')
        break
      case 404:
        uiStore.showToast(message || 'Resource not found', 'error')
        break
      case 422:
        uiStore.showToast(message || 'Validation error', 'error')
        break
      case 500:
        uiStore.showToast('Server error. Please try again later', 'error')
        break
      default:
        uiStore.showToast(message || 'Something went wrong', 'error')
    }

    return {
      message,
      statusCode,
      errors: error.response?.data?.errors,
    }
  }

  // Handle non-Axios errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  uiStore.showToast(message, 'error')

  return { message }
}

function isAxiosError(error: unknown): error is AxiosError<{ message?: string; errors?: Record<string, string[]> }> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    error.isAxiosError === true
  )
}

export function showSuccessToast(message: string) {
  const uiStore = useUiStore()
  uiStore.showToast(message, 'success')
}

export function showErrorToast(message: string) {
  const uiStore = useUiStore()
  uiStore.showToast(message, 'error')
}

export function showInfoToast(message: string) {
  const uiStore = useUiStore()
  uiStore.showToast(message, 'info')
}
