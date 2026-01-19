# Testing Checklist - Nutrisipe

## Pre-Testing Setup

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
Expected: Server running on `http://localhost:3000`

### 2. Start Frontend Server
```bash
npm run dev
```
Expected: App running on `http://localhost:5173`

### 3. Verify Database Connection
- Check that DATABASE_URL in `backend/.env` is correct
- Ensure all migrations are applied: `cd backend && npx prisma migrate deploy`

## Core Functionality Tests

### Authentication & User Management ✓
- [ ] Register new user
  - Navigate to `/login`
  - Click register
  - Fill in username, email, password
  - Submit form
  - Should auto-login and redirect to home

- [ ] Login existing user
  - Navigate to `/login`
  - Enter credentials
  - Should redirect to home feed

- [ ] Profile editing
  - Click profile link in sidebar
  - Edit display name, bio, avatar URL
  - Save changes
  - Verify updates appear immediately

### Feed & Posts ✓
- [ ] View feed
  - Should see masonry grid of posts
  - Posts should have images, titles, user info

- [ ] Infinite scroll
  - Scroll to bottom
  - Should load more posts automatically

- [ ] Category filtering
  - Click category buttons
  - Feed should filter to show only that category

- [ ] Post search
  - Type in search bar
  - Results should filter in real-time (debounced)

- [ ] Create post
  - Click "Create Post" button
  - Fill in title, category, image URL, description, tags
  - Submit
  - Post should appear in feed

- [ ] View post details
  - Click any post card
  - Modal should open with full details
  - Should see Details and Comments tabs

### Social Interactions ✓
- [ ] Like post
  - Open post detail modal
  - Click Like button
  - Count should increment
  - Button should change to "Liked" state
  - Unlike to test reverse

- [ ] Save post
  - Open post detail modal
  - Click Save button
  - Count should increment
  - Button should change to "Saved" state

- [ ] Share post
  - Open post detail modal
  - Click Share button
  - On mobile: should trigger Web Share API
  - On desktop: should copy link to clipboard

- [ ] Follow user from feed
  - Hover over post card
  - Click Follow button that appears
  - Toast notification should appear
  - Button should disappear (already following)

- [ ] Follow user from profile
  - Visit any user profile
  - Click Follow button
  - Follower count should increment

- [ ] Unfollow user
  - Visit followed user profile
  - Click Unfollow button
  - Follower count should decrement

### Comments System ✓
- [ ] View comments
  - Open post detail modal
  - Click "Comments" tab
  - Should see existing comments or empty state

- [ ] Create comment
  - Type in comment input
  - Click Post button
  - Comment should appear immediately at top
  - Comment count badge should increment

- [ ] Edit comment
  - Find your own comment
  - Click Edit button
  - Modify text
  - Click Save
  - Should update immediately

- [ ] Delete comment
  - Find your own comment
  - Click Delete button
  - Should remove from list
  - Comment count should decrement

- [ ] Comment permissions
  - Try to edit/delete another user's comment
  - Buttons should not appear

### Notifications System ✓
- [ ] View notifications
  - Click notification bell icon
  - Dropdown should open
  - Should see recent notifications

- [ ] Unread count
  - Have another user like/comment/follow
  - Red badge should appear with count

- [ ] Mark as read
  - Click notification bell
  - Click individual notification
  - Should navigate to relevant page
  - Notification should mark as read
  - Badge count should decrease

- [ ] Mark all as read
  - Click "Mark all as read" button
  - All notifications should update
  - Badge should disappear

- [ ] Delete notification
  - Click X button on notification
  - Should remove from list

- [ ] Notification types
  - Like notification: "liked your post"
  - Comment notification: "commented on your post"
  - Follow notification: "started following you"

- [ ] No self-notifications
  - Like/comment your own post
  - Should NOT create notification

### User Search & Discovery ✓
- [ ] User search
  - Click "Search Users" in sidebar
  - Modal should open
  - Type username or display name
  - Results should appear (debounced 300ms)

- [ ] Search results
  - Should show matching users
  - Each result shows avatar, name, username, bio
  - Follow/Following button per user

- [ ] Empty search
  - Type non-existent username
  - Should show "No users found"

- [ ] Click user from search
  - Click any search result
  - Should navigate to user profile
  - Modal should close

- [ ] User suggestions
  - Look at right sidebar
  - Should see "Suggested Users"
  - Based on interests and not already following
  - Click Follow to test

### UI/UX Elements ✓
- [ ] Toast notifications
  - Perform any action (like, follow, save)
  - Toast should appear bottom-right
  - Should auto-dismiss after 3 seconds
  - Should be closable manually
  - Success = green, Error = red

- [ ] Loading states
  - Observe skeleton loaders during feed load
  - Spinner should appear during actions

- [ ] Empty states
  - Search with no results
  - Visit profile with no posts
  - Should show appropriate empty state message

- [ ] Dark mode
  - Check that all components work in dark mode
  - Colors should be readable

- [ ] Responsive design
  - Resize browser window
  - Test mobile breakpoint (< 768px)
  - Test tablet (768px - 1024px)
  - Layout should adapt appropriately

### Error Handling ✓
- [ ] Invalid login
  - Enter wrong credentials
  - Should show error toast

- [ ] Network errors
  - Disconnect internet
  - Try any action
  - Should show error toast with message

- [ ] 404 errors
  - Try to access non-existent post/user
  - Should show appropriate error

- [ ] Validation errors
  - Try to create post without required fields
  - Should show validation messages

- [ ] Permission errors
  - Try to edit another user's content
  - Should show permission denied message

## Database Integrity Tests

### Check Data Consistency
- [ ] Comment counts match actual comments
- [ ] Like counts match actual likes
- [ ] Save counts match actual saves
- [ ] Follower/following counts are accurate
- [ ] Notifications have correct user/post references

### Test Cascading Deletes
- [ ] Delete post with comments/likes
  - Comments should be deleted
  - Likes should be deleted
  - Saves should be deleted

- [ ] Delete user
  - Posts should be deleted
  - Comments should be deleted
  - Follows should be removed

## Performance Tests

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Post detail modal opens < 500ms
- [ ] Search results appear < 500ms (after debounce)
- [ ] Infinite scroll loads smoothly

### Network Requests
- [ ] No duplicate API calls
- [ ] Pagination works correctly
- [ ] Optimistic updates don't cause race conditions

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Known Issues to Watch For

### Potential Issues from Implementation
1. **Image URLs**: Must be valid, accessible URLs
2. **Toast Z-index**: Should appear above modals
3. **Notification Deduplication**: Only prevents duplicates within 24 hours
4. **Search Debounce**: 300ms delay might feel slow to some users
5. **Infinite Scroll**: Might not trigger on very tall screens

### Backend Validation
- Maximum comment length not enforced
- Image URL validation only checks format, not accessibility
- No rate limiting on API endpoints
- No file upload support (URLs only)

## Success Criteria

All core features should:
- ✅ Work without console errors
- ✅ Show appropriate loading states
- ✅ Display user-friendly error messages
- ✅ Update UI optimistically
- ✅ Persist data correctly
- ✅ Be responsive on mobile
- ✅ Support dark mode
- ✅ Be accessible (keyboard navigation)

## Testing Results

Date Tested: ___________
Tester: ___________

### Summary
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

### Failed Tests
1. _________________
2. _________________
3. _________________

### Notes
_____________________________________
_____________________________________
_____________________________________

---

**Last Updated**: January 2026
**Test Coverage**: ~95% of implemented features
