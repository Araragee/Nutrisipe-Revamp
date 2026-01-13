# Migration Inventory: OfficialNutrisipe React + Sanity.io Project

**Generated:** 2026-01-08
**Source:** `/OfficialNutrisipe/`
**Target:** Vue 3 + TypeScript + Tailwind + Laravel

---

## 📊 Project Overview

**Nutrisipe** is a Recipe Cookbook Progressive Web Application (PWA) with social media features and integrated nutrition fact calculation. The application allows users to share recipes, follow other users, save favorite recipes, and automatically calculate nutritional information based on ingredients from a Philippine food composition database.

**Live URL:** https://officialnutrisipe.pages.dev/

---

## 📦 Component Inventory (24 Components)

### Container Components (2)

#### 1. **App.js**
- **Location:** `frontend/src/App.js`
- **Type:** Root container
- **Purpose:** Authentication routing and app initialization
- **Features:**
  - localStorage authentication check
  - Redirect to /login if not authenticated
  - Main routing structure
- **State:** None (uses localStorage)
- **Routes:** `/login`, `/*`
- **Libraries:** react-router-dom

#### 2. **Home.jsx**
- **Location:** `frontend/src/container/Home.jsx`
- **Type:** Main layout container
- **Purpose:** Authenticated user layout with sidebar
- **Features:**
  - Responsive sidebar (desktop/mobile hamburger)
  - User data fetching from Sanity
  - Nested routing for profiles and content
  - Socket.io connection setup (commented out)
- **State:** `toggleSidebar`, `user`, `socket`
- **Routes:** `/user-profile/:userId`, `/user-profile/:userId/followers`, `/user-profile/:userId/following`, `/*`
- **Libraries:** react-router-dom, react-icons, socket.io-client

#### 3. **Pins.jsx**
- **Location:** `frontend/src/container/Pins.jsx`
- **Type:** Content container
- **Purpose:** Recipe/pin content routing
- **Features:**
  - Search functionality
  - Route management for all pin-related views
  - Socket.io integration (commented out)
- **State:** `searchTerm`, `socket`
- **Routes:** `/`, `/category/:categoryId`, `/pin-detail/:pinId`, `/create-pin`, `/search`, `/create-ingredient`
- **Libraries:** react-router-dom, socket.io-client

---

### Authentication Component (1)

#### 4. **Login.jsx**
- **Location:** `frontend/src/components/Login.jsx`
- **Type:** Authentication page
- **Purpose:** Google OAuth login
- **Features:**
  - Google OAuth integration (@react-oauth/google)
  - JWT token decoding
  - Auto-create/update Sanity user document
  - localStorage persistence
  - Redirect after login
- **State:** None
- **User Schema:** `{ _id, _type: 'user', userName, image, id, isAdmin: false }`
- **Libraries:** @react-oauth/google, jwt-decode, react-router-dom
- **Environment:** REACT_APP_GOOGLE_OAUTH_CLIENT_ID

---

### Navigation Components (2)

#### 5. **Navbar.jsx**
- **Location:** `frontend/src/components/Navbar.jsx`
- **Type:** Top navigation bar
- **Purpose:** Search and add recipe functionality
- **Features:**
  - Real-time search input
  - Dropdown menu (Add Recipe / Add Ingredient)
  - Admin-only "Add Ingredient" option
  - Special character filtering
  - Navigation to search route
- **Props:** `searchTerm`, `setSearchTerm`, `user`, `socket`
- **State:** None (controlled component)
- **Libraries:** react-icons, react-router-dom

#### 6. **Sidebar.jsx**
- **Location:** `frontend/src/components/Sidebar.jsx`
- **Type:** Side navigation
- **Purpose:** Category navigation and user profile
- **Features:**
  - Logo and home link
  - 9 category links with images
  - Active link highlighting
  - User profile link
  - Mobile-responsive
  - Socket.io notification placeholder (commented out)
- **Props:** `closeToggle`, `user`, `socket`
- **State:** None
- **Categories:** Vegetables, Dairy Foods, Fats, Protein, Fruits, Fish and Seafoods, Meat, Poultry, Others
- **Libraries:** react-icons, react-router-dom, socket.io-client

---

### Feed & Display Components (4)

#### 7. **Feed.jsx**
- **Location:** `frontend/src/components/Feed.jsx`
- **Type:** Recipe feed
- **Purpose:** Display recipes with filtering
- **Features:**
  - Toggle between "All" and "Following" feeds
  - Category filtering via URL params
  - Fetches recipes from Sanity
  - Loading spinner
  - Empty state message
- **Props:** `user`, `socket`
- **State:** `pins`, `loading`, `user`, `text`, `activeBtn`
- **Queries:** `feedQuery`, `searchQuery`, `userFollowingPost`
- **Libraries:** react-router-dom

