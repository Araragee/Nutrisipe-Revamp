import { ref, watch } from 'vue'

type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'nutrisipe-theme'

function readStored(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system'
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'system'
}

function prefersDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

const mode = ref<ThemeMode>(readStored())
const isDark = ref<boolean>(mode.value === 'dark' || (mode.value === 'system' && prefersDark()))
let mqListener: ((e: MediaQueryListEvent) => void) | null = null

function applyClass(dark: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (dark) root.classList.add('dark')
  else root.classList.remove('dark')
}

function attachSystemListener() {
  if (typeof window === 'undefined' || mqListener) return
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mqListener = (e) => {
    if (mode.value === 'system') {
      isDark.value = e.matches
    }
  }
  mq.addEventListener('change', mqListener)
}

function setMode(next: ThemeMode) {
  mode.value = next
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next)
  isDark.value = next === 'dark' || (next === 'system' && prefersDark())
}

watch(
  isDark,
  (val) => {
    applyClass(val)
  },
  { immediate: true },
)

export function useTheme() {
  attachSystemListener()
  return { mode, isDark, setMode }
}
