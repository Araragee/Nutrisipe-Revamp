# Recipe Variations/Forks Feature Guide

## Overview

The Recipe Variations/Forks feature allows users to create their own versions of existing recipes, similar to GitHub forks. Each variation maintains a link to its original recipe and tracks the full lineage chain.

## ✅ Implementation Status: COMPLETE

### Database Schema ✅
- **RecipeVariation Model**: Tracks variation relationships
- **Post Model Updates**: Added `isVariation` and `variationCount` fields
- **Migration Applied**: `20260120054841_add_recipe_variations`

### Backend Implementation ✅

#### Routes (`/api/variations`)
- `POST /:postId/fork` - Fork a recipe
- `GET /:postId/variations` - Get all variations of a recipe
- `GET /:postId/original` - Get original recipe if this is a variation
- `GET /:postId/chain` - Get full variation lineage
- `DELETE /:variationId` - Delete variation relationship

#### Files Created
- `backend/src/routes/variations.ts`
- `backend/src/controllers/variationsController.ts`
- `backend/src/services/variationService.ts`
- Updated: `backend/src/services/notificationService.ts` (added 'variation' type)
- Updated: `backend/src/index.ts` (registered routes)

### Frontend Implementation ✅

#### HTTP Endpoints
- `src/http/endpoints/variations.ts` - API client

#### Pinia Store
- `src/stores/variations.ts` - State management for variations

#### Vue Components
1. **ForkRecipeButton.vue** - Button to trigger forking
2. **ForkRecipeModal.vue** - Modal for creating variations with form
3. **VariationsList.vue** - Grid display of all variations
4. **VariationChain.vue** - Lineage visualization
5. **OriginalRecipeBadge.vue** - Badge showing original recipe link

All components exported via `src/components/variations/index.ts`

---

## 🎯 Key Features

### 1. Fork Recipe
- Create a variation of any recipe (except your own)
- Copy original recipe data with optional modifications
- Add description of what changed
- Automatically notifies original creator

### 2. Variation Tracking
- View all variations of a recipe in a grid layout
- See variation statistics (likes, comments, saves)
- Filter and paginate through variations

### 3. Lineage Chain
- Visualize the full evolution of a recipe
- See generation depth (Original → Fork 1 → Fork 2...)
- Track all contributors in the chain
- Navigate between generations

### 4. Original Recipe Link
- Badge displayed on variation pages
- Quick navigation back to original
- Shows variation description

---

## 📖 Usage Guide

### For Users

#### Creating a Variation (Frontend Integration)

```vue
<script setup>
import { ref } from 'vue'
import { ForkRecipeButton, ForkRecipeModal } from '@/components/variations'

const showForkModal = ref(false)
const currentPost = ref({ id: 'post-123', title: 'Original Recipe', ... })

const handleForkSuccess = (variation) => {
  console.log('Variation created:', variation)
  // Navigate to new variation or show success message
}
</script>

<template>
  <div>
    <!-- Fork Button -->
    <ForkRecipeButton
      :post-id="currentPost.id"
      @fork="showForkModal = true"
    />

    <!-- Fork Modal -->
    <ForkRecipeModal
      v-model="showForkModal"
      :post-id="currentPost.id"
      :original-recipe="currentPost"
      @success="handleForkSuccess"
    />
  </div>
</template>
```

#### Displaying Variations

```vue
<script setup>
import { VariationsList } from '@/components/variations'
</script>

<template>
  <VariationsList :post-id="postId" />
</template>
```

#### Showing Lineage

```vue
<script setup>
import { VariationChain } from '@/components/variations'
</script>

<template>
  <VariationChain :post-id="postId" />
</template>
```

#### Original Recipe Badge

```vue
<script setup>
import { OriginalRecipeBadge } from '@/components/variations'
</script>

<template>
  <!-- Automatically shows only if post is a variation -->
  <OriginalRecipeBadge :post-id="postId" />
</template>
```

### For Developers

#### Using the Variations Store

```typescript
import { useVariationsStore } from '@/stores/variations'

const variationsStore = useVariationsStore()

// Fork a recipe
await variationsStore.forkRecipe('post-123', {
  title: 'My Vegan Version',
  description: 'A plant-based take on the original',
  variationDescription: 'Replaced eggs with flax eggs',
  recipeData: {
    servings: 4,
    prepTime: 20,
    difficulty: 'easy'
  }
})

// Get variations
const { variations, pagination } = await variationsStore.getVariations('post-123')

// Get variation chain
const { chain, depth } = await variationsStore.getVariationChain('post-123')

// Get original recipe
const original = await variationsStore.getOriginalRecipe('post-123')
```

#### Using the API Directly

```typescript
import { variationsEndpoints } from '@/http/endpoints/variations'

// Fork recipe
const result = await variationsEndpoints.forkRecipe('post-123', {
  title: 'My Version',
  variationDescription: 'Added more spices',
  recipeData: { servings: 6 }
})

// Get variations with pagination
const variations = await variationsEndpoints.getVariations('post-123', 1, 20)

// Get chain
const chain = await variationsEndpoints.getVariationChain('post-123')

// Delete variation
await variationsEndpoints.deleteVariation('variation-id')
```

