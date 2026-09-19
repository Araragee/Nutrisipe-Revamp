import { describe, it, expect } from 'vitest'
import { macroDistribution } from './nutritionTargets'

describe('macroDistribution', () => {
  it('computes % of energy and flags out-of-range', () => {
    expect(macroDistribution({ carbs: 250, protein: 50, fat: 80 })).toEqual([
      { macro: 'carbs', pct: 52, status: 'low' },
      { macro: 'protein', pct: 10, status: 'ok' },
      { macro: 'fat', pct: 38, status: 'high' },
    ])
  })

  it('returns empty for no data', () => {
    expect(macroDistribution({ carbs: 0, protein: 0, fat: 0 })).toEqual([])
  })
})
