# Project Migration Plan: React + Sanity.io → Vue 3 + TypeScript + Tailwind + Laravel

## 📋 Overview
This document outlines the complete migration strategy for converting your React + JavaScript + Sanity.io project to a modern Vue 3 + TypeScript + Tailwind CSS + Laravel stack.

---

## 🎯 Migration Goals

1. **Frontend**: Migrate from React to Vue 3 with TypeScript
2. **Styling**: Implement Tailwind CSS (maintain existing design system)
3. **Backend**: Replace Sanity.io with Laravel + MySQL/PostgreSQL
4. **Type Safety**: Full TypeScript implementation
5. **Code Style**: Apply your custom coding style throughout

---

## 📁 Project Structure (Target)

```
project-root/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/   # API controllers
│   │   │   └── Requests/      # Form validation
│   │   ├── Models/            # Eloquent models
│   │   └── Services/          # Business logic
│   ├── database/
│   │   ├── migrations/        # Database schema
│   │   └── seeders/          # Sample data
│   ├── routes/
│   │   └── api.php           # API routes
│   └── config/
│
├── frontend/                   # Vue 3 + TypeScript
│   ├── src/
│   │   ├── components/        # Vue components
│   │   ├── composables/       # Vue composables (hooks)
│   │   ├── views/             # Page components
│   │   ├── stores/            # Pinia stores (state management)
│   │   ├── services/          # API service layer
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Helper functions
│   │   ├── router/            # Vue Router config
│   │   └── assets/            # Static assets
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── readme/                     # Your AI prompts and code style
│   ├── ai-prompts.md
│   └── code-style.md
│
└── README.md
```

---

## 🔄 Migration Phases

### **Phase 1: Project Setup & Analysis** ⏱️ ~30 mins

#### 1.1 Analyze Current Project
```bash
# Tasks for Claude Code:
- Review existing React components structure
- Identify Sanity.io schemas and content types
- Map out current routes and pages
- Document current state management approach
- List all external dependencies
- Extract color palette, typography, spacing system
```

#### 1.2 Document Current Features
Create an inventory:
- [ ] List all pages/routes
- [ ] List all components
- [ ] Document data models from Sanity schemas
- [ ] Identify API endpoints needed
- [ ] Note any complex business logic

---

### **Phase 2: Backend Setup (Laravel)** ⏱️ ~2-3 hours

#### 2.1 Initialize Laravel Project
```bash
cd backend
composer create-project laravel/laravel .
composer require laravel/sanctum  # For API authentication
```

