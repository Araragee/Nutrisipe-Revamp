export function toLocalIsoDate(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

export function localMidnight(d: Date): Date {
  const result = new Date(d)
  result.setHours(0, 0, 0, 0)
  return result
}
