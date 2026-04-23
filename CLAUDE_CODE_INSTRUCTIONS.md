# Instructions for Claude Code

## 🎯 Your Mission
Migrate a React + JavaScript + Sanity.io project to Vue 3 + TypeScript + Tailwind CSS + Laravel/PHP.

---

## 📖 CRITICAL: Read These Files First

**BEFORE YOU START CODING**, you MUST read these files in order:

1. **`/readme/code-style.md`** - Your coding style guidelines (MANDATORY)
2. **`/readme/ai-prompts.md`** - Any specific AI instructions
3. **`MIGRATION_PLAN.md`** - Detailed migration strategy
4. **`MIGRATION_CHECKLIST.md`** - Step-by-step checklist

> ⚠️ **DO NOT skip reading these files**. They contain critical information about how Dave wants his code written.

---

## 🚀 Quick Start

### Step 1: Initial Analysis
```bash
# Explore the existing React project
tree -L 3 -I 'node_modules|.git' > project-structure.txt

# Document what you find:
# - List all React components
# - List all Sanity.io schemas
# - List all routes
# - Note any complex state management
# - Identify external dependencies
```

### Step 2: Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Create Laravel backend in `/backend`
- Create Vue 3 frontend in `/frontend`
- Install all dependencies
- Create basic directory structure

### Step 3: Follow the Checklist
Open `MIGRATION_CHECKLIST.md` and work through it systematically, marking each item complete as you go.

---

## 💡 Key Principles

### Code Style
- **ALWAYS** apply Dave's code style from `/readme/code-style.md`
- Use consistent naming conventions
- Write self-documenting code
- Add comments only for complex logic

### TypeScript
- **STRICT MODE** - No `any` types allowed
- Define interfaces for all data structures
- Use type guards where needed
- Leverage Vue's type helpers

### Vue 3 Best Practices
- Use **Composition API** with `<script setup>`
- Prefer `ref()` and `computed()` over reactive()
- Create composables for reusable logic
- Use TypeScript with proper prop types

### Component Structure
```vue
<script setup lang="ts">
// Imports
import { ref, computed } from 'vue'

// Types/Interfaces
interface Props {
  // ...
}

// Props & Emits
const props = defineProps<Props>()
const emit = defineEmits<{...}>()

// Composables
const store = useStore()

// Local State
const state = ref()

// Computed
const computed = computed(() => ...)

// Methods
function handleAction() {...}

// Lifecycle
onMounted(() => {...})
</script>

<template>
  <!-- Template with Tailwind classes -->
</template>

<style scoped>
/* Minimal scoped styles, prefer Tailwind */
</style>
```

---

## 🔄 Migration Pattern

### React → Vue Conversion Map

| React | Vue 3 |
|-------|-------|
| `className` | `class` |
| `onClick` | `@click` |
| `onChange` | `@change` or `v-model` |
| `useState()` | `ref()` |
| `useEffect()` | `watch()` or `watchEffect()` |
| `useMemo()` | `computed()` |
| `useCallback()` | Store in `const` or `computed()` |
| `useContext()` | `inject()` or Pinia store |
| `useRef()` | `ref()` (template ref) |
| Props destructuring | Use `props.propName` |
| JSX | Template syntax |

### Example Conversion

**React:**
```jsx
const MyComponent = ({ title, onSubmit }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log(count);
  }, [count]);
  
  return (
    <div className="container">
      <h1>{title}</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
};
```

**Vue 3:**
```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  title: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: []
}>()

const count = ref(0)

watch(count, (newCount) => {
  console.log(newCount)
})

function handleSubmit() {
  emit('submit')
}
</script>

<template>
  <div class="container">
    <h1>{{ title }}</h1>
    <button @click="count++">
      Count: {{ count }}
    </button>
  </div>
</template>
```

---

## 🗄️ Database Migration

### Sanity Schema → Laravel Model

**Sanity Schema Example:**
```javascript
export default {
  name: 'post',
  type: 'document',
  fields: [
    {name: 'title', type: 'string'},
    {name: 'slug', type: 'slug'},
    {name: 'body', type: 'blockContent'},
    {name: 'publishedAt', type: 'datetime'},
  ]
}
```

**Laravel Migration:**
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('slug')->unique();
    $table->longText('body');
    $table->timestamp('published_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

**Laravel Model:**
```php
class Post extends Model
{
    use HasFactory, SoftDeletes;
    
    protected $fillable = [
        'title',
        'slug',
        'body',
        'published_at',
    ];
    
    protected $casts = [
        'published_at' => 'datetime',
    ];
}
```

---

## 🎨 Tailwind Migration Strategy

### Extract Design Tokens First

1. **Colors**: Look for color values in CSS/styled-components
2. **Typography**: Font families, sizes, weights, line-heights
3. **Spacing**: Margins, paddings, gaps
4. **Shadows**: Box-shadow values
5. **Borders**: Border radius, widths

### Configure Tailwind

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          // ... rest of scale
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        // ... rest of scale
      },
    },
  },
}
```

### Converting Styles

**Before (CSS Module):**
```css
.card {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

**After (Tailwind):**
```vue
<div class="bg-white rounded-lg p-6 shadow-md">
  <!-- content -->
</div>
```

---

## 🔌 API Integration Pattern

### 1. Define Types
```typescript
// src/types/models.ts
export interface Post extends Model {
  title: string
  slug: string
  body: string
  published_at: string | null
}
```

### 2. Create Service
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
}
```

### 3. Create Pinia Store
```typescript
// src/stores/posts.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postsService } from '@/services/posts.service'
import type { Post } from '@/types/models'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPosts() {
    loading.value = true
    error.value = null
    try {
      const response = await postsService.getAll()
      posts.value = response.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return { posts, loading, error, fetchPosts }
})
```

### 4. Use in Component
```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { usePostsStore } from '@/stores/posts'

