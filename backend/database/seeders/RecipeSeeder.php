<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Ingredient;
use App\Models\NutritionFact;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class RecipeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $json = File::get(database_path('seeders/seed_data.json'));
        $data = json_decode($json, true);

        Model::unguard();

        DB::transaction(function () use ($data) {
            // Seed Users
            foreach ($data['users'] as $userData) {
                User::updateOrCreate(
                    ['id' => $userData['id']],
                    [
                        'name' => $userData['name'],
                        'email' => $userData['email'],
                        'password' => Hash::make($userData['password']),
                        'image' => $userData['image'],
                        'is_admin' => $userData['is_admin'],
                        'google_id' => $userData['google_id'],
                    ]
                );
            }

            // Seed Ingredients
            foreach ($data['ingredients'] as $ingredientData) {
                Ingredient::updateOrCreate(
                    ['id' => $ingredientData['id']],
                    $ingredientData
                );
            }

            // Seed Recipes
            foreach ($data['recipes'] as $recipeData) {
                Recipe::updateOrCreate(
                    ['id' => $recipeData['id']],
                    $recipeData
                );
            }

            // Seed Recipe Ingredients
            foreach ($data['recipe_ingredients'] as $riData) {
                RecipeIngredient::updateOrCreate(
                    ['id' => $riData['id']],
                    $riData
                );
            }

            // Seed Nutrition Facts
            foreach ($data['nutrition_facts'] as $nfData) {
                NutritionFact::updateOrCreate(
                    ['recipe_id' => $nfData['recipe_id']],
                    $nfData
                );
            }

            // Seed Comments
            foreach ($data['comments'] as $commentData) {
                Comment::updateOrCreate(
                    ['id' => $commentData['id']],
                    $commentData
                );
            }

            // Seed Saves
            foreach ($data['saves'] as $saveData) {
                DB::table('saves')->updateOrInsert(
                    ['user_id' => $saveData['user_id'], 'recipe_id' => $saveData['recipe_id']],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }

            // Seed Follows
            foreach ($data['follows'] as $followData) {
                DB::table('follows')->updateOrInsert(
                    ['follower_id' => $followData['follower_id'], 'followed_id' => $followData['followed_id']],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        });

        Model::reguard();
    }
}
