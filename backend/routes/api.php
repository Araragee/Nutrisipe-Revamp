<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public routes - no authentication required
Route::post('/auth/google', [AuthController::class, 'googleLogin']);

if (app()->environment('local', 'testing')) {
    Route::post('/auth/dev-login', [AuthController::class, 'devLogin']);
}

// Protected routes - require Sanctum authentication
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);

    // Recipe routes
    Route::get('/recipes', [RecipeController::class, 'index']);
    Route::post('/recipes', [RecipeController::class, 'store']);
    Route::get('/recipes/{id}', [RecipeController::class, 'show']);
    Route::put('/recipes/{id}', [RecipeController::class, 'update']);
    Route::delete('/recipes/{id}', [RecipeController::class, 'destroy']);
    Route::post('/recipes/{id}/toggle-hide', [RecipeController::class, 'toggleHide']);
    Route::post('/recipes/{id}/save', [RecipeController::class, 'save']);
    Route::delete('/recipes/{id}/save', [RecipeController::class, 'unsave']);
    Route::get('/recipes/{id}/related', [RecipeController::class, 'related']);

    // User routes
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::get('/users/{id}/recipes', [UserController::class, 'recipes']);
    Route::get('/users/{id}/saved-recipes', [UserController::class, 'savedRecipes']);
    Route::get('/users/{id}/followers', [UserController::class, 'followers']);
    Route::get('/users/{id}/following', [UserController::class, 'following']);
    Route::post('/users/{id}/follow', [UserController::class, 'follow']);
    Route::delete('/users/{id}/follow', [UserController::class, 'unfollow']);
    Route::get('/users/{id}/is-following', [UserController::class, 'isFollowing']);

    // Ingredient routes
    Route::get('/ingredients', [IngredientController::class, 'index']);
    Route::post('/ingredients', [IngredientController::class, 'store']);
    Route::get('/ingredients/{id}', [IngredientController::class, 'show']);
    Route::put('/ingredients/{id}', [IngredientController::class, 'update']);
    Route::delete('/ingredients/{id}', [IngredientController::class, 'destroy']);

    // Comment routes
    Route::get('/recipes/{recipeId}/comments', [CommentController::class, 'index']);
    Route::post('/recipes/{recipeId}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);
});
