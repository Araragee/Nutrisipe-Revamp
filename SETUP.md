# Nutrisipe - Pinterest-style Recipe Sharing Platform

## Project Overview

A full-stack Pinterest-style social platform for sharing recipes, meal photos, and nutrition tips with a modern three-column layout.

### Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL database
- Prisma ORM
- JWT authentication
- bcryptjs for password hashing

**Frontend:**
- Vue 3 + TypeScript
- Vite build tool
- Tailwind CSS
- Pinia state management
- Vue Router
- Axios for HTTP requests

---

## Setup Instructions

### Prerequisites

1. **Node.js** (v18+ recommended)
2. **PostgreSQL** database (via Docker, cloud service, or local install)
3. **npm** or **yarn**

### 1. Database Setup

#### Option A: Using Docker (Recommended)

If Docker is installed:
```bash
docker compose up -d
```

This will start PostgreSQL on `localhost:5432` with:
- Database: `nutrisipe`
- Username: `nutrisipe`
- Password: `nutrisipe`

#### Option B: Cloud Database

Use a cloud PostgreSQL service like:
- [Neon](https://neon.tech) - Free tier available
- [Supabase](https://supabase.com) - Free tier available
- [Railway](https://railway.app) - Free trial

Update `backend/.env` with your connection string:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Run Prisma migrations to create database tables
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database with mock data (50 users, 250 posts)
npx prisma db seed

# Start development server
npm run dev
```

Backend will run on **http://localhost:3000**

#### Verify Backend

Visit http://localhost:3000/health - should return:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

### 3. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Frontend will run on **http://localhost:5173**

---

## Using the Application

### 1. Login

Navigate to http://localhost:5173/login

**Demo Accounts** (all have password `password123`):
- `emmasmith0@nutrisipe.com`
- `liamjohnson0@nutrisipe.com`
- `oliviawilliams0@nutrisipe.com`

Or use the quick "Demo 1", "Demo 2", "Demo 3" buttons

### 2. Explore the Feed

- **Home Feed**: Displays posts from users you follow (70%) + popular posts (30%)
- **Infinite Scroll**: Scroll down to load more posts
- **Like Posts**: Click the heart icon
- **Save Posts**: Hover over image, click bookmark icon

### 3. Follow Users

- **Right Sidebar**: Shows suggested users based on your interests
- **User Profiles**: Click on user avatars/names to view their profiles
- **Follow/Unfollow**: Use the follow button

### 4. View Profiles

- Click on any user's name or avatar
- View their posts, follower/following counts
- Follow/unfollow from profile

---

## Project Structure

### Backend (`/backend`)

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Mock data generator
├── src/
│   ├── config/
│   │   ├── database.ts    # Prisma client
│   │   └── env.ts         # Environment variables
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, error handling
│   ├── utils/             # JWT, hashing
│   └── index.ts           # Express server
└── package.json
```

### Frontend (`/src`)

```
src/
├── components/
│   ├── base/              # BaseButton, BaseLoader
│   ├── layout/            # 3-column layout components
│   ├── feed/              # PinCard, PinGrid, PinSkeleton
│   └── user/              # UserAvatar, UserCard, FollowButton
├── views/
│   ├── HomeView.vue       # Feed page
│   ├── LoginView.vue      # Login page
│   └── ProfileView.vue    # User profile page
├── stores/                # Pinia state management
│   ├── auth.ts            # Authentication
│   ├── feed.ts            # Home feed
│   ├── users.ts           # User data & suggestions
│   └── ui.ts              # UI state (modals, toasts)
├── composables/           # Reusable logic
│   ├── useInfiniteScroll.ts
│   └── useOptimisticUpdate.ts
├── http/                  # API client
│   ├── client.ts          # Axios instance
│   └── endpoints/         # API endpoints
├── typescript/
│   ├── interface/         # TypeScript interfaces
│   └── types/             # Enums
├── utils/                 # Helper functions
└── router/                # Vue Router
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user (protected)

### Posts
- `GET /api/posts/feed?page=1&limit=20` - Get paginated feed (protected)
- `GET /api/posts/:id` - Get single post
- `GET /api/posts/user/:userId` - Get user's posts

### Users
- `GET /api/users/suggestions?limit=15` - Get suggested users (protected)
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following
- `GET /api/users/:id/activity` - Get recent activity

### Social
- `POST /api/social/follow/:userId` - Follow user (protected)
- `DELETE /api/social/follow/:userId` - Unfollow user (protected)
- `POST /api/social/like/:postId` - Like post (protected)
- `DELETE /api/social/like/:postId` - Unlike post (protected)
- `POST /api/social/save/:postId` - Save post (protected)
- `DELETE /api/social/save/:postId` - Unsave post (protected)

---

## Features Implemented

### ✅ Backend
- Full REST API with JWT authentication
- PostgreSQL database with Prisma ORM
- Feed algorithm (70% followed, 30% popular)
- User recommendation system
- Optimistic count updates (likes, saves, follows)
- Error handling and validation
- CORS configuration

### ✅ Frontend
- Pinterest-style masonry grid layout
- Three-column layout (nav sidebar, feed, suggestions sidebar)
- Infinite scroll
- Optimistic UI updates
- Dark mode support (via Tailwind)
- Responsive design
- Type-safe API client
- Authentication with JWT
- User profiles
- Follow/unfollow functionality
- Like/save posts

### ✅ Mock Data
- 50 realistic users with avatars
- 250 posts across 4 categories
- Random follows (5-15 per user)
- Random engagement (likes, saves)
- Realistic timestamps (1-90 days ago)

---

## Database Schema

### Users
- id, username, email, passwordHash
- displayName, avatarUrl, bio
- followerCount, followingCount (denormalized)

### Posts
- id, userId, title, description, imageUrl
- category, tags, likeCount, saveCount (denormalized)
- isPublic, createdAt, updatedAt

### Follows
- follower → following relationship
- Unique constraint on (followerId, followingId)

### Likes
- user → post relationship
- Unique constraint on (userId, postId)

### Saves
- user → post bookmark relationship
- Unique constraint on (userId, postId)

---

## Development Commands

### Backend
```bash
cd backend

# Development
npm run dev              # Start dev server with hot reload

# Database
npx prisma studio        # View database in browser
npx prisma migrate dev   # Run migrations
npx prisma db seed       # Reseed database
npx prisma generate      # Regenerate Prisma client

# Production
npm run build            # Compile TypeScript
npm start                # Run compiled code
```

### Frontend
```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running
- Check `backend/.env` has correct `DATABASE_URL`
- If using Docker: `docker compose up -d`

### Backend Won't Start
- Install dependencies: `cd backend && npm install`
- Check Node.js version (v18+ recommended)
- Check port 3000 is not in use

### Frontend Can't Connect to Backend
- Ensure backend is running on port 3000
- Check `.env.local` has correct `VITE_API_URL`
- Clear browser cache and reload

### No Posts Showing
- Ensure database is seeded: `cd backend && npx prisma db seed`
- Check browser console for errors
- Verify you're logged in

### Authentication Errors
- Clear localStorage: Open browser DevTools → Application → Local Storage → Clear
- Try demo login buttons
- Check backend logs for errors

---

## Next Steps (Future Enhancements)

### Short Term
- Add toast notification component for better UX
- Add post detail modal
- Add image upload functionality
- Add create post feature
- Add search functionality

### Medium Term
- Add comments system
- Add notifications
- Add real-time updates (WebSockets)
- Add collections/boards
- Add email verification

### Long Term
- Add messaging system
- Add analytics dashboard
- Add reporting/moderation
- Add mobile app
- Add content recommendations ML

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://nutrisipe:nutrisipe@localhost:5432/nutrisipe?schema=public"
JWT_SECRET="dev-secret-key-not-for-production-use-only"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (`.env.local`)
```env
VITE_API_URL=http://localhost:3000/api
```

---

## License

MIT

---

## Support

For issues or questions:
1. Check this documentation
2. Review console logs (browser + backend)
3. Check database with `npx prisma studio`
4. Verify all services are running

Happy coding! 🎉
