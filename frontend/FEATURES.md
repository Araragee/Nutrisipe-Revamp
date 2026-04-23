# Nutrisipe Features Documentation

## Complete Feature List

### 🔐 Authentication & User Management
- [x] User registration with email/username/password
- [x] JWT-based authentication
- [x] Secure password hashing
- [x] Auto-login on registration
- [x] Profile editing (display name, bio, avatar URL)
- [x] User profiles with stats (posts, followers, following)

### 📱 Feed & Posts
- [x] Pinterest-style masonry grid layout
- [x] Infinite scroll pagination
- [x] Post categories (Recipe, Meal Photo, Nutrition Tip, Cooking Technique)
- [x] Category filtering
- [x] Post search by title
- [x] Post creation with image URL
- [x] Post details modal with tabbed interface
- [x] Like/unlike posts with optimistic updates
- [x] Save/unsave posts
- [x] Share posts (Web Share API + clipboard fallback)
- [x] Engagement counts (likes, saves, comments)

### 💬 Comments
- [x] Create comments on posts
- [x] Edit own comments (inline editing)
- [x] Delete own comments
- [x] Comment count per post
- [x] Real-time comment updates
- [x] User avatars in comments
- [x] Relative timestamps (e.g., "5m ago")

### 👥 Social Features
- [x] Follow/unfollow users
- [x] Follow from feed cards (on hover)
- [x] Follow from user profiles
- [x] Follow from search results
- [x] Follower/following counts
- [x] Follower/following lists
- [x] Smart user recommendations
  - Based on shared interests
  - Excludes already followed users
  - Weighted by follower count

### 🔍 Search & Discovery
- [x] User search by username/display name
- [x] Real-time search with debouncing (300ms)
- [x] Search results sorted by popularity
- [x] Post search by title/content
- [x] Category-based filtering
- [x] User suggestions sidebar
- [x] Loading states during search

### 🔔 Notifications
- [x] Real-time notifications for:
  - New likes on posts
  - New comments on posts
  - New followers
- [x] Unread notification count badge
- [x] Notification dropdown menu
- [x] Click to navigate to relevant content
- [x] Mark individual notifications as read
- [x] Mark all notifications as read
- [x] Delete notifications
- [x] 24-hour deduplication (prevents spam)
- [x] Prevents self-notifications

### 🍳 Recipe Features
- [x] Recipe database model with:
  - Ingredients (JSON array)
  - Instructions (step-by-step)
  - Nutrition information
  - Servings count
  - Prep time / Cook time / Total time
  - Difficulty level
- [x] Optional recipe data on posts
- [x] Foundation for cooking mode
- [x] Foundation for meal planning
- [x] Foundation for grocery lists

### 🎨 UI/UX Features
- [x] Dark mode support throughout
- [x] Responsive design (mobile, tablet, desktop)
- [x] Toast notifications
  - Success/error/info states
  - Auto-dismiss (3 seconds)
  - Manual close option
  - Animated transitions
- [x] Loading states
  - Skeleton loaders
  - Spinner component (sm/md/lg)
  - Empty state component
- [x] Error handling
  - Status code-specific messages
  - User-friendly error messages
  - Global error handler
- [x] Smooth animations & transitions
- [x] Hover effects on interactive elements
- [x] Optimistic UI updates

### 🏗️ Technical Features
- [x] Type-safe with TypeScript
- [x] Component-based architecture
- [x] Centralized state management (Pinia)
- [x] RESTful API design
- [x] JWT authentication middleware
- [x] Database migrations with Prisma
- [x] Indexed database queries
- [x] Pagination support
- [x] Error boundaries
- [x] Code splitting
- [x] Environment variable configuration

## Feature Details

### Comments System
**Location**: `src/components/post/CommentSection.vue`, `backend/src/services/commentService.ts`

Features:
- Comment input with character limit
- Post button disabled when empty
- Comments list with latest first
- Edit mode with save/cancel
- Delete with confirmation
- User attribution with avatar
- Formatted timestamps
- Loading states
- Error handling

