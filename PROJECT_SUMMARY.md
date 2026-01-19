# Nutrisipe - Social Nutrition & Recipe Platform

## Project Overview

Nutrisipe is a Pinterest-style social platform focused on nutrition, recipes, and healthy eating. Built with Vue 3, TypeScript, Node.js, and PostgreSQL.

## Tech Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Router**: Vue Router
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma
- **Authentication**: JWT

## Project Structure

```
nutrisipe/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── controllers/           # Request handlers
│   │   ├── services/              # Business logic
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Auth & error handling
│   │   ├── config/                # Database config
│   │   └── index.ts               # Server entry point
│   └── package.json
│
└── src/ (frontend)
    ├── components/
    │   ├── base/                  # Reusable UI components
    │   ├── feed/                  # Feed & post grid
    │   ├── post/                  # Post details & creation
    │   ├── user/                  # User profiles & search
    │   ├── notifications/         # Notification system
    │   ├── layout/                # App layout components
    │   └── ui/                    # UI utilities (toast, spinner)
    ├── stores/                    # Pinia state management
    ├── http/                      # API client & endpoints
    ├── typescript/
    │   ├── interface/             # TypeScript interfaces
    │   └── types/                 # Type definitions
    ├── utils/                     # Utility functions
    ├── views/                     # Page components
    └── router/                    # Route definitions
```

## Features Implemented

### Phase 1: Social Features ✅
1. **Comments System**
   - Create, read, update, delete comments
   - Inline editing mode
   - User avatars and timestamps
   - Integrated into post detail modal

2. **User Discovery**
   - Smart recommendation algorithm
   - Based on interests and social graph
   - Skeleton loading states

3. **Follow/Unfollow**
   - From feed cards (on hover)
   - From user profiles
   - Optimistic UI updates

4. **Notifications System**
   - Real-time notifications for likes, comments, follows
   - Unread count badge
   - 24-hour deduplication to prevent spam
   - Mark as read/delete functionality
   - Notification dropdown with navigation

### Phase 2: Enhanced Feed Features ✅
5. **User Search**
   - Real-time search with debouncing
   - Search by username or display name
   - Follow/unfollow from search results
   - Results sorted by follower count

6. **Share Functionality**
   - Native Web Share API support
   - Clipboard fallback
   - Share post title, description, and URL

7. **Feed Filtering**
   - Category-based filtering (already existed)
   - Post search functionality

8. **Saved Posts**
   - Save/unsave posts (already existed)
   - Save count tracking

### Phase 3: Recipe Features ✅
9. **Structured Recipe Data**
   - Database schema for recipes
   - Ingredients (JSON array)
   - Instructions (step-by-step)
   - Nutrition information
   - Prep/cook times, servings, difficulty
   - Optional relation to posts

### Phase 4: Polish & UX ✅
10. **Error Handling**
    - Global error handler utility
    - Status code-specific messages
    - Toast notification system

11. **Loading States**
    - LoadingSpinner component (sm/md/lg sizes)
    - EmptyState component
    - Skeleton loaders in various components

12. **User Feedback**
    - Animated toast notifications
    - Success/error/info states
    - Auto-dismiss with manual close option

## Database Schema

### Core Models
- **User**: Authentication, profile, follower/following counts
- **Post**: Content, category, tags, engagement counts
- **Recipe**: Structured recipe data (ingredients, instructions, nutrition)
- **Comment**: User comments on posts
- **Like**: Post likes
- **Save**: Saved posts
- **Follow**: User relationships
- **Notification**: User notifications

### Key Relations
- User → Posts (one-to-many)
- Post → Recipe (one-to-one, optional)
- Post → Comments, Likes, Saves (one-to-many)
- User → Followers/Following (many-to-many through Follow)
- User → Notifications (one-to-many, dual relations for recipient/actor)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get feed posts (paginated)
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post
- `GET /api/posts/search` - Search posts by title/category

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/suggestions` - Get suggested users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/followers` - Get user followers
- `GET /api/users/:id/following` - Get following list
- `PUT /api/users/profile` - Update profile

