# Nutrisipe UI Revamp Changelog

## [Phase 1] - Design System & App Architecture
- **New Core Components:**
  - `AppShell.vue`: New layout engine supporting responsive sidebar, mobile dock, and glassmorphic UI.
  - `LayoutBackground.vue`: Dynamic blurred background system using OKLCH colors.
  - `PinGrid.vue` & `RecipeCard.vue`: Pinterest-style masonry grid with hover states and engagement overlays.
  - `UserAvatar.vue`: Standardized avatar component with size variants.
  - `FollowButton.vue`: Standardized following logic.

## [Phase 2] - Primary View Migration
- **HomeView:** Implemented multi-row infinite scroll feed with category filters.
- **ExploreView:** New search-first interface with trending pins.
- **RecipeCreateView:** Replaced simple form with 4-step wizard (Photo, Ingredients, Method, Nutrition).
- **ProfileView:** Implemented immersive hero-header with stats and tabbed content.
- **SettingsView:** Modernized account management with clear sectioning and responsive layout.

## [Phase 3] - Secondary & Admin View Migration
- **FollowingFeedView:** Modernized following-only feed.
- **SavedRecipesView:** Redesigned personal collections grid.
- **MessagesView:** New split-pane chat interface with glassmorphic sidebar and immersive chat bubbles.
- **RecipeDetailView:** Redesigned direct-link view to match the high-fidelity modal experience.
- **IngredientsView:** Complete overhaul of the food database manager with a modern tabular interface.
- **Admin Views:** Fully revamped Dashboard, Users, and Reports management with platform health metrics and quick controls.

## [Phase 4] - Technical Stitching & Optimization
- **API Realignment:**
  - Fixed `RecipeModal` API call mismatch.
  - Added missing `postsApi` methods (create, update, delete).
  - Added `getSavedPosts` to `usersApi`.
- **TypeScript & Type Safety:**
  - Standardized `Ingredient` and `Post` interfaces.
  - Resolved all `vue-tsc` build errors.
- **State & Caching:**
  - Integrated `useCache` and `useInfiniteScroll` across all primary feeds.
  - Standardized store-to-view data flows.

## TODOs / Future Optimizations
- [ ] **Notification Store:** Integrate the sidebar bell with real-time socket events.
- [ ] **Full Recipe Model:** Update backend `Post` model to support full `Procedure` and `Ingredients` JSON/Relational storage.
- [ ] **Skeleton Refinement:** Improve card skeleton fidelity during fast scrolling.
- [ ] **Image Optimization:** Implement server-side resizing for feed images.