#### 8. **MasonryLayout.jsx**
- **Location:** `frontend/src/components/MasonryLayout.jsx`
- **Type:** Layout component
- **Purpose:** Responsive masonry grid
- **Features:**
  - 6 breakpoints (500px → 3000px)
  - 1-6 column layouts
  - Animation on render
- **Props:** `pins` (array)
- **State:** None
- **Breakpoints:**
  - 3000px: 6 columns
  - 2000px: 5 columns
  - 1200px: 3 columns
  - 1000px: 2 columns
  - 500px: 1 column
  - default: 4 columns
- **Libraries:** react-masonry-css

#### 9. **Pin.jsx**
- **Location:** `frontend/src/components/Pin.jsx`
- **Type:** Recipe card
- **Purpose:** Individual recipe display in feed
- **Features:**
  - Hover effects showing actions
  - Save/unsave (heart icon)
  - Delete button (owner only)
  - Like functionality
  - Navigate to detail on click
  - User profile link
  - Sanity image optimization
- **Props:** `pin` (recipe object)
- **State:** `postHovered`, `savingPost`
- **Sanity Operations:** PATCH (save), DELETE (remove), UNSET (unsave)
- **Libraries:** react-router-dom, react-icons, uuid, socket.io-client

#### 10. **PinDetail.jsx**
- **Location:** `frontend/src/components/PinDetail.jsx`
- **Type:** Recipe detail page
- **Purpose:** Full recipe view with nutrition
- **Features:**
  - **Recipe Display:** Image, title, description, ingredients, procedure, category
  - **Nutrition Facts Panel:** FDA-style label with 13 nutrients per serving
  - **Interactions:** Save, comment, hide/unhide (owner), delete (owner/admin), report
  - **Comments Section:** Add, view, delete comments
  - **Related Recipes:** Same category recommendations
- **Props:** `user`, `socket`
- **State:** `pins`, `pinDetail`, `comment`, `addingComment`, `savingPost`, `showDropdown`
- **Nutrition Display:**
  - Serving size & servings per recipe
  - Energy (kcal)
  - Protein, Fat, Carbohydrate (g)
  - Calcium, Phosphorus, Iron (mg)
  - Vitamins A, C, Thiamine, Riboflavin, Niacin
- **Queries:** `pinDetailQuery`, `pinDetailMorePinQuery`
- **Libraries:** react-router-dom, react-icons, uuid, react-tooltip, socket.io-client

---

### Recipe Creation Component (1)

#### 11. **CreatePin.jsx**
- **Location:** `frontend/src/components/CreatePin.jsx`
- **Type:** Recipe creation form
- **Purpose:** Create recipes with automatic nutrition calculation
- **Complexity:** HIGHEST (23 state variables, complex logic)
- **State Management:**
  - Recipe Info: `title`, `about`, `category`
  - Image: `imageAsset`, `wrongImageType`
  - Procedure: `procedure` (array)
  - Ingredients: `chosenIngredient`, `chosenIngredientObject`, `amount`, `finalRecipeObject`, `finalNonRecipeObject`, `ingredientDropDown`
  - Non-DB Ingredients: `nonChosenIngredient`, `nonChosenAmount`
  - Nutrition: `nutrientTable`, `yieldAmount`
  - UI States: `loading`, `loadingIngredient`, `fields`, `ingredientFields`, `nonIngredientFields`, `ModalOpen`, `nonIngredient`, `dropdownClick`
- **Features:**
  1. **Image Upload:** Drag-and-drop, validation, Sanity CDN upload
  2. **Ingredient Search:** Real-time search from database, dropdown results
  3. **Nutrition Calculation:**
     - Formula: `edibleWeight = amount * (ediblePortion / 100)`
     - Formula: `nutrient = (nutrientPer100g * 0.01) * edibleWeight`
     - Sums all ingredient nutrients
     - Divides by yield for per-serving values
  4. **Non-Database Ingredients:** Modal for custom ingredients (no nutrition)
  5. **Procedure Steps:** Dynamic textarea addition/deletion
  6. **Validation:** All required fields checked before submit
  7. **Nutrition Preview:** Modal showing nutrition facts before posting
- **Props:** `user`
- **Final Object:**
  ```javascript
  {
    _type: "pin",
    title, about, procedure, category,
    image: { _type: "image", asset: { _ref: imageAsset._id } },
    userId, postedBy: { _type: "postedBy", _ref: user._id },
    ingredientListPost: [...finalRecipeObject, ...finalNonRecipeObject],
    nutritionPost: { ediblePortionWeight, yieldAmount, energy, prot, fat, carb, calcium, phos, iron, vitA, thia, ribo, nia, vitC },
    isHidden: false
  }
  ```
- **Libraries:** react-router-dom, react-icons, uuid

---

### Ingredient Management Components (2 - Admin Only)

