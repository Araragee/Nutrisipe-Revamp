<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RecipeResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display the specified user profile
     */
    public function show(string $id)
    {
        $user = User::withCount(['followers', 'following', 'recipes'])
            ->findOrFail($id);

        return new UserResource($user);
    }

    /**
     * Get user's created recipes
     */
    public function recipes(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $currentUser = $request->user();

        $query = $user->recipes()
            ->with(['user', 'nutritionFact'])
            ->withCount(['savedBy', 'comments']);

        // If viewing own profile, show all recipes including hidden
        // If viewing others' profile, only show non-hidden recipes
        if (!$currentUser || $currentUser->id !== $user->id) {
            $query->where('is_hidden', false);
        }

        $query->orderBy('created_at', 'desc');

        $recipes = $query->paginate(20);

        return RecipeResource::collection($recipes);
    }

    /**
     * Get user's saved recipes
     */
    public function savedRecipes(string $id)
    {
        $user = User::findOrFail($id);

        $recipes = $user->saves()
            ->with(['user', 'nutritionFact'])
            ->withCount(['savedBy', 'comments'])
            ->where('is_hidden', false)
            ->orderBy('saves.created_at', 'desc')
            ->paginate(20);

        return RecipeResource::collection($recipes);
    }

    /**
     * Get user's followers
     */
    public function followers(string $id)
    {
        $user = User::findOrFail($id);

        $followers = $user->followers()
            ->withCount(['followers', 'following', 'recipes'])
            ->get();

        return UserResource::collection($followers);
    }

    /**
     * Get users that this user is following
     */
    public function following(string $id)
    {
        $user = User::findOrFail($id);

        $following = $user->following()
            ->withCount(['followers', 'following', 'recipes'])
            ->get();

        return UserResource::collection($following);
    }

    /**
     * Follow a user
     */
    public function follow(Request $request, string $id)
    {
        $userToFollow = User::findOrFail($id);
        $currentUser = $request->user();

        // Can't follow yourself
        if ($currentUser->id === $userToFollow->id) {
            return response()->json(['message' => 'Cannot follow yourself'], 400);
        }

        // Check if already following
        if ($currentUser->following()->where('followed_id', $userToFollow->id)->exists()) {
            return response()->json(['message' => 'Already following this user'], 400);
        }

        // Create follow relationship
        $currentUser->following()->attach($userToFollow->id);

        return response()->json([
            'message' => 'Successfully followed user',
            'following' => true
        ]);
    }

    /**
     * Unfollow a user
     */
    public function unfollow(Request $request, string $id)
    {
        $userToUnfollow = User::findOrFail($id);
        $currentUser = $request->user();

        // Remove follow relationship
        $currentUser->following()->detach($userToUnfollow->id);

        return response()->json([
            'message' => 'Successfully unfollowed user',
            'following' => false
        ]);
    }

    /**
     * Check if current user is following another user
     */
    public function isFollowing(Request $request, string $id)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json(['is_following' => false]);
        }

        $isFollowing = $currentUser->following()
            ->where('followed_id', $id)
            ->exists();

        return response()->json(['is_following' => $isFollowing]);
    }
}