---

## 🔧 Technical Details

### Database Schema

```prisma
model RecipeVariation {
  id              String   @id @default(uuid())
  originalPostId  String   @map("original_post_id")
  variationPostId String   @unique @map("variation_post_id")
  userId          String   @map("user_id")
  description     String?  @db.Text
  createdAt       DateTime @default(now())

  originalPost    Post     @relation("OriginalPost", ...)
  variationPost   Post     @relation("VariationPost", ...)
  user            User     @relation(...)
}

model Post {
  // ... existing fields
  isVariation         Boolean             @default(false)
  variationCount      Int                 @default(0)
  originalVariations  RecipeVariation[]   @relation("OriginalPost")
  variationOf         RecipeVariation?    @relation("VariationPost")
}
```

### Business Rules

1. **Cannot fork own recipes** - Prevents self-forking
2. **Only recipes can be forked** - Post must have a recipe
3. **Automatic counting** - `variationCount` updated via transactions
4. **Notification system** - Original creator notified on fork
5. **Cascade deletion** - Variations deleted with original post
6. **Orphan handling** - Deleting variation relationship keeps the post

### Component Architecture

```
variations/
├── ForkRecipeButton.vue      # Trigger button (reusable)
├── ForkRecipeModal.vue        # Fork form (with validation)
├── VariationsList.vue         # Grid display with pagination
├── VariationChain.vue         # Lineage visualization
├── OriginalRecipeBadge.vue    # Original recipe link
└── index.ts                   # Exports
```

---

## 🎨 UI/UX Features

### ForkRecipeButton
- Three variants: primary, secondary, outline
- Loading states
- Disabled states
- Custom labels

### ForkRecipeModal
- Form validation
- Pre-filled with original data
- Optional field modifications
- Real-time validation
- Error handling
- Success callbacks

### VariationsList
- Responsive grid layout
- Hover effects
- Variation badges
- User avatars
- Statistics (likes, comments, saves)
- Pagination (Load More)
- Empty states
- Loading states

### VariationChain
- Generation badges
- Connector arrows
- Current post highlighting
- Original badge
- Contributors avatar stack
- Evolution summary
- Click-to-navigate

### OriginalRecipeBadge
- Gradient background
- Click-to-navigate
- Variation description display
- Author information
- Auto-hide if not a variation

---

## 🚀 Next Steps

To integrate this feature into your app:

1. **Add to Recipe Detail Page**
   ```vue
   <OriginalRecipeBadge :post-id="recipe.id" />
   <ForkRecipeButton :post-id="recipe.id" @fork="showModal = true" />
   <ForkRecipeModal v-model="showModal" :post-id="recipe.id" />
   <VariationsList :post-id="recipe.id" />
   ```

2. **Add to Recipe Actions**
   - Include fork button alongside like, save, share

3. **Add Variations Tab**
   - Create tab in recipe view for variations
   - Show both list and chain views

4. **Add to User Profile**
   - Show user's created variations
   - Track variation creation stats

5. **Add to Feed**
   - Show "X forked Y's recipe" activities
   - Display variation badges on posts

6. **Add to Search/Explore**
   - Filter by original vs variations
   - Search within variation chains

---

## 🔒 Security & Validation

- ✅ Authentication required for forking
- ✅ Authorization checks (can't fork own recipes)
- ✅ Input validation on all fields
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention (Vue escaping)
- ✅ Rate limiting recommended for fork endpoint

---

## 📊 Performance Considerations

- Variation counts cached on Post model
- Pagination implemented (default 20 per page)
- Efficient chain traversal (iterative, not recursive)
- Indexed foreign keys for fast lookups
- Transaction-based operations for consistency

---

## 🐛 Error Handling

All components handle:
- Network errors
- 404 (recipe not found)
- 403 (unauthorized)
- 400 (validation errors)
- Loading states
- Empty states

---

## 📝 Example Use Cases

1. **Dietary Adaptations**
   - Original: Chocolate Cake
   - Variation 1: Vegan Chocolate Cake
   - Variation 2: Gluten-Free Vegan Chocolate Cake

2. **Regional Variations**
   - Original: Italian Pasta Carbonara
   - Variation 1: Japanese-Style Carbonara
   - Variation 2: Fusion Carbonara with Miso

3. **Skill Level Adaptations**
   - Original: Professional Croissants
   - Variation 1: Simplified Croissants
   - Variation 2: Beginner-Friendly Croissants

4. **Ingredient Substitutions**
   - Original: Traditional Pesto
   - Variation 1: Nut-Free Pesto
   - Variation 2: Vegan Nut-Free Pesto

---

## 🎉 Feature Complete!

All components, stores, services, and routes are implemented and ready to use. The feature supports:

- ✅ Creating variations with full customization
- ✅ Viewing all variations of a recipe
- ✅ Tracking full lineage chains
- ✅ Linking back to original recipes
- ✅ Notifications for creators
- ✅ Statistics and engagement metrics
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Accessibility features

**Ready for integration into your Nutrisipe application!** 🚀
