# Phase 10: Content Enhancement - Implementation Plan

## Overview
Phase 10 focuses on enhancing the content capabilities of Nutrisipe, including video support, recipe ratings and reviews, recipe variations, advanced search/filtering, and content moderation improvements.

## Priority Features

### 1. Recipe Ratings & Reviews System ⭐
Allow users to rate and review recipes with a 5-star system and written feedback.

**Database Schema:**
```prisma
model Rating {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  postId    String   @map("post_id")
  rating    Int      // 1-5 stars
  review    String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@map("ratings")
  @@index([postId])
  @@index([rating])
}

// Add to Post model:
averageRating Float?  @default(0) @map("average_rating")
ratingCount   Int      @default(0) @map("rating_count")
```

**Backend Features:**
- POST `/api/ratings` - Create/update rating
- GET `/api/ratings/post/:postId` - Get ratings for a post
- GET `/api/ratings/user/:userId` - Get user's ratings
- DELETE `/api/ratings/:ratingId` - Delete rating
- Auto-calculate average rating on post
- Validate rating is 1-5
- One rating per user per post

**Frontend Features:**
- Star rating component
- Rating display on posts
- Review list with pagination
- Edit/delete own ratings
- Filter posts by rating
- Sort reviews (most helpful, newest, highest/lowest)

---

### 2. Recipe Variations/Forks 🍴
Allow users to create variations of existing recipes (like GitHub forks).

**Database Schema:**
```prisma
model RecipeVariation {
  id              String   @id @default(uuid())
  originalPostId  String   @map("original_post_id")
  variationPostId String   @unique @map("variation_post_id")
  userId          String   @map("user_id")
  description     String?  @db.Text // What changed
  createdAt       DateTime @default(now()) @map("created_at")

  originalPost    Post     @relation("OriginalPost", fields: [originalPostId], references: [id], onDelete: Cascade)
  variationPost   Post     @relation("VariationPost", fields: [variationPostId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("recipe_variations")
  @@index([originalPostId])
  @@index([variationPostId])
  @@index([userId])
}

// Add to Post model:
isVariation      Boolean  @default(false) @map("is_variation")
variationCount   Int      @default(0) @map("variation_count")
```

**Backend Features:**
- POST `/api/posts/:postId/fork` - Fork a recipe
- GET `/api/posts/:postId/variations` - Get variations of a post
- GET `/api/posts/:postId/original` - Get original if this is a variation
- Track variation chain (original → v1 → v2)
- Copy recipe data and allow modifications

**Frontend Features:**
- "Create Variation" button on recipes
- Pre-fill form with original recipe data
- Show "Based on [original recipe]" badge
- List variations under original
- Variation tree visualization
- Filter variations by user/rating

---

### 3. Video Upload Support 🎥
Enable users to upload cooking videos alongside recipe images.

**Database Schema:**
```prisma
// Update Post model:
videoUrl    String?  @map("video_url")
thumbnailUrl String? @map("thumbnail_url")
videoDuration Int?   @map("video_duration") // in seconds
```

**Backend Features:**
- Video file upload (MP4, WebM, MOV)
- Video size limit (e.g., 100MB)
- Video duration limit (e.g., 10 minutes)
- Thumbnail extraction/upload
- Video processing/compression (optional)
- Store on cloud storage (S3/Cloudinary)

**Frontend Features:**
- Video upload in post creation
- Video player component
- Thumbnail preview
- Video progress indicator
- Play/pause controls
- Fullscreen mode
- Mobile-optimized player

---

### 4. Advanced Search & Filters 🔍
Enhance search with filters, facets, and better relevance.

**Backend Features:**
- Filter by:
  - Category
  - Tags
  - Prep time range
  - Cook time range
  - Difficulty
  - Rating (min/max)
  - Ingredients
  - Dietary restrictions (vegetarian, vegan, gluten-free)
- Sort by:
  - Relevance
  - Rating
  - Date
  - Popularity (likes + saves)
  - Prep time
- Full-text search on:
  - Title
  - Description
  - Ingredients
  - Instructions
- Autocomplete suggestions

**Database Optimization:**
- Full-text search indexes
- Compound indexes for filters
- Query optimization

**Frontend Features:**
- Advanced search modal
- Filter sidebar/panel
- Active filters display
- Clear filters button
- Search suggestions dropdown
- Recent searches
- Save search filters

---

### 5. Nutritional Information Enhancement 📊

**Database Schema (Already exists in Recipe model):**
```prisma
// Recipe model already has:
nutrition Json?

// Expand structure:
{
  calories: number,
  protein: number,    // grams
  carbs: number,      // grams
  fat: number,        // grams
  fiber: number,      // grams
  sugar: number,      // grams
  sodium: number,     // mg
  cholesterol: number // mg
}
```

**Backend Features:**
- Validate nutrition data format
- Optional nutrition calculator API integration
- Nutrition per serving calculation

**Frontend Features:**
- Nutrition facts label display
- Visual nutrition breakdown (charts)
- Nutrition filter in search
- Calorie/macro goals tracking (user preferences)

---

### 6. Recipe Tags System Improvements 🏷️

**Database Schema:**
```prisma
model Tag {
  id        String   @id @default(uuid())
  name      String   @unique @db.VarChar(50)
  slug      String   @unique @db.VarChar(50)
  usageCount Int     @default(0) @map("usage_count")
  createdAt DateTime @default(now()) @map("created_at")

  posts     PostTag[]

  @@map("tags")
  @@index([usageCount])
}

model PostTag {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  tagId     String   @map("tag_id")

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([postId, tagId])
  @@map("post_tags")
  @@index([postId])
  @@index([tagId])
}
```

