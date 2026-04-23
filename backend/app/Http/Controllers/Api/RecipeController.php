<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RecipeResource;
use App\Models\Recipe;
use App\Services\NutritionCalculationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class RecipeController extends Controller
{
    protected $nutritionService;

    public function __construct(NutritionCalculationService $nutritionService)
    {
        $this->nutritionService = $nutritionService;
    }

    /**
     * Display a listing of recipes
     *
     * Filters: category, following, search, is_hidden
     */
    public function index(Request $request)
    {
        $query = Recipe::with(['user', 'nutritionFact'])
            ->withCount(['savedBy', 'comments']);

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by following (recipes from users that current user follows)
        if ($request->boolean('following') && $request->user()) {
            $followingIds = $request->user()->following()->pluck('users.id');
            $query->whereIn('user_id', $followingIds);
        }

        // Search across multiple fields
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter hidden recipes
        if ($request->user()) {
            // Show own hidden recipes, hide others'
            $query->where(function ($q) use ($request) {
                $q->where('is_hidden', false)
                    ->orWhere('user_id', $request->user()->id);
            });
        } else {
            // Non-authenticated users only see non-hidden
            $query->where('is_hidden', false);
        }

        // Order by newest first
        $query->orderBy('created_at', 'desc');

        $recipes = $query->paginate(20);

        return RecipeResource::collection($recipes);
    }

    /**
     * Store a newly created recipe
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'procedure' => 'required|array|min:1',
            'procedure.*' => 'required|string',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.ingredient_id' => 'nullable|exists:ingredients,id',
            'ingredients.*.name' => 'required|string',
            'ingredients.*.amount' => 'required|numeric|min:0',
            'ingredients.*.is_custom' => 'boolean',
            'yield_amount' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Upload image
            $imagePath = $request->file('image')->store('recipes', 'public');

            // Create recipe
            $recipe = Recipe::create([
                'user_id' => $request->user()->id,
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category,
                'image' => $imagePath,
                'procedure' => $request->procedure,
                'is_hidden' => false,
            ]);

            // Prepare ingredients with edible weights
            $preparedIngredients = $this->nutritionService->prepareIngredientsForStorage($request->ingredients);

            // Store recipe ingredients
            foreach ($preparedIngredients as $ingredientData) {
                $recipe->recipeIngredients()->create($ingredientData);
            }

            // Calculate and store nutrition facts
            $nutritionData = $this->nutritionService->calculateNutrition(
                $request->ingredients,
                $request->yield_amount
            );

            $recipe->nutritionFact()->create($nutritionData);

            DB::commit();

            // Load relationships for response
            $recipe->load(['user', 'recipeIngredients.ingredient', 'nutritionFact']);

            return new RecipeResource($recipe);
        } catch (\Exception $e) {
            DB::rollBack();

            // Delete uploaded image if recipe creation failed
            if (isset($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }

            return response()->json([
                'message' => 'Failed to create recipe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified recipe
     */
    public function show(string $id)
    {
        $recipe = Recipe::with([
            'user',
            'recipeIngredients.ingredient',
            'nutritionFact',
            'comments.user',
            'savedBy'
        ])
            ->withCount(['savedBy', 'comments'])
            ->findOrFail($id);

        // Check if recipe is hidden
        if ($recipe->is_hidden) {
            $user = request()->user();
            if (!$user || $user->id !== $recipe->user_id) {
                return response()->json([
                    'message' => 'Recipe not found or is hidden'
                ], 404);
            }
        }

        return new RecipeResource($recipe);
    }

    /**
     * Update the specified recipe
     */
    public function update(Request $request, string $id)
    {
        $recipe = Recipe::findOrFail($id);

        // Authorization check
        if ($request->user()->id !== $recipe->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category' => 'sometimes|string',
            'image' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:5120',
            'procedure' => 'sometimes|array|min:1',
            'is_hidden' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update image if provided
        if ($request->hasFile('image')) {
            // Delete old image
            Storage::disk('public')->delete($recipe->image);
            $recipe->image = $request->file('image')->store('recipes', 'public');
        }

        $recipe->update($request->only([
            'title',
            'description',
            'category',
            'procedure',
            'is_hidden'
        ]));

        return new RecipeResource($recipe->load(['user', 'nutritionFact']));
    }

    /**
     * Remove the specified recipe
     */
    public function destroy(Request $request, string $id)
    {
        $recipe = Recipe::findOrFail($id);

        // Authorization check (owner or admin)
        if ($request->user()->id !== $recipe->user_id && !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete image
        Storage::disk('public')->delete($recipe->image);

        $recipe->delete();

        return response()->json(['message' => 'Recipe deleted successfully'], 200);
    }

    /**
     * Toggle hide/unhide recipe
     */
    public function toggleHide(string $id)
    {
        $recipe = Recipe::findOrFail($id);

        // Authorization check
        if (request()->user()->id !== $recipe->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $recipe->update(['is_hidden' => !$recipe->is_hidden]);

        return response()->json([
            'message' => 'Recipe visibility updated',
            'is_hidden' => $recipe->is_hidden
        ]);
    }

    /**
     * Save/like a recipe
     */
    public function save(string $id)
    {
        $recipe = Recipe::findOrFail($id);
        $user = request()->user();

        if ($recipe->savedBy()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Recipe already saved'], 400);
        }

        $recipe->savedBy()->attach($user->id);

        return response()->json(['message' => 'Recipe saved successfully']);
    }

    /**
     * Unsave/unlike a recipe
     */
    public function unsave(string $id)
    {
        $recipe = Recipe::findOrFail($id);
        $user = request()->user();

        $recipe->savedBy()->detach($user->id);

        return response()->json(['message' => 'Recipe unsaved successfully']);
    }

    /**
     * Get related recipes (same category)
     */
    public function related(string $id)
    {
        $recipe = Recipe::findOrFail($id);

        $relatedRecipes = Recipe::with(['user', 'nutritionFact'])
            ->where('category', $recipe->category)
            ->where('id', '!=', $recipe->id)
            ->where('is_hidden', false)
            ->withCount(['savedBy', 'comments'])
            ->limit(6)
            ->get();

        return RecipeResource::collection($relatedRecipes);
    }
}