const postsStore = usePostsStore()

onMounted(() => {
  postsStore.fetchPosts()
})
</script>

<template>
  <div>
    <div v-if="postsStore.loading">Loading...</div>
    <div v-else-if="postsStore.error">{{ postsStore.error }}</div>
    <div v-else>
      <article v-for="post in postsStore.posts" :key="post.id">
        <h2>{{ post.title }}</h2>
      </article>
    </div>
  </div>
</template>
```

---

## 🧪 Testing As You Go

After migrating each component:

1. **Visual Check**: Does it look right?
2. **Functionality Check**: Does it work?
3. **TypeScript Check**: `npm run type-check`
4. **Console Check**: No errors or warnings?
5. **Responsive Check**: Does it work on mobile?

---

## 📝 Documentation Guidelines

### Code Comments
```typescript
// ❌ BAD: Obvious comment
// Loop through posts
posts.forEach(post => ...)

// ✅ GOOD: Explains WHY
// Filter out draft posts to prevent SEO indexing
const published = posts.filter(p => p.status === 'published')
```

### Component Documentation
```vue
<script setup lang="ts">
/**
 * PostCard Component
 * 
 * Displays a post in card format with image, title, excerpt, and metadata.
 * Supports both grid and list layouts.
 * 
 * @emits click - Fired when card is clicked, passes post object
 */

interface Props {
  post: Post
  layout?: 'grid' | 'list' // Default: 'grid'
}
</script>
```

---

## ⚠️ Common Pitfalls to Avoid

### 1. Don't Destructure Props
```typescript
// ❌ BAD: Loses reactivity
const { title } = props

// ✅ GOOD
const title = computed(() => props.title)
// OR just use props.title directly in template
```

### 2. Don't Mutate Props
```typescript
// ❌ BAD
props.items.push(newItem)

// ✅ GOOD
emit('update:items', [...props.items, newItem])
```

### 3. Don't Forget Error Handling
```typescript
// ❌ BAD
async function fetchData() {
  const response = await api.get('/data')
  data.value = response.data
}

// ✅ GOOD
async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const response = await api.get('/data')
    data.value = response.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch'
    console.error('Fetch error:', e)
  } finally {
    loading.value = false
  }
}
```

### 4. Don't Use `any` Type
```typescript
// ❌ BAD
const data: any = await api.get('/data')

// ✅ GOOD
interface ApiData {
  id: number
  name: string
}
const data: ApiData = await api.get('/data')
```

---

## 🎯 Progress Tracking

Create a `PROGRESS.md` file and update it as you complete each phase:

```markdown
# Migration Progress

## Phase 1: Backend Setup ✅
- [x] Laravel installed
- [x] Models created: Post, Category
- [x] Migrations run
- [x] Seeders created
- [x] API endpoints tested

## Phase 2: Frontend Setup 🔄
- [x] Vue project created
- [x] Dependencies installed
- [ ] Router configured
- [ ] Pinia stores created
- [ ] Components migrated: 3/15

## Phase 3: Component Migration ⬜
...
```

---

## 🆘 When You're Stuck

1. **Check the error message** - Read it carefully
2. **Check the docs** - Vue, Laravel, TypeScript
3. **Check Dave's code style guide** - Does it have guidance?
4. **Log the issue** - Create a detailed error report
5. **Try a simpler approach** - Break it down further

---

## ✅ Definition of Done

A task is complete when:
- [ ] Code follows Dave's style guide
- [ ] TypeScript has no errors
- [ ] Component renders correctly
- [ ] Functionality works as expected
- [ ] No console errors
- [ ] Responsive on all screen sizes
- [ ] Loading/error states implemented
- [ ] Code is commented where needed

---

## 🎓 Learning Resources

While working, you may reference:
- [Vue 3 Docs](https://vuejs.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Laravel Docs](https://laravel.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Pinia Docs](https://pinia.vuejs.org)

---

## 🚦 Ready to Start?

Your workflow:
1. ✅ Read `/readme/code-style.md` and `/readme/ai-prompts.md`
2. ✅ Read `MIGRATION_PLAN.md` fully
3. ✅ Run `./setup.sh`
4. ✅ Open `MIGRATION_CHECKLIST.md`
5. ✅ Start with Phase 1, checking off items as you go
6. ✅ Create `PROGRESS.md` to track your work
7. ✅ Commit frequently with clear commit messages
8. ✅ Test each component after migration

---

**Remember**: Quality over speed. Dave wants clean, maintainable code following his style guide.

**Good luck! 🚀**