**Features:**
- Tag autocomplete
- Tag cloud/trending tags
- Tag following/subscribing
- Tag-based feed
- Tag analytics

---

### 7. Ingredient Search 🥕
Search recipes by ingredients you have.

**Database Schema:**
```prisma
model Ingredient {
  id          String   @id @default(uuid())
  name        String   @unique @db.VarChar(100)
  category    String?  @db.VarChar(50) // produce, protein, dairy, etc.
  createdAt   DateTime @default(now()) @map("created_at")

  recipes     RecipeIngredient[]

  @@map("ingredients")
  @@index([category])
}

model RecipeIngredient {
  id           String      @id @default(uuid())
  recipeId     String      @map("recipe_id")
  ingredientId String      @map("ingredient_id")
  amount       String?     // "2 cups", "1 tsp"
  optional     Boolean     @default(false)

  recipe       Recipe      @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  ingredient   Ingredient  @relation(fields: [ingredientId], references: [id])

  @@map("recipe_ingredients")
  @@index([recipeId])
  @@index([ingredientId])
}
```

**Features:**
- "What can I make?" search
- Select ingredients you have
- Find recipes using those ingredients
- Show % match (how many ingredients you have)
- Mark ingredients as "must have"
- Ingredient substitutions

---

### 8. Cooking Mode 👨‍🍳
Step-by-step cooking interface optimized for while you cook.

**Frontend Features:**
- Fullscreen step-by-step view
- Large text for readability
- "Next Step" button
- Voice commands (optional)
- Timer integration
- Ingredient checklist
- Prevent screen sleep
- Progress bar
- Hands-free mode

---

### 9. Shopping List 🛒

**Database Schema:**
```prisma
model ShoppingList {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String   @default("My Shopping List") @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     ShoppingListItem[]

  @@map("shopping_lists")
  @@index([userId])
}

model ShoppingListItem {
  id             String        @id @default(uuid())
  listId         String        @map("list_id")
  ingredientId   String?       @map("ingredient_id")
  customName     String?       @db.VarChar(200)
  amount         String?
  checked        Boolean       @default(false)
  addedAt        DateTime      @default(now()) @map("added_at")

  list           ShoppingList  @relation(fields: [listId], references: [id], onDelete: Cascade)
  ingredient     Ingredient?   @relation(fields: [ingredientId], references: [id])

  @@map("shopping_list_items")
  @@index([listId])
}
```

**Features:**
- Add recipe ingredients to shopping list
- Combine duplicate ingredients
- Check off items
- Share shopping list
- Multiple lists
- Categorize by aisle/section

---

### 10. Recipe Difficulty & Time Estimates
Improve existing fields with better UI and validation.

**Already in Schema:**
```prisma
// Recipe model:
servings    Int?
prepTime    Int? // minutes
cookTime    Int? // minutes
totalTime   Int? // minutes
difficulty  String? // easy, medium, hard
```

**Enhancements:**
- Visual difficulty indicator
- Time range filters in search
- Quick meal finder (<30 min)
- Batch cooking suggestions (makes X servings)
- Active vs passive time tracking

---

## Implementation Priority

### Week 1: Core Rating & Review System
- [ ] Database migration for ratings
- [ ] Backend rating CRUD APIs
- [ ] Star rating component
- [ ] Rating display on posts
- [ ] Review list UI

### Week 2: Recipe Variations
- [ ] Database migration for variations
- [ ] Fork recipe API
- [ ] Variation UI in post view
- [ ] Create variation flow
- [ ] Variation tree display

### Week 3: Video Upload
- [ ] Video upload backend
- [ ] Cloud storage integration
- [ ] Video player component
- [ ] Thumbnail handling
- [ ] Mobile video optimization

### Week 4: Advanced Search
- [ ] Search filter backend
- [ ] Filter UI components
- [ ] Autocomplete
- [ ] Saved searches
- [ ] Search analytics

---

## Testing Checklist

### Ratings & Reviews
- [ ] Create rating for a recipe
- [ ] Update existing rating
- [ ] Delete rating
- [ ] View all ratings for a recipe
- [ ] Verify average rating calculation
- [ ] Test rating validation (1-5)
- [ ] Test one rating per user constraint

### Recipe Variations
- [ ] Fork a recipe
- [ ] Edit variation
- [ ] View variations of original
- [ ] Track variation chain
- [ ] Delete variation
- [ ] Test permissions

### Video Upload
- [ ] Upload video (various formats)
- [ ] Test file size limits
- [ ] Verify thumbnail generation
- [ ] Test video playback
- [ ] Mobile video player
- [ ] Video deletion

### Search & Filters
- [ ] Filter by category
- [ ] Filter by tags
- [ ] Filter by time ranges
- [ ] Filter by difficulty
- [ ] Filter by rating
- [ ] Combine multiple filters
- [ ] Sort results
- [ ] Search autocomplete

---

## Technical Stack

**Backend:**
- Express + TypeScript
- Prisma ORM
- PostgreSQL
- Multer (file uploads)
- AWS S3 / Cloudinary (video storage)
- FFmpeg (video processing - optional)

**Frontend:**
- Vue 3 + TypeScript
- Video.js or Plyr (video player)
- Chart.js (nutrition charts)
- Voice recognition API (cooking mode)

---

## Success Metrics

- Users can rate and review recipes
- Average rating visible on all posts
- Users can create recipe variations
- Video uploads working smoothly
- Advanced search improves discoverability
- Shopping list increases user engagement
- Cooking mode improves user experience

---

**Current Status:** Planning Complete ✅
**Next Step:** Begin implementation with Ratings & Reviews system
