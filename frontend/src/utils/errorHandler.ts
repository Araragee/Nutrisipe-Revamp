import { useUiStore } from '@/stores/ui'
import type { AxiosError } from 'axios'

export interface ApiError {
  message: string
  statusCode?: number
  errors?: Record<string, string[]>
}

export function handleApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const statusCode = error.response?.status
    const message = error.response?.data?.message || error.message

    return {
      message,
      statusCode,
      errors: error.response?.data?.errors,
    }
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
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
