import { computed, type Ref } from 'vue'
import type { Ingredient } from '@/typescript/interface/Ingredient'

export interface NutritionRow {
  ingredient: Ingredient | null
  amount: number | string
  isCustom?: boolean
}

export interface NutritionTotals {
  ediblePortionWeight: number
  energy: number
  protein: number
  fat: number
  carb: number
  calcium: number
  phos: number
  iron: number
  vit_a: number
  thia: number
  ribo: number
  nia: number
  vit_c: number
}

const ZERO: NutritionTotals = {
  ediblePortionWeight: 0,
  energy: 0,
  protein: 0,
  fat: 0,
  carb: 0,
  calcium: 0,
  phos: 0,
  iron: 0,
  vit_a: 0,
  thia: 0,
  ribo: 0,
  nia: 0,
  vit_c: 0,
}

const NUTRIENT_KEYS = [
  'energy', 'protein', 'fat', 'carb',
  'calcium', 'phos', 'iron', 'vit_a',
  'thia', 'ribo', 'nia', 'vit_c',
] as const

export function calcRow(ingredient: Ingredient, amountGrams: number): NutritionTotals {
  const edibleWeight = amountGrams * (ingredient.edible_portion / 100)
  const m = edibleWeight * 0.01
  return {
    ediblePortionWeight: edibleWeight,
    energy: ingredient.energy * m,
    protein: ingredient.protein * m,
    fat: ingredient.fat * m,
    carb: ingredient.carb * m,
    calcium: ingredient.calcium * m,
    phos: ingredient.phos * m,
    iron: ingredient.iron * m,
    vit_a: ingredient.vit_a * m,
    thia: ingredient.thia * m,
    ribo: ingredient.ribo * m,
    nia: ingredient.nia * m,
    vit_c: ingredient.vit_c * m,
  }
}

export function useNutritionCalc(
  rows: Ref<NutritionRow[]>,
  yieldAmount: Ref<number | string>,
) {
  const totals = computed<NutritionTotals>(() => {
    const sum: NutritionTotals = { ...ZERO }
    for (const row of rows.value) {
      if (row.isCustom || !row.ingredient) continue
      const grams = Number(row.amount)
      if (!grams || grams <= 0) continue
      const r = calcRow(row.ingredient, grams)
      sum.ediblePortionWeight += r.ediblePortionWeight
      for (const k of NUTRIENT_KEYS) sum[k] += r[k]
    }
    return sum
  })

  const perServing = computed<NutritionTotals>(() => {
    const y = Number(yieldAmount.value)
    if (!y || y <= 0) return totals.value
    const t = totals.value
    return {
      ediblePortionWeight: t.ediblePortionWeight / y,
      energy: t.energy / y,
      protein: t.protein / y,
      fat: t.fat / y,
      carb: t.carb / y,
      calcium: t.calcium / y,
      phos: t.phos / y,
      iron: t.iron / y,
      vit_a: t.vit_a / y,
      thia: t.thia / y,
      ribo: t.ribo / y,
      nia: t.nia / y,
      vit_c: t.vit_c / y,
    }
  })

  const hasData = computed(() =>
    rows.value.some(r => !r.isCustom && r.ingredient && Number(r.amount) > 0),
  )

  return { totals, perServing, hasData }
}
