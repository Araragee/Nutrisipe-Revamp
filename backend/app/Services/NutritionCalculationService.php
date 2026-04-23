<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\RecipeIngredient;

class NutritionCalculationService
{
    /**
     * Calculate nutrition facts for a recipe based on its ingredients
     *
     * @param array $ingredients Array of ingredients with amount
     * @param string $yieldAmount Number of servings
     * @return array Calculated nutrition facts
     */
    public function calculateNutrition(array $ingredients, string $yieldAmount): array
    {
        $totalNutrition = $this->initializeNutritionArray();
        $totalEdibleWeight = 0;

        foreach ($ingredients as $ingredientData) {
            $ingredientId = $ingredientData['ingredient_id'] ?? null;
            $amount = (float) $ingredientData['amount']; // Amount in grams (as purchased)
            $isCustom = $ingredientData['is_custom'] ?? false;

            // Skip custom ingredients (no nutrition data)
            if ($isCustom || !$ingredientId) {
                continue;
            }

            // Get ingredient from database
            $ingredient = Ingredient::find($ingredientId);
            if (!$ingredient) {
                continue;
            }

            // Calculate edible weight
            $edibleWeight = $this->calculateEdibleWeight($amount, $ingredient->edible_portion);
            $totalEdibleWeight += $edibleWeight;

            // Calculate nutrition for this ingredient
            $ingredientNutrition = $this->calculateIngredientNutrition($ingredient, $edibleWeight);

            // Add to totals
            foreach ($ingredientNutrition as $nutrient => $value) {
                $totalNutrition[$nutrient] += $value;
            }
        }

        // Calculate per-serving values
        $yield = (int) $yieldAmount;
        if ($yield > 0) {
            foreach ($totalNutrition as $nutrient => $value) {
                $totalNutrition[$nutrient] = round($value / $yield, 2);
            }
        }

        // Add serving size (total edible weight divided by yield)
        $totalNutrition['serving_size'] = $yield > 0 ? round($totalEdibleWeight / $yield, 2) : 0;
        $totalNutrition['yield_amount'] = $yieldAmount;

        return $totalNutrition;
    }

    /**
     * Calculate edible weight from purchased weight and edible portion percentage
     *
     * Formula: edibleWeight = purchasedWeight * (ediblePortion / 100)
     *
     * @param float $purchasedWeight Weight in grams as purchased
     * @param float $ediblePortion Percentage of edible portion
     * @return float Edible weight in grams
     */
    private function calculateEdibleWeight(float $purchasedWeight, float $ediblePortion): float
    {
        return $purchasedWeight * ($ediblePortion / 100);
    }

    /**
     * Calculate nutrition values for a single ingredient
     *
     * Formula: nutrientValue = (nutrientPer100g * 0.01) * edibleWeight
     *
     * @param Ingredient $ingredient The ingredient with nutrition data per 100g
     * @param float $edibleWeight Edible weight in grams
     * @return array Nutrition values for this ingredient
     */
    private function calculateIngredientNutrition(Ingredient $ingredient, float $edibleWeight): array
    {
        $multiplier = $edibleWeight * 0.01; // Convert per-100g to actual weight

        return [
            'energy' => $ingredient->energy * $multiplier,
            'protein' => $ingredient->protein * $multiplier,
            'fat' => $ingredient->fat * $multiplier,
            'carb' => $ingredient->carb * $multiplier,
            'calcium' => $ingredient->calcium * $multiplier,
            'phos' => $ingredient->phos * $multiplier,
            'iron' => $ingredient->iron * $multiplier,
            'vit_a' => $ingredient->vit_a * $multiplier,
            'thia' => $ingredient->thia * $multiplier,
            'ribo' => $ingredient->ribo * $multiplier,
            'nia' => $ingredient->nia * $multiplier,
            'vit_c' => $ingredient->vit_c * $multiplier,
        ];
    }

    /**
     * Initialize nutrition array with zero values
     *
     * @return array
     */
    private function initializeNutritionArray(): array
    {
        return [
            'energy' => 0,
            'protein' => 0,
            'fat' => 0,
            'carb' => 0,
            'calcium' => 0,
            'phos' => 0,
            'iron' => 0,
            'vit_a' => 0,
            'thia' => 0,
            'ribo' => 0,
            'nia' => 0,
            'vit_c' => 0,
        ];
    }

    /**
     * Calculate and store edible weight for recipe ingredients
     *
     * @param array $ingredientsData Array of ingredient data
     * @return array Ingredients with calculated edible weights
     */
    public function prepareIngredientsForStorage(array $ingredientsData): array
    {
        $prepared = [];

        foreach ($ingredientsData as $ingredientData) {
            $ingredientId = $ingredientData['ingredient_id'] ?? null;
            $amount = (float) $ingredientData['amount'];
            $isCustom = $ingredientData['is_custom'] ?? false;

            $edibleWeight = 0;

            // Calculate edible weight for database ingredients only
            if (!$isCustom && $ingredientId) {
                $ingredient = Ingredient::find($ingredientId);
                if ($ingredient) {
                    $edibleWeight = $this->calculateEdibleWeight($amount, $ingredient->edible_portion);
                }
            }

            $prepared[] = [
                'ingredient_id' => $ingredientId,
                'name' => $ingredientData['name'],
                'amount' => $amount,
                'edible_weight' => round($edibleWeight, 2),
                'is_custom' => $isCustom,
            ];
        }

        return $prepared;
    }
}
