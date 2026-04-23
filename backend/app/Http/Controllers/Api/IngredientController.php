<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\IngredientResource;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class IngredientController extends Controller
{
    /**
     * Display a listing of ingredients
     *
     * Supports search by food_item or alt_name
     */
    public function index(Request $request)
    {
        $query = Ingredient::query();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('food_item', 'like', "%{$search}%")
                    ->orWhere('alt_name', 'like', "%{$search}%");
            });
        }

        $query->orderBy('food_item');

        // Return all results or paginate
        if ($request->boolean('all')) {
            $ingredients = $query->get();
            return IngredientResource::collection($ingredients);
        }

        $ingredients = $query->paginate(50);
        return IngredientResource::collection($ingredients);
    }

    /**
     * Store a newly created ingredient (Admin only)
     */
    public function store(Request $request)
    {
        // Check if user is admin
        if (!$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'food_item' => 'required|string|max:255',
            'alt_name' => 'nullable|string|max:255',
            'edible_portion' => 'required|numeric|min:0|max:100',
            'energy' => 'required|numeric|min:0',
            'protein' => 'required|numeric|min:0',
            'fat' => 'required|numeric|min:0',
            'carb' => 'required|numeric|min:0',
            'calcium' => 'required|numeric|min:0',
            'phos' => 'required|numeric|min:0',
            'iron' => 'required|numeric|min:0',
            'vit_a' => 'required|numeric|min:0',
            'thia' => 'required|numeric|min:0',
            'ribo' => 'required|numeric|min:0',
            'nia' => 'required|numeric|min:0',
            'vit_c' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $ingredient = Ingredient::create($request->all());

        return new IngredientResource($ingredient);
    }

    /**
     * Display the specified ingredient
     */
    public function show(string $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        return new IngredientResource($ingredient);
    }

    /**
     * Update the specified ingredient (Admin only)
     */
    public function update(Request $request, string $id)
    {
        // Check if user is admin
        if (!$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $ingredient = Ingredient::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'food_item' => 'sometimes|string|max:255',
            'alt_name' => 'nullable|string|max:255',
            'edible_portion' => 'sometimes|numeric|min:0|max:100',
            'energy' => 'sometimes|numeric|min:0',
            'protein' => 'sometimes|numeric|min:0',
            'fat' => 'sometimes|numeric|min:0',
            'carb' => 'sometimes|numeric|min:0',
            'calcium' => 'sometimes|numeric|min:0',
            'phos' => 'sometimes|numeric|min:0',
            'iron' => 'sometimes|numeric|min:0',
            'vit_a' => 'sometimes|numeric|min:0',
            'thia' => 'sometimes|numeric|min:0',
            'ribo' => 'sometimes|numeric|min:0',
            'nia' => 'sometimes|numeric|min:0',
            'vit_c' => 'sometimes|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $ingredient->update($request->all());

        return new IngredientResource($ingredient);
    }

    /**
     * Remove the specified ingredient (Admin only)
     */
    public function destroy(Request $request, string $id)
    {
        // Check if user is admin
        if (!$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $ingredient = Ingredient::findOrFail($id);
        $ingredient->delete();

        return response()->json(['message' => 'Ingredient deleted successfully'], 200);
    }
}
