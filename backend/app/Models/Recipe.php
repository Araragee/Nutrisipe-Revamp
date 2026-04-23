<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'category',
        'image',
        'procedure',
        'is_hidden',
    ];

    protected function casts(): array
    {
        return [
            'procedure' => 'array',
            'is_hidden' => 'boolean',
        ];
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function recipeIngredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function nutritionFact()
    {
        return $this->hasOne(NutritionFact::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function savedBy()
    {
        return $this->belongsToMany(User::class, 'saves')->withTimestamps();
    }
}
