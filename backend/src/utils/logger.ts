import { env } from '../config/env'

const isDev = env.NODE_ENV !== 'production'

export const logger = {
  /** Debug info: only printed outside production. */
  log: (...args: unknown[]): void => { if (isDev) console.log(...args) },
  /** Warnings: only printed outside production. */
  warn: (...args: unknown[]): void => { if (isDev) console.warn(...args) },
  /** Errors: always logged so failures surface in any environment. */
  error: (...args: unknown[]): void => { console.error(...args) },
}
