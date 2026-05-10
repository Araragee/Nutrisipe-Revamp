<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->query('limit', 20);
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->with(['actor:id,displayName,image as avatarUrl', 'post:id,title,image as imageUrl'])
            ->orderBy('created_at', 'desc')
            ->paginate($limit);

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        // Map the image field to avatarUrl/imageUrl for the frontend if needed
        // (The 'as' in with() doesn't work for relationships like that in Eloquent usually, 
        // but we can map the collection)
        
        $items = collect($notifications->items())->map(function ($n) {
            if ($n->actor) {
                $n->actor->avatarUrl = $n->actor->avatarUrl ?: $n->actor->image;
            }
            if ($n->post) {
                $n->post->imageUrl = $n->post->imageUrl ?: $n->post->image;
            }
            return $n;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $items,
                'unreadCount' => $unreadCount,
                'pagination' => [
                    'page' => $notifications->currentPage(),
                    'limit' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'totalPages' => $notifications->lastPage(),
                ]
            ]
        ]);
    }

    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        $notification = Notification::where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        $notification->delete();

        return response()->json(['success' => true]);
    }
}
