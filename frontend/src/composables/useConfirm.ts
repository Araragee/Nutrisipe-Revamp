import { readonly, ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

const options = ref<ConfirmOptions | null>(null)
let resolver: ((ok: boolean) => void) | null = null

function settle(ok: boolean) {
  resolver?.(ok)
  resolver = null
  options.value = null
}

// ponytail: one dialog at a time; a second call cancels the first
function confirm(opts: ConfirmOptions): Promise<boolean> {
  settle(false)
  options.value = opts
  return new Promise(resolve => { resolver = resolve })
}

export function useConfirm() {
  return { confirm, settle, options: readonly(options) }
}
