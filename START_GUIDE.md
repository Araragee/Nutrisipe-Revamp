# Quick Start Guide - Nutrisipe

## Prerequisites
Make sure you have:
- Node.js installed
- PostgreSQL database running (or Neon cloud database)
- `.env` file configured in `backend/` directory

## Starting the Application

### 1. Start the Backend (Terminal 1)

```bash
cd backend
npm install  # Only needed first time or after package changes
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:3000
📝 Environment: development
🌐 CORS enabled for: http://localhost:5173
```

**Backend runs on:** `http://localhost:3000`

---

### 2. Start the Frontend (Terminal 2)

```bash
# From project root
npm install  # Only needed first time or after package changes
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Frontend runs on:** `http://localhost:5173`

---

## Accessing the Application

1. **Open your browser:** `http://localhost:5173`
2. **Login/Register** to access the platform
3. **Admin Access:** Change your user role in database to `ADMIN` to access admin features

---

## Setting Up Admin User (First Time)

To access admin features at `/admin`, you need to promote your user to ADMIN role:

### Option 1: Using Prisma Studio (Easiest)
```bash
cd backend
npx prisma studio
```
- Opens at `http://localhost:5555`
- Navigate to `User` table
- Find your user
- Change `role` field from `USER` to `ADMIN`
- Save changes

### Option 2: Using PostgreSQL CLI
```bash
# Connect to your database
psql YOUR_DATABASE_URL

# Update your user role (replace with your email)
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Option 3: Using Neon SQL Editor
If you're using Neon:
1. Go to your Neon console
2. Open SQL Editor
3. Run:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

---

## Admin Features Access

Once you have ADMIN role, you can access:
- **Dashboard:** `/admin`
- **User Management:** `/admin/users`
- **Content Moderation:** `/admin/reports`
- **Analytics:** `/admin/analytics`

---

## Troubleshooting

### Backend won't start
- Check `.env` file exists in `backend/` directory
- Verify `DATABASE_URL` is correct
- Run `npx prisma generate` to regenerate Prisma client
- Check if port 3000 is already in use

### Frontend won't start
- Clear cache: `rm -rf node_modules .vite && npm install`
- Check if port 5173 is already in use
- Verify `backend` is running first

### Database connection errors
- Verify database is running
- Check `DATABASE_URL` in `.env`
- Run migrations: `cd backend && npx prisma migrate dev`

### Can't access admin routes
- Verify your user has `ADMIN` role in database
- Clear browser cache and cookies
- Re-login after role change

---

## Environment Variables

### Backend `.env` file:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:5173"
PORT=3000
NODE_ENV="development"
```

---

## Stopping the Application

Press `Ctrl+C` in each terminal window to stop the servers.

---

## Development Tips

1. **Hot Reload:** Both frontend and backend support hot reload
2. **API Testing:** Backend runs at `http://localhost:3000/api`
3. **Health Check:** `http://localhost:3000/health`
4. **Database GUI:** Use Prisma Studio (`npx prisma studio`)
5. **View Logs:** Check terminal output for errors

---

## Phase 7 Features (New!)

- ✅ Admin dashboard with statistics
- ✅ User management (ban/unban, role changes)
- ✅ Content moderation and reporting
- ✅ Analytics dashboard
- ✅ Role-based access control

Enjoy building with Nutrisipe! 🚀