Implementation:
```typescript
// Create comment
await createComment({ postId, content })

// Update comment
await updateComment(commentId, content)

// Delete comment
await deleteComment(commentId)
```

### Notifications System
**Location**: `src/components/notifications/`, `backend/src/services/notificationService.ts`

Features:
- Bell icon with unread badge
- Dropdown menu
- Notification types: like, comment, follow
- Formatted notification text
- Navigate on click
- Mark as read
- Delete option
- Smart deduplication (24hr window)

Implementation:
```typescript
// Automatic creation on user actions
await createNotification({
  userId: recipientId,
  actorId: currentUserId,
  type: 'like' | 'comment' | 'follow',
  postId: optionalPostId,
  commentId: optionalCommentId
})
```

### User Search
**Location**: `src/components/user/UserSearchModal.vue`, `backend/src/services/userService.ts`

Features:
- Real-time search (300ms debounce)
- Search username and display name
- Case-insensitive
- Results with user info (avatar, bio)
- Follow/unfollow buttons
- Click to view profile
- Empty states
- Loading states

Query:
```sql
WHERE username ILIKE '%query%' OR displayName ILIKE '%query%'
ORDER BY followerCount DESC, username ASC
```

### Recipe Data Structure
**Location**: `backend/prisma/schema.prisma`

Schema:
```prisma
model Recipe {
  id           String   @id @default(uuid())
  postId       String   @unique
  servings     Int?
  prepTime     Int?
  cookTime     Int?
  totalTime    Int?
  difficulty   String?  // easy, medium, hard
  ingredients  Json     // Array of {item, amount, unit}
  instructions Json     // Array of {step, text}
  nutrition    Json?    // {calories, protein, carbs, fat, fiber}
}
```

### Toast Notification System
**Location**: `src/components/ui/Toast.vue`, `src/utils/errorHandler.ts`

Features:
- 3 types: success, error, info
- Color-coded (green, red, blue)
- Icon per type
- Auto-dismiss (3s)
- Manual close
- Slide-in animation
- Dark mode support

Usage:
```typescript
import { showSuccessToast, showErrorToast } from '@/utils/errorHandler'

showSuccessToast('Post created!')
showErrorToast('Failed to save post')
```

## Component API Documentation

### PinCard
**Props**:
- `post: Post` - Post data object

**Features**:
- Hover effects
- Follow button (appears on hover)
- Click to open detail modal
- User avatar and name
- Post title and image
- Category badge

### PostDetailModal
**Props**:
- `postId: string | null` - ID of post to display
- `show: boolean` - Modal visibility

**Emits**:
- `close` - Close modal event

**Features**:
- Two tabs: Details, Comments
- Like/Save/Share actions
- Full post information
- Comment section integration
- Navigation to user profile

### UserAvatar
**Props**:
- `user: UserBasic` - User object
- `size: 'sm' | 'md' | 'lg'` - Avatar size

**Features**:
- Responsive sizes
- Fallback to initials
- Click to view profile (optional)

### LoadingSpinner
**Props**:
- `size: 'sm' | 'md' | 'lg'` - Spinner size
- `color: string` - Border color

**Features**:
- Smooth spin animation
- Configurable size and color
- Centered by default

### EmptyState
**Props**:
- `title: string` - Main heading
- `description: string` - Subtext
- `icon: string` - SVG path data
- `actionLabel: string` - Button text

**Emits**:
- `action` - Button click event

**Features**:
- Centered layout
- Optional icon
- Optional action button
- Consistent styling

## API Response Formats

### Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["validation error"]
  }
}
```

## Database Indexes

Optimized queries with indexes on:
- `users.username`
- `users.email`
- `posts.userId`
- `posts.createdAt`
- `posts.category`
- `comments.postId`
- `comments.userId`
- `comments.createdAt`
- `notifications.userId`
- `notifications.isRead`
- `follows.followerId_followingId` (composite unique)
- `likes.userId_postId` (composite unique)
- `saves.userId_postId` (composite unique)

---

**Total Features**: 80+
**Database Tables**: 9
**API Endpoints**: 25+
**Components**: 40+
**Pinia Stores**: 5
