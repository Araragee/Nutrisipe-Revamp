export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E'

interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  saturatedFat?: number
  sodium?: number
}

export function calculateNutriScore(nutrition: NutritionData): NutriScore {
  // Simple algorithm inspired by Nutri-Score (but simplified for this app)
  // Negative points (higher is worse): Calories, Sat Fat, Sugar, Sodium
  // Positive points (higher is better): Fiber, Protein
  
  let points = 0
  
  // Energy (kJ) - approx 4.18 * kcal
  const energy = nutrition.calories * 4.18
  if (energy > 3350) points += 10
  else if (energy > 3015) points += 9
  else if (energy > 2680) points += 8
  else if (energy > 2345) points += 7
  else if (energy > 2010) points += 6
  else if (energy > 1675) points += 5
  else if (energy > 1340) points += 4
  else if (energy > 1005) points += 3
  else if (energy > 670) points += 2
  else if (energy > 335) points += 1

  // Sugars (g)
  const sugar = nutrition.sugar || 0
  if (sugar > 45) points += 10
  else if (sugar > 40) points += 9
  else if (sugar > 36) points += 8
  else if (sugar > 31) points += 7
  else if (sugar > 27) points += 6
  else if (sugar > 22.5) points += 5
  else if (sugar > 18) points += 4
  else if (sugar > 13.5) points += 3
  else if (sugar > 9) points += 2
  else if (sugar > 4.5) points += 1

  // Saturated Fat (g)
  const satFat = nutrition.saturatedFat || 0
  if (satFat > 10) points += 10
  else if (satFat > 9) points += 9
  else if (satFat > 8) points += 8
  else if (satFat > 7) points += 7
  else if (satFat > 6) points += 6
  else if (satFat > 5) points += 5
  else if (satFat > 4) points += 4
  else if (satFat > 3) points += 3
  else if (satFat > 2) points += 2
  else if (satFat > 1) points += 1

  // Fiber (g) (Positive)
  const fiber = nutrition.fiber || 0
  let fiberPoints = 0
  if (fiber > 4.7) fiberPoints = 5
  else if (fiber > 3.7) fiberPoints = 4
  else if (fiber > 2.8) fiberPoints = 3
  else if (fiber > 1.9) fiberPoints = 2
  else if (fiber > 0.9) fiberPoints = 1

  // Protein (g) (Positive)
  const protein = nutrition.protein || 0
  let proteinPoints = 0
  if (protein > 8.0) proteinPoints = 5
  else if (protein > 6.4) proteinPoints = 4
  else if (protein > 4.8) proteinPoints = 3
  else if (protein > 3.2) proteinPoints = 2
  else if (protein > 1.6) proteinPoints = 1

  const finalScore = points - (fiberPoints + proteinPoints)

  if (finalScore <= -1) return 'A'
  if (finalScore <= 2) return 'B'
  if (finalScore <= 10) return 'C'
  if (finalScore <= 18) return 'D'
  return 'E'
}
