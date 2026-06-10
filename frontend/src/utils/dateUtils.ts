/**
 * Returns a local-timezone ISO date string (YYYY-MM-DD).
 * Uses 'en-CA' locale which formats as ISO 8601 — locale-safe, no UTC shift.
 * Avoids the `toISOString()` UTC offset bug where +08:00 midnight becomes
 * the previous day in UTC.
 *
 * @example toLocalIsoDate(new Date()) // "2026-05-16" in PH time
 */
export function toLocalIsoDate(d: Date): string {
  return d.toLocaleDateString('en-CA') // "YYYY-MM-DD"
}

/**
 * Returns a Date set to local midnight (00:00:00 local time) for a given date.
 */
export function localMidnight(d: Date): Date {
  const result = new Date(d)
  result.setHours(0, 0, 0, 0)
  return result
}
