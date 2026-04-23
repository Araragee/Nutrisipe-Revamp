<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecipeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'image' => $this->image,
            'procedure' => $this->procedure,
            'is_hidden' => $this->is_hidden,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'user' => new UserResource($this->whenLoaded('user')),
            'ingredients' => RecipeIngredientResource::collection($this->whenLoaded('recipeIngredients')),
            'nutrition' => new NutritionFactResource($this->whenLoaded('nutritionFact')),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),

            // Counts
            'saves_count' => $this->whenCounted('savedBy'),
            'comments_count' => $this->whenCounted('comments'),

            // Check if current user saved this recipe
            'is_saved' => $this->when(
                $request->user(),
                fn() => $this->savedBy->contains($request->user())
            ),
        ];
    }
}