#### 2.2 Configure Environment
```bash
# .env configuration
cp .env.example .env
php artisan key:generate

# Database setup
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

#### 2.3 Recreate Sanity Schemas as Laravel Models
For each Sanity content type, create:
```bash
php artisan make:model Post -mcr
# -m = migration, -c = controller, -r = resource controller
```

**Example Migration Pattern:**
```php
// database/migrations/xxxx_create_posts_table.php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('slug')->unique();
    $table->text('excerpt')->nullable();
    $table->longText('content');
    $table->string('featured_image')->nullable();
    $table->enum('status', ['draft', 'published'])->default('draft');
    $table->timestamp('published_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

#### 2.4 Create API Resources
```bash
php artisan make:resource PostResource
php artisan make:resource PostCollection
```

#### 2.5 Setup API Routes
```php
// routes/api.php
Route::prefix('v1')->group(function () {
    Route::apiResource('posts', PostController::class);
    Route::apiResource('categories', CategoryController::class);
    // Add all your content types
});
```

#### 2.6 Configure CORS
```bash
php artisan config:publish cors
```

---

### **Phase 3: Frontend Setup (Vue 3 + TypeScript)** ⏱️ ~1-2 hours

#### 3.1 Initialize Vue Project
```bash
npm create vite@latest frontend -- --template vue-ts
cd frontend
```

#### 3.2 Install Dependencies
```bash
npm install
npm install -D tailwindcss postcss autoprefixer
npm install vue-router@4 pinia
npm install axios
npm install @vueuse/core  # Useful composables
npm install dayjs  # Date handling

# Development tools
npm install -D @typescript-eslint/eslint-plugin
npm install -D @typescript-eslint/parser
npm install -D eslint-plugin-vue
```

#### 3.3 Configure Tailwind CSS
```bash
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Port over your existing design tokens
      colors: {},
      fontFamily: {},
      spacing: {},
    },
  },
  plugins: [],
}
```

```css
/* src/assets/styles/main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your custom base styles */
```

#### 3.4 Configure TypeScript
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### 3.5 Setup Project Structure
```bash
# Create folder structure
mkdir -p src/{components,composables,views,stores,services,types,utils,router}
```

---

### **Phase 4: Data Migration** ⏱️ ~2-4 hours

#### 4.1 Export Data from Sanity
```bash
# In your old project
npx sanity dataset export production backup.tar.gz
```

#### 4.2 Transform & Seed Laravel Database
```php
// database/seeders/DatabaseSeeder.php
public function run(): void
{
    $this->call([
        CategorySeeder::class,
        PostSeeder::class,
        // ... other seeders
    ]);
}
```

Create seeders that transform Sanity data format to Laravel format.

---

### **Phase 5: Component Migration** ⏱️ ~8-12 hours

#### 5.1 Create TypeScript Types
```typescript
// src/types/models.ts
export interface Post {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
```

#### 5.2 Create API Service Layer
```typescript
// src/services/api.ts
import axios, { AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

export default api
```

```typescript
// src/services/posts.service.ts
import api from './api'
import type { Post, PaginatedResponse } from '@/types/models'

export const postsService = {
  async getAll(page = 1): Promise<PaginatedResponse<Post>> {
    const { data } = await api.get('/posts', { params: { page } })
    return data
  },

  async getBySlug(slug: string): Promise<Post> {
    const { data } = await api.get(`/posts/${slug}`)
    return data.data
  },

  async create(post: Partial<Post>): Promise<Post> {
    const { data } = await api.post('/posts', post)
    return data.data
  },

  // ... other methods
}
```

#### 5.3 Setup Pinia Stores
```typescript
// src/stores/posts.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postsService } from '@/services/posts.service'
import type { Post, PaginatedResponse } from '@/types/models'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const publishedPosts = computed(() => 
    posts.value.filter(post => post.status === 'published')
  )

  async function fetchPosts(page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await postsService.getAll(page)
      posts.value = response.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch posts'
    } finally {
      loading.value = false
    }
  }

  async function fetchPostBySlug(slug: string) {
    loading.value = true
    error.value = null
    try {
      currentPost.value = await postsService.getBySlug(slug)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch post'
    } finally {
      loading.value = false
    }
  }

  return {
    posts,
    currentPost,
    loading,
    error,
    publishedPosts,
    fetchPosts,
    fetchPostBySlug,
  }
})
```

#### 5.4 Component Migration Pattern

**React Component → Vue Component:**

```vue
<!-- src/components/PostCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Post } from '@/types/models'

interface Props {
  post: Post
  featured?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  featured: false,
})

const formattedDate = computed(() => {
  // Your date formatting logic
  return new Date(props.post.published_at!).toLocaleDateString()
})

const emit = defineEmits<{
  click: [post: Post]
}>()

function handleClick() {
  emit('click', props.post)
}
</script>

<template>
  <article 
    class="post-card cursor-pointer transition-transform hover:scale-105"
    :class="{ 'featured': featured }"
    @click="handleClick"
  >
    <img 
      v-if="post.featured_image" 
      :src="post.featured_image" 
      :alt="post.title"
      class="w-full h-48 object-cover rounded-t-lg"
    />
    
    <div class="p-6">
      <h3 class="text-2xl font-bold mb-2">{{ post.title }}</h3>
      <p class="text-gray-600 mb-4">{{ post.excerpt }}</p>
      <time class="text-sm text-gray-500">{{ formattedDate }}</time>
    </div>
  </article>
</template>

<style scoped>
.post-card {
  @apply bg-white rounded-lg shadow-md overflow-hidden;
}

.post-card.featured {
  @apply col-span-2 row-span-2;
}
</style>
```

#### 5.5 Create Composables (React Hooks → Vue Composables)
```typescript
// src/composables/usePagination.ts
import { ref, computed } from 'vue'

export function usePagination(initialPage = 1) {
  const currentPage = ref(initialPage)
  const perPage = ref(10)
  const total = ref(0)

  const totalPages = computed(() => Math.ceil(total.value / perPage.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  function nextPage() {
    if (hasNextPage.value) currentPage.value++
  }

  function prevPage() {
    if (hasPrevPage.value) currentPage.value--
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  return {
    currentPage,
    perPage,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
  }
}
```

#### 5.6 Setup Router
```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/posts',
    name: 'posts',
    component: () => import('@/views/PostsView.vue'),
  },
  {
    path: '/posts/:slug',
    name: 'post-detail',
    component: () => import('@/views/PostDetailView.vue'),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

export default router
```

---

### **Phase 6: Styling Migration** ⏱️ ~4-6 hours

#### 6.1 Extract Design Tokens
From your React project, extract:
- Color palette
- Typography system (font families, sizes, weights)
- Spacing scale
- Border radius values
- Shadow definitions
- Breakpoints

#### 6.2 Configure Tailwind with Design System
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#...',
          100: '#...',
          // ... your color scale
        },
        // ... other color schemes
      },
      fontFamily: {
        sans: ['Your Font', 'sans-serif'],
        heading: ['Your Heading Font', 'serif'],
      },
      fontSize: {
        // Your typography scale
      },
      spacing: {
        // Your spacing scale
      },
    },
  },
}
```

#### 6.3 Convert Styled Components/CSS Modules to Tailwind
- Replace inline styles with Tailwind utilities
- Use `@apply` for repeated patterns in `<style>` blocks
- Create component-scoped styles when needed

---

### **Phase 7: Testing & Refinement** ⏱️ ~4-6 hours

#### 7.1 Functionality Checklist
- [ ] All pages render correctly
- [ ] Routing works (including deep links)
- [ ] Data fetching and display
- [ ] Forms work (if applicable)
- [ ] Error handling displays properly
- [ ] Loading states show correctly
- [ ] Responsive design works on all breakpoints

#### 7.2 Performance Optimization
- [ ] Lazy load routes
- [ ] Optimize images
- [ ] Code splitting
- [ ] Enable production mode in Laravel
- [ ] Setup caching strategies

#### 7.3 Code Quality
- [ ] Run ESLint and fix issues
- [ ] Check TypeScript for any `any` types
- [ ] Apply your code style guidelines
- [ ] Remove unused imports
- [ ] Add comments for complex logic

---

### **Phase 8: Deployment Preparation** ⏱️ ~2-3 hours

#### 8.1 Environment Variables
```bash
# frontend/.env.production
VITE_API_URL=https://api.yourdomain.com/api/v1

