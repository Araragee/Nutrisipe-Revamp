<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IngredientResource extends JsonResource
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
            'food_item' => $this->food_item,
            'alt_name' => $this->alt_name,
            'edible_portion' => $this->edible_portion,
            'energy' => $this->energy,
            'protein' => $this->protein,
            'fat' => $this->fat,
            'carb' => $this->carb,
            'calcium' => $this->calcium,
            'phos' => $this->phos,
            'iron' => $this->iron,
            'vit_a' => $this->vit_a,
            'thia' => $this->thia,
            'ribo' => $this->ribo,
            'nia' => $this->nia,
            'vit_c' => $this->vit_c,
        ];
    }
}
