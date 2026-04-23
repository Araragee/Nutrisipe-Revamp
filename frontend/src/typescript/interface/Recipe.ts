export interface RecipeIngredient {
  item: string
  amount: string
  unit?: string
}

export interface RecipeInstruction {
  step: number
  text: string
}

export interface RecipeNutrition {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  [key: string]: number | undefined
}

export interface Recipe {
  id: string
  postId: string
  servings?: number
  prepTime?: number
  cookTime?: number
  totalTime?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  ingredients: RecipeIngredient[]
  instructions: RecipeInstruction[]
  nutrition?: RecipeNutrition
  createdAt: string
  updatedAt: string
}