# backend/.env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
```

#### 8.2 Build Scripts
```json
// frontend/package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit"
  }
}
```

#### 8.3 Laravel Optimization
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

---

## 🛠️ Development Workflow

### Running the Project Locally

**Backend (Laravel):**
```bash
cd backend
php artisan serve
# Runs on http://localhost:8000
```

**Frontend (Vue):**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 📝 Instructions for Claude Code

### Initial Setup Phase
1. Read the `readme/code-style.md` file first to understand coding conventions
2. Review the `readme/ai-prompts.md` for any specific instructions
3. Analyze the existing React project structure
4. Create a detailed component mapping document

### Migration Execution Order
1. **Start with Backend**: Setup Laravel, create models, migrations, and seeders
2. **Data Layer**: Migrate Sanity data to Laravel database
3. **API Layer**: Build API endpoints and test with Postman/Insomnia
4. **Frontend Setup**: Initialize Vue project with all configurations
5. **Core Components**: Migrate reusable components first
6. **Views/Pages**: Migrate page components
7. **Routing**: Setup Vue Router with all routes
8. **State Management**: Implement Pinia stores
9. **Styling**: Apply Tailwind and custom styles
10. **Polish**: Error handling, loading states, animations

### Code Style Application
- Apply the code style rules from `readme/code-style.md` to every file
- Ensure consistent naming conventions
- Follow TypeScript best practices
- Use composition API with `<script setup>` syntax
- Prefer composables over mixins

### Testing Approach
- Test each component individually after migration
- Test API endpoints before frontend integration
- Verify responsive design at each breakpoint
- Check browser console for errors

### Documentation
- Document any deviations from the original design
- Note any improvements made during migration
- Create a changelog of major changes
- Document any new dependencies added

---

## 🚀 Quick Start Commands

```bash
# Clone and setup
git clone <your-repo>
cd project-root

# Backend setup
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Visit http://localhost:5173
```

---

## 📚 Additional Resources

### Documentation
- [Vue 3 Docs](https://vuejs.org/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Laravel Docs](https://laravel.com/docs)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Vue Router Docs](https://router.vuejs.org/)

### Migration Guides
- [React to Vue Migration Guide](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Sanity to Laravel Migration Patterns](https://laravel.com/docs/eloquent)

---

## 🎯 Success Criteria

The migration is complete when:
- ✅ All features from the React app work in Vue
- ✅ Design looks identical (or better)
- ✅ Performance is equivalent or improved
- ✅ No TypeScript errors
- ✅ No console errors or warnings
- ✅ All routes work correctly
- ✅ Data persists correctly in Laravel database
- ✅ Code follows your style guide
- ✅ Project builds successfully for production
- ✅ Responsive design works on mobile/tablet/desktop

---

## 🐛 Common Migration Gotchas

### React → Vue Differences
- `className` → `class`
- `onClick` → `@click`
- `useState` → `ref()` or `reactive()`
- `useEffect` → `watch()` or `watchEffect()`
- `useCallback` → `computed()` for derived values
- Props: no destructuring directly, use `props.propName`
- No JSX by default (use templates or enable JSX)

### Sanity.io → Laravel
- GROQ queries → Eloquent queries
- Sanity References → Laravel Relationships
- Sanity Arrays → JSON columns or pivot tables
- Portable Text → HTML or Markdown in database
- Real-time updates → Consider Laravel Echo + Websockets

### TypeScript Considerations
- Define interfaces for all data models
- Use strict mode
- Avoid `any` type
- Leverage Vue's type helpers (`PropType`, `Ref`, etc.)

---

## 📞 Support

If Claude Code encounters issues:
1. Check the error messages carefully
2. Refer to the official documentation
3. Review your `readme/code-style.md` for guidance
4. Create a detailed error report for review

---

## ✨ Post-Migration Enhancements

Once migration is complete, consider:
- [ ] Add E2E testing (Playwright/Cypress)
- [ ] Setup CI/CD pipeline
- [ ] Add server-side rendering (Nuxt 3) if needed
- [ ] Implement advanced caching strategies
- [ ] Add PWA capabilities
- [ ] Setup analytics
- [ ] Add monitoring (Sentry, etc.)

---

**Good luck with the migration! 🚀**

*Estimated Total Time: 25-40 hours depending on project complexity*
