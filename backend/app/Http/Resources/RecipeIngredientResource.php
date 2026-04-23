<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecipeIngredientResource extends JsonResource
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
            'name' => $this->name,
            'amount' => $this->amount,
            'edible_weight' => $this->edible_weight,
            'is_custom' => $this->is_custom,
            'ingredient' => new IngredientResource($this->whenLoaded('ingredient')),
        ];
    }
}
