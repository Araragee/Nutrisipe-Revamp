<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    protected $fillable = [
        'food_item',
        'alt_name',
        'edible_portion',
        'energy',
        'protein',
        'fat',
        'carb',
        'calcium',
        'phos',
        'iron',
        'vit_a',
        'thia',
        'ribo',
        'nia',
        'vit_c',
    ];

    // Relationships
    public function recipeIngredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }
}
