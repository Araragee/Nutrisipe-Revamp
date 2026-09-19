// TODO(nutritionist): verify — FNRI-DOST PDRI 2015 Acceptable Macronutrient Distribution Ranges, adults 19+.
// % of total energy. Children/pregnant/lactating ranges differ — not handled yet.
export const AMDR = {
  carbs: { min: 55, max: 75, kcalPerGram: 4 },
  protein: { min: 10, max: 15, kcalPerGram: 4 },
  fat: { min: 15, max: 30, kcalPerGram: 9 },
} as const

export type Macro = keyof typeof AMDR

export interface MacroShare {
  macro: Macro
  pct: number
  status: 'low' | 'ok' | 'high'
}

export function macroDistribution(grams: Record<Macro, number>): MacroShare[] {
  const kcal = (m: Macro) => grams[m] * AMDR[m].kcalPerGram
  const total = kcal('carbs') + kcal('protein') + kcal('fat')
  if (!total) return []
  return (Object.keys(AMDR) as Macro[]).map((macro) => {
    const pct = Math.round((kcal(macro) / total) * 100)
    const { min, max } = AMDR[macro]
    return { macro, pct, status: pct < min ? 'low' : pct > max ? 'high' : 'ok' }
  })
}
