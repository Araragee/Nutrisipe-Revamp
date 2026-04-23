export interface User {
  id: number
  name: string
  email: string
  google_id: string
  image: string | null
  is_admin: boolean
  created_at: string
  followers_count?: number
  following_count?: number
  recipes_count?: number
}

export interface NutritionFact {
  id: number
  serving_size: number
  yield_amount: string
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

export interface Ingredient {
  id: number
  food_item: string
  alt_name: string | null
  edible_portion: number
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

export interface RecipeIngredient {
  id: number
  ingredient_id: number | null
  name: string
  amount: number
  edible_weight: number
  is_custom: boolean
  ingredient?: Ingredient
}

export interface Comment {
  id: number
  comment: string
  created_at: string
  user: User
}

export interface Recipe {
  id: number
  user_id: number
  title: string
  description: string
  category: string
  image: string
  procedure: string[]
  is_hidden: boolean
  created_at: string
  updated_at: string
  user: User
  nutrition_fact: NutritionFact
  recipe_ingredients?: RecipeIngredient[]
  comments?: Comment[]
  saved_by?: User[]
  saved_by_count: number
  comments_count: number
  is_saved?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    path: string
    per_page: number
    to: number | null
    total: number
  }
}

export interface ApiResponse<T> {
  data: T
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

export interface ErrorResponse {
  message: string
  errors?: Record<string, string[]>
}

export type RecipeCategory =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snack'
  | 'Dessert'
  | 'Beverage'

export interface RecipeFormData {
  title: string
  description: string
  category: RecipeCategory
  image: File | null
  procedure: string[]
  ingredients: RecipeIngredientInput[]
  yield_amount: string
}

export interface RecipeIngredientInput {
  ingredient_id: number | null
  name: string
  amount: number
  is_custom: boolean
}
