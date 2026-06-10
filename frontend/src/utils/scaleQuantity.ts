const FRACTION_MAP: Record<string, number> = {
  '1/2': 0.5,
  '1/3': 1 / 3,
  '2/3': 2 / 3,
  '1/4': 0.25,
  '3/4': 0.75,
  '1/8': 0.125,
  '3/8': 0.375,
  '5/8': 0.625,
  '7/8': 0.875,
}

// Order matters: most-specific alternatives must come before \d+ (which would greedily match)
const NUMERIC_RE = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.\d+|\d+)/

function parseLeadingNumber(input: string): { value: number | null; rest: string } {
  const trimmed = input.trim()
  const match = trimmed.match(NUMERIC_RE)
  if (!match) return { value: null, rest: trimmed }
  const numPart = match[1]
  const rest = trimmed.slice(match[0].length).trim()
  let value: number | null = null

  if (/^\d+\s+\d+\/\d+$/.test(numPart)) {
    const [whole, frac] = numPart.split(/\s+/)
    value = parseInt(whole, 10) + (FRACTION_MAP[frac] ?? evalFraction(frac))
  } else if (/^\d+\/\d+$/.test(numPart)) {
    value = FRACTION_MAP[numPart] ?? evalFraction(numPart)
  } else {
    value = parseFloat(numPart)
  }

  if (value == null || isNaN(value)) return { value: null, rest: trimmed }
  return { value, rest }
}

function evalFraction(frac: string): number {
  const [n, d] = frac.split('/').map(Number)
  return d ? n / d : NaN
}

function formatNumber(value: number): string {
  if (Math.abs(value - Math.round(value)) < 0.001) return String(Math.round(value))

  const whole = Math.floor(value)
  const remainder = value - whole
  for (const [label, decimal] of Object.entries(FRACTION_MAP)) {
    if (Math.abs(remainder - decimal) < 0.04) {
      return whole > 0 ? `${whole} ${label}` : label
    }
  }
  return value.toFixed(2).replace(/\.?0+$/, '')
}

export function scaleQuantity(quantity: string, factor: number): string {
  if (!quantity || factor === 1) return quantity
  const { value, rest } = parseLeadingNumber(quantity)
  if (value == null) return quantity
  const scaled = value * factor
  const num = formatNumber(scaled)
  return rest ? `${num} ${rest}` : num
}
