// Mock dependencies before importing the module under test
jest.mock('../lib/prisma', () => ({
  prisma: { mealPlan: { findMany: jest.fn() } },
}))
jest.mock('../utils/modelTransformer', () => ({
  transformPost: jest.fn((p: any) => p),
}))

import { classify } from './mealPlanService'

describe('classify', () => {
  describe('produce', () => {
    it('classifies common vegetables', () => {
      expect(classify('garlic')).toBe('produce')
      expect(classify('onion')).toBe('produce')
      expect(classify('tomato')).toBe('produce')
      expect(classify('kangkong')).toBe('produce')
      expect(classify('malunggay')).toBe('produce')
    })

    it('is case-insensitive', () => {
      expect(classify('GARLIC')).toBe('produce')
      expect(classify('Tomato')).toBe('produce')
    })

    it('classifies Filipino produce', () => {
      expect(classify('kamatis')).toBe('produce')
      expect(classify('bawang')).toBe('produce')
      expect(classify('sibuyas')).toBe('produce')
    })
  })

  describe('protein', () => {
    it('classifies protein items', () => {
      expect(classify('chicken breast')).toBe('protein')
      expect(classify('pork liempo')).toBe('protein')
      expect(classify('beef kaldereta')).toBe('protein')
      expect(classify('bangus')).toBe('protein')
      expect(classify('egg itlog')).toBe('protein')
      expect(classify('tofu')).toBe('protein')
    })
  })

  describe('dairy', () => {
    it('classifies dairy items', () => {
      expect(classify('fresh milk')).toBe('dairy')
      expect(classify('cheese')).toBe('dairy')
      expect(classify('butter')).toBe('dairy')
      expect(classify('cream')).toBe('dairy')
    })
  })

  describe('grain', () => {
    it('classifies grain items', () => {
      expect(classify('jasmine rice')).toBe('grain')
      expect(classify('bread')).toBe('grain')
      expect(classify('pasta')).toBe('grain')
      expect(classify('flour')).toBe('grain')
    })
  })

  describe('pantry', () => {
    it('classifies pantry items', () => {
      expect(classify('soy sauce')).toBe('pantry')
      expect(classify('patis')).toBe('pantry')
      expect(classify('vinegar')).toBe('pantry')
      expect(classify('sugar')).toBe('pantry')
      expect(classify('salt')).toBe('pantry')
    })
  })

  describe('spice', () => {
    it('classifies spices', () => {
      expect(classify('bay leaf')).toBe('spice')
      expect(classify('paprika')).toBe('spice')
      expect(classify('cumin seeds')).toBe('spice')
      expect(classify('black pepper')).toBe('spice')
      expect(classify('white pepper')).toBe('spice')
      expect(classify('peppercorn')).toBe('spice')
    })
  })

  describe('produce (peppers)', () => {
    it('classifies capsicums as produce, not spice', () => {
      expect(classify('bell pepper')).toBe('produce')
      expect(classify('green pepper')).toBe('produce')
      expect(classify('red pepper')).toBe('produce')
      expect(classify('capsicum')).toBe('produce')
    })
  })

  describe('other', () => {
    it('falls back to other for unknown items', () => {
      expect(classify('xyzzy unknown ingredient')).toBe('other')
      expect(classify('')).toBe('other')
    })
  })
})
