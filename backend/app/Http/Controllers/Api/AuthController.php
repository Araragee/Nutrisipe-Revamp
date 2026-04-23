<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Handle Google OAuth login/register
     *
     * Frontend should send decoded Google JWT token data
     */
    public function googleLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'google_id' => 'required|string',
            'name' => 'required|string',
            'email' => 'required|email',
            'image' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find or create user
        $user = User::updateOrCreate(
            ['google_id' => $request->google_id],
            [
                'name' => $request->name,
                'email' => $request->email,
                'image' => $request->image,
                'is_admin' => false, // New users are not admin by default
            ]
        );

        // Create Sanctum token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * Development login (Local/Testing only)
     */
    public function devLogin(Request $request)
    {
        if (!app()->environment('local', 'testing')) {
            return response()->json(['message' => 'Not available in production'], 404);
        }

        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->firstOrFail();

        // Create Sanctum token
        $token = $user->createToken('dev-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Dev login successful',
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user->loadCount(['followers', 'following', 'recipes']);

        return new UserResource($user);
    }

    /**
     * Logout (revoke token)
     */
    public function logout(Request $request)
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Revoke all tokens for current user
     */
    public function logoutAll(Request $request)
    {
        // Revoke all tokens
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'All sessions logged out successfully']);
    }
}