#### 12. **CreateIngredient.jsx**
- **Location:** `frontend/src/components/CreateIngredient.jsx`
- **Type:** Admin form
- **Purpose:** Add ingredients to database
- **Access Control:** Requires `user.isAdmin === true`
- **State (17 fields):**
  - `foodItem`, `altName`, `ediblePortion`
  - Macronutrients: `energy`, `prot`, `fat`, `carb`
  - Minerals: `calcium`, `phos`, `iron`
  - Vitamins: `vitA`, `thia`, `ribo`, `nia`, `vitC`
  - UI: `ModalOpen`, `uploadSuccessAlert`, `uploadFailedAlert`
- **Features:**
  - Three-column form layout
  - Number input validation (no 'e' character)
  - Success/failure alerts
  - Creates `ingredientData` document in Sanity
  - Shows ReadIngredient component
- **Props:** `user`
- **Libraries:** react-router-dom, uuid

#### 13. **ReadIngredient.jsx**
- **Location:** `frontend/src/components/ReadIngredient.jsx`
- **Type:** Admin table view
- **Purpose:** View and manage ingredient database
- **Features:**
  - Full-screen modal
  - Search functionality
  - Scrollable table with all nutrition fields
  - Delete individual ingredients
  - Auto-refresh on changes
- **Props:** `uploadSuccessAlert`, `setuploadSuccessAlert`
- **State:** `ingredientList`, `searchIngredientTerm`, `refresher`, `ModalOpen`
- **Queries:** `allIngredientsQuery`, `searchIngredientQuery`
- **Libraries:** react-icons

---

### User Profile Components (3)

#### 14. **UserProfile.jsx**
- **Location:** `frontend/src/components/UserProfile.jsx`
- **Type:** Profile page
- **Purpose:** User profile with recipes and social features
- **Features:**
  - **Profile Header:** Cover image, profile picture, username
  - **Social Stats:** Followers count, following count (both clickable)
  - **Follow System:** Follow/unfollow button
  - **Recipe Tabs:** Created recipes, Saved recipes
  - **Visibility Control:** Logged-in user sees all (including hidden), others see non-hidden only
  - **Logout:** Clears localStorage and redirects
- **Props:** None (uses URL params)
- **State:** `user`, `pins`, `lengths`, `alreadyfollowed`, `following`, `text`, `activeBtn`
- **Follow Operations:**
  - PATCH current user: add to `following` array
  - PATCH followed user: add to `followers` array
  - Reverse operations for unfollow
- **Queries:** `userQuery`, `userCreatedPinsQuery`, `userHiddenCreatedPinsQuery`, `userSavedPinsQuery`, `userfollowers`, `userfollowing`
- **Libraries:** react-router-dom, react-icons, uuid, @react-oauth/google

#### 15. **Followers.jsx**
- **Location:** `frontend/src/components/Followers.jsx`
- **Type:** Followers list
- **Purpose:** Display user's followers
- **Features:**
  - Grid layout
  - Click to view profile
  - Empty state message
  - Loading spinner
- **Props:** None (uses URL params)
- **State:** `followers`, `loading`, `length`
- **Queries:** `userfollowers`
- **Libraries:** react-router-dom

#### 16. **Following.jsx**
- **Location:** `frontend/src/components/Following.jsx`
- **Type:** Following list
- **Purpose:** Display users that profile is following
- **Features:**
  - Grid layout
  - Unfollow button (own profile only)
  - Click to view profile
  - Empty state message
  - Complex array manipulation for data extraction
- **Props:** None (uses URL params)
- **State:** `following`, `loading`, `length`
- **Queries:** `userfollowing`
- **Libraries:** react-router-dom

---

### Search Component (1)

#### 17. **Search.jsx**
- **Location:** `frontend/src/components/Search.jsx`
- **Type:** Search results
- **Purpose:** Display search results
- **Features:**
  - Real-time search as user types
  - Searches in: title, category, about, ingredients, username
  - Shows all recipes if empty search
  - Loading spinner
  - Empty state message
- **Props:** `searchTerm`
- **State:** `pins`, `loading`
- **Queries:** `searchQuery`, `feedQuery`
- **Libraries:** None (uses MasonryLayout)

---

### Utility Component (1)

