import { env } from '../config/env'

const isDev = env.NODE_ENV !== 'production'

export const logger = {
  log: (...args: unknown[]): void => { if (isDev) console.log(...args) },
  warn: (...args: unknown[]): void => { if (isDev) console.warn(...args) },
  error: (...args: unknown[]): void => { console.error(...args) },
}
