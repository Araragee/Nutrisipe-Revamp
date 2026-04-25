# Quick Testing Guide - Nutrisipe Review

## 🚀 Current Status
- Backend: ✅ Running on http://localhost:3001
- Frontend: ⏳ Start with `npm run dev`
- Database: ✅ Connected (Neon PostgreSQL)

---

## 📋 Quick Test Plan

### 1. **Start Frontend**
```bash
npm run dev
```
Expected: Opens at `http://localhost:5173`

### 2. **Create Test Users**

#### Regular User (via UI):
1. Go to `http://localhost:5173/login`
2. Click "Sign Up"
3. Register:
   - Username: `testuser`
   - Email: `user@test.com`
   - Password: `Test123!`
   - Display Name: `Test User`

#### Admin User Setup:
1. Register another user: `admin@test.com`
2. Open Prisma Studio: `npx prisma studio` (port 5555)
3. Go to User table
4. Find `admin@test.com`
5. Change `role` from `USER` to `ADMIN`
6. Save and re-login

---

### 3. **Test Core Features**

#### ✅ Authentication
- [ ] Register new user
- [ ] Login works
- [ ] See user in navbar
- [ ] Logout works

#### ✅ Profile
- [ ] View own profile (click avatar)
- [ ] Go to `/settings`
- [ ] Update display name
- [ ] Update bio
- [ ] Upload avatar image
- [ ] Changes persist

#### ✅ Create Recipe/Post
- [ ] Click "Create Post" or "+" button
- [ ] Fill form:
  - Title: "Test Recipe"
  - Description: Use rich text (bold, italic, lists)
  - Upload image
  - Add category
  - Add tags
- [ ] Optional: Add recipe details (ingredients, instructions)
- [ ] Publish post
- [ ] See post in feed

#### ✅ View Feed
- [ ] See list of posts
- [ ] Click on a post to view details
- [ ] Post shows image, title, author
- [ ] Can see like/save/comment counts

#### ✅ Social Features
- [ ] Like a post (heart icon)
- [ ] Unlike a post
- [ ] Save a post (bookmark icon)
- [ ] Comment on post
- [ ] Follow another user
- [ ] Unfollow user

#### ✅ Notifications
- [ ] Like someone's post
- [ ] Comment on their post
- [ ] Check if they receive notifications
- [ ] Click notification bell
- [ ] See notification list

---

### 4. **Test Admin Features** 🆕

#### ✅ Admin Dashboard
**Requirement:** Must be logged in as ADMIN role

1. [ ] Go to `/admin`
2. [ ] Regular users should redirect to home
3. [ ] Admin sees dashboard with:
   - Total users count
   - Active users count
   - Total posts count
   - Pending reports count
4. [ ] Click "Manage Users" → goes to `/admin/users`
5. [ ] Click "Review Reports" → goes to `/admin/reports`
6. [ ] Click "View Analytics" → goes to `/admin/analytics`

#### ✅ User Management (`/admin/users`)
1. [ ] See list of all users
2. [ ] Search for a user by username/email
3. [ ] Filter by role (USER, MODERATOR, ADMIN)
4. [ ] Filter by status (Active, Banned, Inactive)
5. [ ] Change a user's role (dropdown)
6. [ ] Ban a user:
   - Click "Ban"
   - Enter reason: "Test ban"
   - Confirm
   - User status shows "Banned"
7. [ ] Unban user:
   - Click "Unban"
   - User status shows "Active"
8. [ ] Click "View" to see user profile

#### ✅ Content Moderation (`/admin/reports`)

**Setup:** First create a report as regular user
1. As regular user, go to any post
2. Click "Report" button (may need to add this)
3. Select reason: "Spam"
4. Add description: "This is a test report"
5. Submit

**Test as Admin:**
1. [ ] Go to `/admin/reports`
2. [ ] See list of reports
3. [ ] Filter by status (PENDING, REVIEWING, RESOLVED, DISMISSED)
4. [ ] Filter by type (POST, COMMENT, USER)
5. [ ] Click "Start Review" on a pending report
6. [ ] Status changes to "REVIEWING"
7. [ ] Click "Resolve":
   - Add moderator note
   - Confirm
   - Status changes to "RESOLVED"
8. [ ] Test "Delete Post" button:
   - Deletes the reported post
   - Report auto-resolves

#### ✅ Analytics (`/admin/analytics`)
1. [ ] Go to `/admin/analytics`
2. [ ] See user statistics:
   - Total users
   - Active users  
   - Banned users
3. [ ] See content statistics:
   - Total posts
   - Total comments
   - Posts per user average
4. [ ] See moderation stats:
   - Pending reports
5. [ ] Time period selector (prepared for future data)

---

### 5. **Mobile Responsiveness**
1. [ ] Resize browser to mobile (<768px)
2. [ ] See bottom navigation bar
3. [ ] Test navigation on mobile
4. [ ] Forms are usable
5. [ ] Cards stack vertically

---

### 6. **Accessibility**
1. [ ] Press Tab to navigate
2. [ ] See visible focus indicators
3. [ ] Press Enter to activate buttons
4. [ ] Press Escape to close modals
5. [ ] Focus traps in modals

---

## 🐛 Common Issues

### Can't access `/admin`
**Fix:** Make sure your user has `role: 'ADMIN'` in database
1. Open Prisma Studio: `npx prisma studio`
2. User table → Find your user
3. Change role to `ADMIN`
4. Logout and login again

### Backend not running
```bash
cd backend
npm run dev
```

### Frontend not running
```bash
npm run dev
```

### Database connection error
- Check `.env` file in `backend/` folder
- Verify `DATABASE_URL` is correct

### Can't find Prisma Client
```bash
cd backend
npx prisma generate
```

---

## 🎯 Critical Tests (Must Pass)

1. ✅ Can register and login
2. ✅ Can create a post with image
3. ✅ Can view posts in feed
4. ✅ Can like and comment on posts
5. ✅ Can view own profile
6. ✅ Can edit profile in settings
7. ✅ Admin can access `/admin` (regular users cannot)
8. ✅ Admin can view user list
9. ✅ Admin can ban/unban users
10. ✅ Admin can view and resolve reports

---

## 📝 Quick Commands

```bash
# Start backend
cd backend && npm run dev

# Start frontend  
npm run dev

# Open Prisma Studio
cd backend && npx prisma studio

# Check backend health
curl http://localhost:3001/health

# View backend logs
tail -f /tmp/backend.log
```

---

## ✅ Success Checklist

Before moving to next phase, verify:
- [ ] Can register/login as regular user
- [ ] Can create posts with images and rich text
- [ ] Can view feed and post details
- [ ] Can like, save, comment on posts
- [ ] Can follow other users
- [ ] Can edit profile (display name, bio, avatar)
- [ ] Can access admin dashboard (as admin)
- [ ] Can manage users (ban/unban, change roles)
- [ ] Can review and resolve reports
- [ ] Mobile navigation works
- [ ] No console errors
- [ ] All pages load quickly

**If all items checked ✅ → Ready for Phase 8!**