### Social
- `POST /api/social/follow/:userId` - Follow user
- `DELETE /api/social/unfollow/:userId` - Unfollow user
- `POST /api/social/like/:postId` - Like post
- `DELETE /api/social/unlike/:postId` - Unlike post
- `POST /api/social/save/:postId` - Save post
- `DELETE /api/social/unsave/:postId` - Unsave post

### Comments
- `GET /api/comments/post/:postId` - Get comments for post
- `POST /api/comments` - Create comment
- `PUT /api/comments/:commentId` - Update comment
- `DELETE /api/comments/:commentId` - Delete comment

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## State Management (Pinia Stores)

### Auth Store (`stores/auth.ts`)
- User authentication state
- Login/logout/register
- Current user management

### Feed Store (`stores/feed.ts`)
- Post feed with infinite scroll
- Pagination state
- Post creation

### Users Store (`stores/users.ts`)
- User profiles
- Follow/unfollow actions
- User suggestions

### Notifications Store (`stores/notifications.ts`)
- Notification list
- Unread count
- Mark as read/delete actions

### UI Store (`stores/ui.ts`)
- Toast notifications
- Modal state
- Sidebar state

## Key Components

### Layout Components
- `LayoutThreeColumn.vue` - Main app layout (sidebar, content, right sidebar)
- `LayoutSidebar.vue` - Left navigation sidebar
- `LayoutRightSidebar.vue` - User suggestions sidebar

### Feed Components
- `PinGrid.vue` - Masonry-style post grid
- `PinCard.vue` - Individual post card with hover effects
- `PinSkeleton.vue` - Loading skeleton

### Post Components
- `PostDetailModal.vue` - Full post details with tabs
- `CreatePostModal.vue` - Post creation form
- `CommentSection.vue` - Comments list and input

### User Components
- `UserAvatar.vue` - User profile picture
- `UserCard.vue` - User profile card
- `UserSearchModal.vue` - User search interface

### Notification Components
- `NotificationBell.vue` - Notification icon with badge
- `NotificationDropdown.vue` - Notification list dropdown

### UI Components
- `Toast.vue` - Toast notification system
- `LoadingSpinner.vue` - Configurable loading spinner
- `EmptyState.vue` - Empty state placeholder

## Development Workflow

### Running the Project

1. **Backend**:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```
Server runs on `http://localhost:3000`

2. **Frontend**:
```bash
npm install
npm run dev
```
App runs on `http://localhost:5173`

### Database Migrations

Create new migration:
```bash
cd backend
npx prisma migrate dev --name migration_name
```

### Environment Variables

Backend `.env`:
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
```

## Features by File

### Backend Files
- `schema.prisma` - Complete database schema with all relations
- `commentService.ts` - Comment CRUD + notification creation
- `notificationService.ts` - Notification management with deduplication
- `userService.ts` - User search, profile, followers
- `socialController.ts` - Like, save, follow actions with notifications

### Frontend Files
- `Toast.vue` - Animated toast with success/error/info states
- `errorHandler.ts` - Centralized error handling utility
- `NotificationBell.vue` - Bell icon with unread badge
- `UserSearchModal.vue` - Real-time user search
- `PostDetailModal.vue` - Tabbed interface with share button
- `CommentSection.vue` - Full-featured comment system

## Design Patterns

### Optimistic Updates
User actions (like, follow, save) update UI immediately, then sync with server

### Error Handling
- Try-catch blocks with rollback on error
- Status code-specific error messages
- User-friendly toast notifications

### Loading States
- Skeleton loaders during data fetch
- Loading spinners for actions
- Empty states when no data

### Component Composition
- Small, focused components
- Reusable UI components
- Clear prop/emit interfaces

## Performance Considerations

### Current Optimizations
- Infinite scroll pagination
- Debounced search queries
- Lazy component loading
- Optimistic UI updates
- Efficient database queries with indexes

### Future Optimizations (Phase 5)
- Image lazy loading
- API response caching
- Bundle size optimization
- PWA support

## Acknowledgments

Built with:
- Vue 3 Team
- Prisma Team
- Tailwind CSS Team
- Neon Database

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Phase 4 Complete
