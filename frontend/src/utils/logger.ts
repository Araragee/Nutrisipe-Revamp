const dev = import.meta.env.DEV

export const logger = {
  log: (...args: unknown[]): void => { if (dev) console.log(...args) },
  warn: (...args: unknown[]): void => { if (dev) console.warn(...args) },
  error: (...args: unknown[]): void => { console.error(...args) },
}
