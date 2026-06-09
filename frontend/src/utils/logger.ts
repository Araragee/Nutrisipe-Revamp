const dev = import.meta.env.DEV

export const logger = {
  /** Debug info: only printed in development builds. */
  log: (...args: unknown[]): void => { if (dev) console.log(...args) },
  /** Warnings: only printed in development builds. */
  warn: (...args: unknown[]): void => { if (dev) console.warn(...args) },
  /** Errors: always printed so real failures surface in production too. */
  error: (...args: unknown[]): void => { console.error(...args) },
}
