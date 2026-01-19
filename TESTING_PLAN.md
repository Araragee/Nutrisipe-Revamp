# Nutrisipe - Comprehensive Testing Plan

## 🎯 Testing Objectives

Before proceeding to Phase 9, we need to:
1. ✅ Verify all backend APIs are working
2. ✅ Test frontend functionality
3. 🔧 Fix any errors or bugs
4. 🎨 Fix modal overflow and z-index issues
5. ✅ Ensure smooth user experience

---

## 🚀 Step 1: Backend Health Check

### Check Backend is Running
```bash
# Should return: { "status": "ok", "timestamp": "..." }
curl http://localhost:3000/health
```

### Verify All Routes Registered
The backend should have these routes:
- ✅ /api/auth
- ✅ /api/posts
- ✅ /api/users
- ✅ /api/social
- ✅ /api/comments
- ✅ /api/notifications
- ✅ /api/admin
- ✅ /api/reports
- ✅ /api/search
- ✅ /api/collections

---

## 🧪 Step 2: API Testing

### Authentication APIs
```bash
# Test registration (already tested - works ✅)
# Test login (already tested - works ✅)
# User: user@test.com / Test123!
# Admin: admin@test.com / Admin123!
```

### Search APIs
```bash
# Get auth token first
TOKEN="<your-token-here>"

# Test search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search?q=pasta&type=all"

# Test trending
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search/trending?period=7days"

# Test categories
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/search/categories"
```

### Collections APIs
```bash
# Test create collection
curl -X POST http://localhost:3000/api/collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Favorite Recipes", "description": "Best recipes", "isPublic": true}'

# Test get my collections
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/collections/my-collections"
```

### Admin APIs
```bash
# Get admin token
ADMIN_TOKEN="<admin-token-here>"

# Test admin stats (already tested - works ✅)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/stats"
```

---

## 🖥️ Step 3: Frontend Testing

### Start Frontend
```bash
npm run dev
# Opens at http://localhost:5173
```

### Critical Tests:

#### 1. Authentication Flow
- [ ] Navigate to http://localhost:5173
- [ ] Should redirect to /login if not logged in
- [ ] Login with user@test.com / Test123!
- [ ] Should redirect to home/feed
- [ ] Should see user avatar in navbar
- [ ] Logout button works

#### 2. Feed/Home Page
- [ ] Posts load correctly
- [ ] Post images display
- [ ] Post cards have proper spacing
- [ ] Like button works
- [ ] Save button works
- [ ] Comment count shows
- [ ] Can click post to view details

#### 3. Create Post Modal
- [ ] Click "Create Post" or "+" button
- [ ] **CHECK: Modal appears correctly**
- [ ] **CHECK: Modal content doesn't overflow**
- [ ] **CHECK: Modal has proper z-index (should be on top)**
- [ ] Can type in title
- [ ] Rich text editor works (bold, italic, lists)
- [ ] Image upload works (drag & drop)
- [ ] Category selection works
- [ ] Can add tags
- [ ] "Create Post" button submits
- [ ] Modal closes after creation

#### 4. Profile Page
- [ ] Click on user avatar
- [ ] Profile page loads
- [ ] Shows user info (avatar, name, bio)
- [ ] Shows user's posts
- [ ] Can edit own profile (Edit button visible)

#### 5. Settings Page
- [ ] Go to /settings
- [ ] Can update display name
- [ ] Can update bio
- [ ] Avatar upload modal works
- [ ] **CHECK: Image upload modal z-index**
- [ ] Save button works
- [ ] Success toast shows

#### 6. Explore Page
- [ ] Go to /explore
- [ ] Search bar visible
- [ ] Can type search query
- [ ] Results appear after typing
- [ ] Categories grid shows
- [ ] Trending section loads
- [ ] Time period selector works

#### 7. Admin Dashboard (Admin Only)
- [ ] Logout and login as admin@test.com
- [ ] Go to /admin
- [ ] Dashboard loads with stats
- [ ] Stats cards show numbers
- [ ] Links to user management work
- [ ] Links to reports work

#### 8. User Management
- [ ] Go to /admin/users
- [ ] User list loads
- [ ] Search works
- [ ] Filter by role works
- [ ] Can change user role (dropdown)
- [ ] Ban modal appears
- [ ] **CHECK: Ban modal z-index**
- [ ] Can ban user with reason
- [ ] Can unban user