#### 18. **Spinner.jsx**
- **Location:** `frontend/src/components/Spinner.jsx`
- **Type:** Loading indicator
- **Purpose:** Loading spinner with custom message
- **Features:**
  - Centered layout
  - Watch animation
  - Custom color (#FF9F1C)
  - Custom message display
- **Props:** `message` (string)
- **State:** None
- **Libraries:** react-loader-spinner

---

## 🗄️ Sanity Schema Inventory (8 Schemas)

### Document Schemas (3)

#### 1. **user.js** - User Profile
```javascript
{
  name: 'user',
  type: 'document',
  fields: [
    { name: 'userName', type: 'string' },
    { name: 'image', type: 'string' },
    { name: 'id', type: 'string' },
    { name: 'followers', type: 'array', of: [{ type: 'save' }], validation: unique },
    { name: 'following', type: 'array', of: [{ type: 'save' }], validation: unique },
    { name: 'created_at', type: 'datetime' },
    { name: 'isAdmin', type: 'boolean' }
  ]
}
```
**Purpose:** Store Google OAuth user profiles
**Relationships:** Referenced by `postedBy`, contains `followers[]` and `following[]` arrays

---

#### 2. **pin.js** - Recipe/Post
```javascript
{
  name: 'pin',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'about', type: 'string' },
    { name: 'ingredientListPost', type: 'array', of: [{ type: 'ingredientList' }] },
    { name: 'nutritionPost', type: 'nutritionPost' },
    { name: 'procedure', type: 'array', of: [{ type: 'string' }] },
    { name: 'category', type: 'string' },
    { name: 'image', type: 'image', options: { hotspot: true } },
    { name: 'userId', type: 'string' },
    { name: 'postedBy', type: 'postedBy' },
    { name: 'save', type: 'array', of: [{ type: 'save' }] },
    { name: 'comments', type: 'array', of: [{ type: 'comment' }] },
    { name: 'created_at', type: 'datetime' },
    { name: 'isHidden', type: 'boolean', default: false }
  ]
}
```
**Purpose:** Store recipe posts with all details
**Relationships:** References `user` via `postedBy`, contains arrays of `ingredientList`, `comments`, `saves`

---

#### 3. **ingredientData.js** - Ingredient Database
```javascript
{
  name: 'ingredientData',
  type: 'document',
  fields: [
    { name: 'foodItem', type: 'string' },
    { name: 'altName', type: 'string' },
    { name: 'ediblePortion', type: 'number' },
    // Macronutrients
    { name: 'energy', type: 'number' },
    { name: 'prot', type: 'number' },
    { name: 'fat', type: 'number' },
    { name: 'carb', type: 'number' },
    // Minerals
    { name: 'calcium', type: 'number' },
    { name: 'phos', type: 'number' },
    { name: 'iron', type: 'number' },
    // Vitamins
    { name: 'vitA', type: 'number' },
    { name: 'thia', type: 'number' },
    { name: 'ribo', type: 'number' },
    { name: 'nia', type: 'number' },
    { name: 'vitC', type: 'number' }
  ]
}
```
**Purpose:** Master ingredient database with nutrition values per 100g
**Source:** Philippine Food Composition Table (PhilFCT)

---

### Object Schemas (5)

#### 4. **comment.js** - Recipe Comment
```javascript
{
  name: 'comment',
  type: 'document',
  fields: [
    { name: 'postedBy', type: 'postedBy' },
    { name: 'comment', type: 'string' }
  ]
}
```
**Purpose:** Store comments on recipes

---

#### 5. **save.js** - Save/Like/Follow Action
```javascript
{
  name: 'save',
  type: 'document',
  fields: [
    { name: 'postedBy', type: 'postedBy' },
    { name: 'userId', type: 'string' },
    { name: 'pin', type: 'reference', to: { type: 'pin' } }
  ]
}
```
**Purpose:** Track saved recipes and follow relationships
**Usage:** Used in recipes (saves) and users (followers/following)

---

#### 6. **postedBy.js** - User Reference
```javascript
{
  name: 'postedBy',
  type: 'reference',
  to: [{ type: 'user' }]
}
```
**Purpose:** Reference to user document

---

#### 7. **ingredientList.js** - Recipe Ingredient
```javascript
{
  name: 'ingredientList',
  type: 'document',
  fields: [
    { name: 'ingredientName', type: 'string' },
    { name: 'metric', type: 'string' },
    { name: 'amount', type: 'number' }
  ]
}
```
**Purpose:** Store individual ingredients in a recipe
**Note:** Extended in app with nutrition calculations

---

#### 8. **nutritionPost.js** - Nutrition Facts
```javascript
{
  name: 'nutritionPost',
  type: 'document',
  fields: [
    { name: 'ediblePortionWeight', type: 'number' },
    { name: 'yieldAmount', type: 'string' },
    { name: 'energy', type: 'number' },
    { name: 'prot', type: 'number' },
    { name: 'fat', type: 'number' },
    { name: 'carb', type: 'number' },
    { name: 'calcium', type: 'number' },
    { name: 'phos', type: 'number' },
    { name: 'iron', type: 'number' },
    { name: 'vitA', type: 'number' },
    { name: 'thia', type: 'number' },
    { name: 'ribo', type: 'number' },
    { name: 'nia', type: 'number' },
    { name: 'vitC', type: 'number' }
  ]
}
```
**Purpose:** Store calculated nutrition facts per serving

---

### Schema Relationships
```
user
├─ Referenced by: postedBy (in pins, comments, saves)
├─ Contains: followers[] (array of save objects)
└─ Contains: following[] (array of save objects)

pin (recipe)
├─ References: user (via postedBy)
├─ Contains: ingredientListPost[] (ingredientList objects)
├─ Contains: nutritionPost (nutritionPost object)
├─ Contains: save[] (users who saved - save objects)
├─ Contains: comments[] (comment objects)
└─ Contains: procedure[] (strings)

ingredientData
└─ Standalone database (no direct relationships)

comment
└─ References: user (via postedBy)

save
├─ References: user (via postedBy)
└─ Optional: references pin (for recipe saves only)
```

---

## 🛣️ Route Inventory (10 Routes)

### Main Routes
```
/login                              → Login.jsx
/*                                  → Home.jsx (authenticated)
```

### Home Container Routes
```
/user-profile/:userId               → UserProfile.jsx
/user-profile/:userId/followers     → Followers.jsx
/user-profile/:userId/following     → Following.jsx
/*                                  → Pins.jsx
```

### Pins Container Routes
```
/                                   → Feed.jsx (main feed)
/category/:categoryId               → Feed.jsx (filtered)
/pin-detail/:pinId                  → PinDetail.jsx
/create-pin                         → CreatePin.jsx
/search                             → Search.jsx
/create-ingredient                  → CreateIngredient.jsx (admin only)
```

### Route Parameters
- `:userId` - User's Sanity _id (Google OAuth sub)
- `:categoryId` - Category name (9 categories)
- `:pinId` - Recipe's Sanity _id

### Route Guards
- **Authentication:** App.js checks localStorage, redirects to /login
- **Admin:** CreateIngredient checks `user.isAdmin`, shows "Unauthorized Access" if false
- **No nested route guards** - component-level checks only

---

## ✨ Feature Inventory (20+ Features)

### 1. Authentication & User Management
- ✅ Google OAuth login (single sign-on)
- ✅ JWT token decoding
- ✅ Auto-create Sanity user document
- ✅ Persistent login via localStorage
- ✅ Logout functionality
- ✅ User profiles (username, image)
- ✅ Admin flag for permissions

### 2. Recipe Management
- ✅ Create recipe with image upload
- ✅ Search and add ingredients from database
- ✅ Add custom ingredients (without nutrition)
- ✅ Specify ingredient amounts in grams
- ✅ Add step-by-step procedure (dynamic steps)
- ✅ Select category (9 categories)
- ✅ Specify serving yield
- ✅ Auto-calculate nutrition facts
- ✅ Preview nutrition before posting
- ✅ View recipes in masonry grid layout
- ✅ Category filtering
- ✅ Search recipes (multi-field)
- ✅ View recipe details with full nutrition
- ✅ See related recipes (same category)

### 3. Recipe Interactions
- ✅ Save/unsave recipes (like functionality)
- ✅ Comment on recipes
- ✅ Delete own comments
- ✅ Hide/unhide own recipes (visibility toggle)
- ✅ Delete own recipes
- ✅ Delete any recipe (admin)
- ✅ Report inappropriate recipes (email link)

### 4. Social Features
- ✅ Follow/unfollow users
- ✅ View followers list
- ✅ View following list
- ✅ Mutual following updates (both users updated)
- ✅ "All" feed (all public recipes)
- ✅ "Following" feed (recipes from followed users)
- ✅ Category feeds

### 5. Nutrition Calculation System
- ✅ Philippine Food Composition Table database
- ✅ 15 nutrition fields per ingredient
- ✅ Edible portion percentage calculation
- ✅ Automatic edible weight calculation
- ✅ Automatic nutrition per ingredient calculation
- ✅ Sum all ingredients
- ✅ Divide by yield for per-serving values
- ✅ FDA-style nutrition label display
- ✅ Serving size and servings per recipe

### 6. Admin Features
- ✅ Add ingredients to database
- ✅ View all ingredients in searchable table
- ✅ Delete ingredients
- ✅ Delete any recipe
- ✅ Delete any comment
- ✅ Admin-only routes

### 7. Search & Discovery
- ✅ Real-time search
- ✅ Multi-field search (title, category, description, ingredients, username)
- ✅ Special character filtering
- ✅ Empty state handling
- ✅ 9 predefined categories with images
- ✅ Category navigation
- ✅ Active link highlighting

### 8. UI/UX Features
- ✅ Responsive design (desktop sidebar + mobile hamburger)
- ✅ Masonry grid layout (6 breakpoints)
- ✅ Loading spinners
- ✅ Empty state messages
- ✅ Hover effects
- ✅ Slide-in animations
- ✅ Modals (nutrition preview, ingredient input, database viewer)
- ✅ Dropdown menus
- ✅ Custom scrollbar styling

---

## 🔧 Technical Stack

### Frontend Dependencies
**Core:**
- react ^17.0.2
- react-dom ^17.0.2
- react-router-dom ^6.0.2

**Sanity:**
- @sanity/client ^2.21.10
- @sanity/image-url ^1.0.1

**Auth:**
- @react-oauth/google ^0.2.8
- jwt-decode ^3.1.2
- gapi-script ^1.2.0

**UI Libraries:**
- react-icons ^4.3.1
- react-masonry-css ^1.0.16
- react-loader-spinner ^4.0.0
- react-tooltip ^4.4.3
- react-hot-toast ^2.4.0
- react-bootstrap ^2.7.2
- mdb-react-ui-kit ^4.2.0

**Styling:**
- tailwindcss (PostCSS 7 compat) ^2.2.17
- autoprefixer ^9.8.8
- postcss ^7.0.39

**Real-time:**
- socket.io-client ^4.6.1 (partially implemented)

**Utilities:**
- uuid ^8.3.2
- flatted ^3.2.7
- @craco/craco ^6.4.0

### Backend Dependencies (Sanity)
- @sanity/base ^2.35.0
- @sanity/core ^2.35.0
- @sanity/default-layout ^2.35.0
- @sanity/default-login ^2.35.0
- @sanity/desk-tool ^2.35.1
- @sanity/vision ^2.35.0
- react ^17.0
- react-dom ^17.0
- styled-components ^5.2.0

### State Management
- **Approach:** Local component state (useState)
- **No global state management** (no Redux/Context)
- **localStorage:** User persistence
- **Sanity Client:** Backend/database

### Styling
- **Framework:** Tailwind CSS (PostCSS 7)
- **Custom Theme:**
  - Colors: nGreen (#008083), nOrange (#FF9F1C), nRed (#dc2626)
  - Custom widths: 190, 275, 300, 340, 350, 656, 880, 508px
  - Custom heights: 80, 340, 370, 420, 510, 600, 685, 800px, 90vh
  - Animations: slide-in, slide-fwd
- **Font:** Lato (Google Fonts)
- **Scrollbar:** Custom hidden scrollbar

### Build Configuration
- **Tool:** Create React App + CRACO
- **Scripts:**
  - start: `SET NODE_OPTIONS=--openssl-legacy-provider && craco start`
  - build: `craco build`
- **PWA:** Service worker registered

### Environment Variables
```
REACT_APP_SANITY_PROJECT_ID
REACT_APP_SANITY_TOKEN
REACT_APP_GOOGLE_OAUTH_CLIENT_ID
```

---

## 🔄 Migration Mapping: React → Vue 3

### Component Conversions

| React Component | Vue 3 Component | Complexity |
|-----------------|-----------------|------------|
| App.js | App.vue + router guards | Low |
| Home.jsx | HomeLayout.vue | Medium |
| Pins.jsx | RecipesLayout.vue | Low |
| Login.jsx | LoginView.vue | Medium |
| Navbar.jsx | NavbarComponent.vue | Low |
| Sidebar.jsx | SidebarComponent.vue | Low |
| Feed.jsx | RecipeFeed.vue | Medium |
| MasonryLayout.jsx | MasonryGrid.vue | Low |
| Pin.jsx | RecipeCard.vue | Medium |
| PinDetail.jsx | RecipeDetail.vue | **High** |
| CreatePin.jsx | CreateRecipe.vue | **Very High** |
| CreateIngredient.jsx | CreateIngredient.vue (admin) | Medium |
| ReadIngredient.jsx | IngredientTable.vue (admin) | Low |
| UserProfile.jsx | UserProfile.vue | High |
| Followers.jsx | FollowersList.vue | Low |
| Following.jsx | FollowingList.vue | Low |
| Search.jsx | SearchResults.vue | Low |
| Spinner.jsx | LoadingSpinner.vue | Low |

### React → Vue 3 Pattern Mapping

| React Pattern | Vue 3 Equivalent |
|---------------|------------------|
| `useState` | `ref()` / `reactive()` |
| `useEffect` | `onMounted()`, `watch()`, `watchEffect()` |
| `useNavigate` | `useRouter().push()` |
| `useParams` | `useRoute().params` |
| Props | `defineProps<Props>()` |
| JSX | `<template>` in SFC |
| `className` | `class` |
| `onClick` | `@click` |
| `onChange` | `@change` / `v-model` |
| `.map()` in JSX | `v-for` |
| `&&` conditional | `v-if` / `v-show` |
| localStorage | Pinia store + localStorage persistence |

---

## 🗄️ Sanity → Laravel Migration

### Database Schema (Laravel Migrations)

```sql
-- Users table
users
├─ id (bigIncrements)
├─ name (string)
├─ email (string, unique)
├─ google_id (string, unique)
├─ image (string, nullable)
├─ is_admin (boolean, default: false)
├─ created_at (timestamp)
└─ updated_at (timestamp)

-- Recipes table
recipes
├─ id (bigIncrements)
├─ user_id (foreignId -> users)
├─ title (string)
├─ description (text)
├─ category (string)
├─ image (string)
├─ procedure (json) -- array of steps
├─ is_hidden (boolean, default: false)
├─ created_at (timestamp)
└─ updated_at (timestamp)

-- Ingredients table (master database)
ingredients
├─ id (bigIncrements)
├─ food_item (string)
├─ alt_name (string, nullable)
├─ edible_portion (decimal)
├─ energy (decimal)
├─ protein (decimal)
├─ fat (decimal)
├─ carb (decimal)
├─ calcium (decimal)
├─ phos (decimal)
├─ iron (decimal)
├─ vit_a (decimal)
├─ thia (decimal)
├─ ribo (decimal)
├─ nia (decimal)
└─ vit_c (decimal)

-- Recipe ingredients (pivot with extra data)
recipe_ingredients
├─ id (bigIncrements)
├─ recipe_id (foreignId -> recipes)
├─ ingredient_id (foreignId -> ingredients, nullable)
├─ name (string)
├─ amount (decimal) -- in grams
├─ edible_weight (decimal)
├─ is_custom (boolean) -- for non-DB ingredients
└─ created_at (timestamp)

-- Nutrition facts
nutrition_facts
├─ id (bigIncrements)
├─ recipe_id (foreignId -> recipes, unique)
├─ serving_size (decimal)
├─ yield_amount (string)
├─ energy (decimal)
├─ protein (decimal)
├─ fat (decimal)
├─ carb (decimal)
├─ calcium (decimal)
├─ phos (decimal)
├─ iron (decimal)
├─ vit_a (decimal)
├─ thia (decimal)
├─ ribo (decimal)
├─ nia (decimal)
├─ vit_c (decimal)
├─ created_at (timestamp)
└─ updated_at (timestamp)

-- Saves (likes)
saves
├─ id (bigIncrements)
├─ user_id (foreignId -> users)
├─ recipe_id (foreignId -> recipes)
├─ created_at (timestamp)
└─ unique(user_id, recipe_id)

-- Comments
comments
├─ id (bigIncrements)
├─ recipe_id (foreignId -> recipes)
├─ user_id (foreignId -> users)
├─ comment (text)
├─ created_at (timestamp)
└─ updated_at (timestamp)

-- Follows
follows
├─ id (bigIncrements)
├─ follower_id (foreignId -> users)
├─ followed_id (foreignId -> users)
├─ created_at (timestamp)
└─ unique(follower_id, followed_id)
```

### Laravel API Endpoints

```
Authentication
POST   /api/auth/google          - Google OAuth callback
POST   /api/auth/logout          - Logout
GET    /api/auth/user            - Get current user

Recipes
GET    /api/recipes              - List recipes (filters: category, following, search)
GET    /api/recipes/{id}         - Single recipe detail
POST   /api/recipes              - Create recipe
PUT    /api/recipes/{id}         - Update recipe
DELETE /api/recipes/{id}         - Delete recipe (owner/admin)
PATCH  /api/recipes/{id}/hide    - Toggle hide/unhide (owner)

Recipe Interactions
POST   /api/recipes/{id}/save    - Save/like recipe
DELETE /api/recipes/{id}/save    - Unsave recipe
POST   /api/recipes/{id}/comments - Add comment
DELETE /api/comments/{id}        - Delete comment (owner/admin)

Users
GET    /api/users/{id}           - User profile
GET    /api/users/{id}/recipes   - User's recipes
GET    /api/users/{id}/saved     - User's saved recipes
GET    /api/users/{id}/followers - User's followers
GET    /api/users/{id}/following - User's following
POST   /api/users/{id}/follow    - Follow user
DELETE /api/users/{id}/follow    - Unfollow user

Ingredients (Admin Only)
GET    /api/ingredients          - List ingredients (search)
POST   /api/ingredients          - Create ingredient
DELETE /api/ingredients/{id}     - Delete ingredient

Nutrition
POST   /api/nutrition/calculate  - Calculate nutrition for ingredients
```

### Laravel Models & Relationships

```php
User
├─ hasMany(Recipe)
├─ hasMany(Comment)
├─ belongsToMany(Recipe, 'saves') // saved recipes
├─ belongsToMany(User, 'follows', 'follower_id', 'followed_id') // following
└─ belongsToMany(User, 'follows', 'followed_id', 'follower_id') // followers

Recipe
├─ belongsTo(User)
├─ hasMany(Comment)
├─ hasMany(RecipeIngredient)
├─ hasOne(NutritionFact)
└─ belongsToMany(User, 'saves') // users who saved

Ingredient
└─ hasMany(RecipeIngredient)

RecipeIngredient
├─ belongsTo(Recipe)
└─ belongsTo(Ingredient, nullable)

NutritionFact
└─ belongsTo(Recipe)

Comment
├─ belongsTo(Recipe)
└─ belongsTo(User)
```

---

## 🎯 Critical Migration Priorities

### Phase 1: Foundation (Week 1)
1. ✅ Laravel backend setup (DONE)
2. ⬜ Database migrations
3. ⬜ Laravel models with relationships
4. ⬜ Google OAuth via Laravel Socialite
5. ⬜ API authentication (Sanctum)
6. ⬜ Ingredient seeder (PhilFCT data)

### Phase 2: Core API (Week 2)
1. ⬜ Recipe CRUD endpoints
2. ⬜ User profile endpoints
3. ⬜ Ingredient management endpoints
4. ⬜ Nutrition calculation service (backend)
5. ⬜ Image upload handling
6. ⬜ API testing

### Phase 3: Vue Frontend Setup (Week 3)
1. ⬜ Vue 3 project structure
2. ⬜ TypeScript configuration
3. ⬜ Tailwind with custom theme
4. ⬜ Vue Router setup
5. ⬜ Pinia stores (auth, recipes, users)
6. ⬜ API service layer (axios)
7. ⬜ Type definitions

### Phase 4: Base Components (Week 4)
1. ⬜ Layout components (Navbar, Sidebar)
2. ⬜ LoadingSpinner
3. ⬜ MasonryGrid
4. ⬜ Modal components
5. ⬜ Form components
6. ⬜ Apply Dave's coding style

### Phase 5: Authentication (Week 5)
1. ⬜ Login page (Google OAuth)
2. ⬜ Auth store (Pinia)
3. ⬜ Route guards
4. ⬜ Persistent login
5. ⬜ Logout functionality

### Phase 6: Recipe Features (Weeks 6-7)
1. ⬜ Recipe feed
2. ⬜ Recipe card
3. ⬜ Recipe detail
4. ⬜ Create recipe form (COMPLEX)
5. ⬜ Search functionality
6. ⬜ Category filtering
7. ⬜ Save/unsave
8. ⬜ Comments

### Phase 7: Social Features (Week 8)
1. ⬜ User profiles
2. ⬜ Follow/unfollow
3. ⬜ Followers/following lists
4. ⬜ Following feed

### Phase 8: Admin Features (Week 9)
1. ⬜ Create ingredient
2. ⬜ Ingredient table
3. ⬜ Admin middleware
4. ⬜ Content moderation

### Phase 9: Polish & Testing (Week 10)
1. ⬜ Responsive design
2. ⬜ Loading states
3. ⬜ Error handling
4. ⬜ Empty states
5. ⬜ Animations
6. ⬜ Code review (Dave's style)
7. ⬜ Testing

---

## ⚠️ Known Challenges

### High Complexity Components
1. **CreatePin.jsx → CreateRecipe.vue** (23 state variables)
   - Complex nutrition calculation logic
   - Multiple modals
   - Dynamic form fields
   - Real-time ingredient search
   - Requires careful TypeScript typing

2. **PinDetail.jsx → RecipeDetail.vue**
   - Multiple nested operations
   - Complex UI interactions
   - Nutrition facts display
   - Comment system

3. **UserProfile.jsx → UserProfile.vue**
   - Multiple Sanity queries → Multiple API calls
   - Complex follow/unfollow logic
   - Conditional rendering based on ownership

### Technical Challenges
1. **Nutrition Calculation Migration**
   - Move from frontend to backend service
   - Ensure calculation accuracy
   - Handle custom ingredients

2. **Image Handling**
   - Replace Sanity CDN with Laravel storage
   - Implement image optimization
   - Handle uploads

3. **Real-time Features**
   - Socket.io currently commented out
   - Decide: Laravel WebSockets vs Pusher vs skip

4. **Search Functionality**
   - Multi-field search across relationships
   - Implement efficient database queries
   - Consider search indexing (Scout/Algolia)

5. **State Management**
   - Convert localStorage + local state to Pinia
   - Implement proper reactivity
   - Handle authentication state

---

## 📊 Statistics

- **Total Components:** 18
- **Total Schemas:** 8
- **Total Routes:** 10
- **State Variables (CreatePin alone):** 23
- **Nutrition Fields:** 15
- **Categories:** 9
- **Dependencies:** 30+
- **Estimated Migration Time:** 10+ weeks
- **Complexity Rating:** High

---

## 🎯 Success Criteria

Migration is complete when:
- ✅ All 18 components migrated to Vue 3 with TypeScript
- ✅ All 8 schemas converted to Laravel models
- ✅ All 10 routes functional in Vue Router
- ✅ All 20+ features working identically
- ✅ Google OAuth authentication working
- ✅ Nutrition calculation accurate (backend)
- ✅ All CRUD operations functional
- ✅ Follow/unfollow system working
- ✅ Save/comment system working
- ✅ Search working across all fields
- ✅ Admin features restricted properly
- ✅ Responsive design maintained
- ✅ Dave's coding style applied consistently
- ✅ No TypeScript errors
- ✅ All tests passing

---

**Generated by:** Claude Code
**Date:** 2026-01-08
**Next Step:** Begin Phase 1 of MIGRATION_CHECKLIST.md
