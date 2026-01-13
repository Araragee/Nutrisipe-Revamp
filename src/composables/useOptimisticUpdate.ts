import { useUiStore } from '@/stores/ui'

export function useOptimisticUpdate() {
  const uiStore = useUiStore()

  async function execute<T>(
    optimisticUpdate: () => void,
    apiCall: () => Promise<T>,
    rollback: () => void
  ): Promise<T | null> {
    optimisticUpdate()

    try {
      const result = await apiCall()
      return result
    } catch (error: any) {
      rollback()
      uiStore.showToast(error.response?.data?.message || 'Operation failed', 'error')
      return null
    }
  }

  return { execute }
}