#### 9. Mobile Responsive
- [ ] Resize browser to mobile (<768px)
- [ ] Bottom navigation appears
- [ ] Desktop sidebar hides
- [ ] All buttons touchable
- [ ] Modals fit screen
- [ ] **CHECK: Mobile modal overflow**

---

## 🐛 Step 4: Known Issues to Fix

### Issue 1: Modal Overflow
**Problem:** Modals may overflow with content

**Files to Check:**
- CreatePostModal.vue
- ImageUpload component usage
- Ban user modal in AdminUsersView.vue
- Report modal

**Fix Needed:**
```css
/* Add to modal containers */
.modal-container {
  max-height: 90vh;
  overflow-y: auto;
}

/* Add to modal content */
.modal-content {
  max-height: calc(90vh - 8rem);
  overflow-y: auto;
}
```

### Issue 2: Z-Index Hierarchy
**Problem:** Modal z-index may conflict

**Current Z-Index Values to Verify:**
- Navbar: z-40
- Mobile nav: z-40
- Modals: should be z-50
- Dropdowns: z-30
- Tooltips: z-20

**Fix Needed:**
```css
/* Ensure consistent z-index */
.modal-backdrop { z-index: 50; }
.modal-content { z-index: 51; }
.navbar { z-index: 40; }
.mobile-nav { z-index: 40; }
.dropdown { z-index: 30; }
```

### Issue 3: Modal Body Scroll
**Problem:** When modal is open, body might still scroll

**Fix Needed:**
```typescript
// Add when modal opens
document.body.style.overflow = 'hidden'

// Remove when modal closes
document.body.style.overflow = ''
```

---

## 🔧 Step 5: Common Fixes

### Frontend Not Starting?
```bash
# Clear cache and reinstall
rm -rf node_modules .vite
npm install
npm run dev
```

### Backend Errors?
```bash
cd backend
# Regenerate Prisma client
npx prisma generate
# Restart backend
npm run dev
```

### Database Issues?
```bash
cd backend
# Check migrations
npx prisma migrate status
# Run pending migrations
npx prisma migrate dev
```

### API 404 Errors?
- Check backend is running on port 3000
- Verify route is registered in backend/src/index.ts
- Check API endpoint spelling in frontend

---

## ✅ Step 6: Success Criteria

Before moving to Phase 9, verify:

### Backend
- [ ] All 10+ route files loaded
- [ ] All API endpoints responding
- [ ] Database migrations applied
- [ ] No console errors
- [ ] Health check passes

### Frontend
- [ ] All pages load without errors
- [ ] No console errors in browser
- [ ] All modals display correctly
- [ ] No overflow issues
- [ ] Z-index hierarchy correct
- [ ] Mobile responsive works
- [ ] All CRUD operations work
- [ ] Images load properly
- [ ] Forms submit successfully

### User Experience
- [ ] Can register/login
- [ ] Can create posts
- [ ] Can like/save/comment
- [ ] Can search
- [ ] Can browse categories
- [ ] Admin can access admin panel
- [ ] Admin can manage users
- [ ] Modals close properly
- [ ] Navigation smooth
- [ ] No layout breaks

---

## 📝 Testing Checklist

### Phase 6 Features
- [ ] Settings page works
- [ ] Profile editing works
- [ ] Image upload works
- [ ] Rich text editor works
- [ ] Mobile nav appears
- [ ] Accessibility (tab navigation)

### Phase 7 Features
- [ ] Admin dashboard loads
- [ ] User list loads
- [ ] Can ban/unban users
- [ ] Can change roles
- [ ] Reports page works
- [ ] Analytics page works

### Phase 8 Features
- [ ] Search works (posts & users)
- [ ] Trending loads
- [ ] Categories display
- [ ] Collections CRUD works
- [ ] Saved posts page loads
- [ ] Explore page works

---

## 🚨 Report Issues

When you find issues, note:
1. **What page/feature**
2. **What you did**
3. **What happened** (error message, screenshot)
4. **What should happen**

I'll fix them immediately!

---

## 🎉 When Ready

Once all tests pass and issues are fixed, we'll:
1. ✅ Confirm everything works
2. 📸 Take screenshots of working features
3. 📄 Update documentation
4. 🚀 **Start Phase 9: Advanced Social Features**

---

**Let's start testing!** 🧪

Run the frontend and let me know what you find:
```bash
npm run dev
```

Open http://localhost:5173 and start testing! Report any issues you encounter.
