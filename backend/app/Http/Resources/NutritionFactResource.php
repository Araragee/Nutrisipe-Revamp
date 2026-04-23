<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NutritionFactResource extends JsonResource
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
            'serving_size' => $this->serving_size,
            'yield_amount' => $this->yield_amount,
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
