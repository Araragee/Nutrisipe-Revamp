import { ref, onMounted, onUnmounted } from 'vue'
import { SCROLL_THRESHOLD, DEBOUNCE_MS } from '@/utils/constants'

export function useInfiniteScroll() {
  const isNearBottom = ref(false)
  let timeout: ReturnType<typeof setTimeout> | null = null

  function checkScroll() {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const clientHeight = window.innerHeight

      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

      isNearBottom.value = scrollPercentage > SCROLL_THRESHOLD
    }, DEBOUNCE_MS)
  }

  onMounted(() => {
    window.addEventListener('scroll', checkScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', checkScroll)
    if (timeout) clearTimeout(timeout)
  })

  return { isNearBottom }
}
