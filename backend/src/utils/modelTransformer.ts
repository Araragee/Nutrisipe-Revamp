import { calculateNutriScore } from './nutriScore'

export function transformPost(post: any) {
  if (!post) return post

  if (typeof post.tags === 'string') {
    try {
      post.tags = JSON.parse(post.tags)
    } catch (e) {
      post.tags = []
    }
  }

  if (post.recipe) {
    post.recipe = transformRecipe(post.recipe)
  }

  return post
}

export function transformRecipe(recipe: any) {
  if (!recipe) return recipe

  if (typeof recipe.ingredients === 'string') {
    try {
      recipe.ingredients = JSON.parse(recipe.ingredients)
    } catch (e) {
      recipe.ingredients = []
    }
  }

  if (typeof recipe.instructions === 'string') {
    try {
      recipe.instructions = JSON.parse(recipe.instructions)
    } catch (e) {
      recipe.instructions = []
    }
  }

  if (typeof recipe.nutrition === 'string' && recipe.nutrition) {
    try {
      recipe.nutrition = JSON.parse(recipe.nutrition)
    } catch (e) {
      recipe.nutrition = null
    }
  }

  if (recipe.nutrition) {
    recipe.nutriScore = calculateNutriScore(recipe.nutrition)
  }

  return recipe
}
