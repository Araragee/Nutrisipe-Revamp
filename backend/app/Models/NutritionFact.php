<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NutritionFact extends Model
{
    protected $fillable = [
        'recipe_id',
        'serving_size',
        'yield_amount',
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
    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }
}
