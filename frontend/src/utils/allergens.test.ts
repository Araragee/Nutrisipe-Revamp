import { describe, it, expect } from 'vitest'
import { detectAllergens } from './allergens'

describe('detectAllergens', () => {
  it('matches English and Filipino terms, whole words only', () => {
    const hits = detectAllergens(['2 tbsp Toyo', 'Bagoong alamang', 'Mango', 'Eggplant'], ['Soy', 'Shellfish', 'Egg'])
    expect(hits).toEqual([
      { allergen: 'Soy', ingredients: ['2 tbsp Toyo'] },
      { allergen: 'Shellfish', ingredients: ['Bagoong alamang'] },
    ])
  })

  it('ignores unknown allergens', () => {
    expect(detectAllergens(['egg'], ['Unknown'])).toEqual([])
  })
})
