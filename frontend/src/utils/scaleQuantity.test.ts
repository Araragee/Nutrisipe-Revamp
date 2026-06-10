import { describe, it, expect } from 'vitest'
import { scaleQuantity } from './scaleQuantity'

describe('scaleQuantity', () => {
  describe('factor = 1 (no-op)', () => {
    it('returns input unchanged', () => {
      expect(scaleQuantity('2 cups', 1)).toBe('2 cups')
      expect(scaleQuantity('1/2 tsp', 1)).toBe('1/2 tsp')
    })
  })

  describe('integers', () => {
    it('scales whole numbers', () => {
      expect(scaleQuantity('2 eggs', 2)).toBe('4 eggs')
      expect(scaleQuantity('3 cups flour', 3)).toBe('9 cups flour')
    })

    it('scales down to whole number', () => {
      expect(scaleQuantity('4 tbsp', 0.5)).toBe('2 tbsp')
    })
  })

  describe('fractions', () => {
    it('scales simple fractions', () => {
      expect(scaleQuantity('1/2 cup', 2)).toBe('1 cup')
      expect(scaleQuantity('1/4 tsp', 4)).toBe('1 tsp')
    })

    it('doubles 3/4 to 1 1/2', () => {
      expect(scaleQuantity('3/4 cup', 2)).toBe('1 1/2 cup')
    })

    it('halves 1/4 to 1/8', () => {
      expect(scaleQuantity('1/4 cup', 0.5)).toBe('1/8 cup')
    })
  })

  describe('mixed numbers', () => {
    it('scales mixed fractions', () => {
      expect(scaleQuantity('1 1/2 cups', 2)).toBe('3 cups')
      expect(scaleQuantity('2 1/4 cups', 2)).toBe('4 1/2 cups')
    })
  })

  describe('non-numeric strings', () => {
    it('returns unchanged when no leading number', () => {
      expect(scaleQuantity('to taste', 3)).toBe('to taste')
      expect(scaleQuantity('', 2)).toBe('')
      expect(scaleQuantity('pinch of salt', 2)).toBe('pinch of salt')
    })
  })

  describe('decimals', () => {
    it('scales decimal quantities', () => {
      expect(scaleQuantity('1.5 cups', 2)).toBe('3 cups')
      expect(scaleQuantity('0.5 tsp', 3)).toBe('1 1/2 tsp')
    })
  })
})
