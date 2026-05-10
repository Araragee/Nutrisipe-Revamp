<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Recipe;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CommentController extends Controller
{
    /**
     * Get all comments for a recipe
     */
    public function index(string $recipeId)
    {
        $recipe = Recipe::findOrFail($recipeId);

        $comments = $recipe->comments()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return CommentResource::collection($comments);
    }

    /**
     * Store a new comment on a recipe
     */
    public function store(Request $request, string $recipeId)
    {
        $recipe = Recipe::findOrFail($recipeId);

        $validator = Validator::make($request->all(), [
            'comment' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $comment = $recipe->comments()->create([
            'user_id' => $request->user()->id,
            'comment' => $request->comment,
        ]);

        $comment->load('user');

        // Trigger notification
        if ($recipe->user_id !== $request->user()->id) {
            Notification::create([
                'user_id' => $recipe->user_id,
                'actor_id' => $request->user()->id,
                'type' => 'comment',
                'post_id' => $recipe->id,
                'comment_id' => $comment->id,
            ]);
        }

        return new CommentResource($comment);
    }

    /**
     * Remove a comment (owner or admin)
     */
    public function destroy(Request $request, string $id)
    {
        $comment = Comment::findOrFail($id);

        // Authorization check: owner or admin
        if ($request->user()->id !== $comment->user_id && !$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully'], 200);
    }
}
