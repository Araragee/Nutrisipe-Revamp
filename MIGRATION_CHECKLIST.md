# Migration Checklist for Claude Code

## 📋 Pre-Migration
- [ ] Read `/readme/code-style.md` file
- [ ] Read `/readme/ai-prompts.md` file
- [ ] Document current React project structure
- [ ] List all components (create inventory)
- [ ] List all Sanity schemas
- [ ] Document current routes
- [ ] Extract design tokens (colors, typography, spacing)

---

## 🔧 Phase 1: Backend Setup (Laravel)
- [ ] Create Laravel project in `/backend` directory
- [ ] Configure `.env` file with database credentials
- [ ] Install Laravel Sanctum for API auth
- [ ] Configure CORS settings

### For Each Sanity Content Type:
- [ ] Create Model: `php artisan make:model [Name] -mcr`
- [ ] Write migration with proper schema
- [ ] Create API Resource for JSON transformation
- [ ] Create Controller with CRUD methods
- [ ] Add API routes in `routes/api.php`
- [ ] Create Seeder with sample/migrated data

### Data Migration:
- [ ] Export data from Sanity
- [ ] Transform Sanity JSON to Laravel-compatible format
- [ ] Create seeders for each content type
- [ ] Run migrations and seeders
- [ ] Verify data in database

### API Testing:
- [ ] Test GET all items endpoint
- [ ] Test GET single item endpoint
- [ ] Test POST create endpoint
- [ ] Test PUT/PATCH update endpoint
- [ ] Test DELETE endpoint

---

## 🎨 Phase 2: Frontend Setup (Vue 3)
- [ ] Create Vue + TypeScript project in `/frontend` directory
- [ ] Install dependencies (vue-router, pinia, axios, vueuse, dayjs)
- [ ] Install and configure Tailwind CSS
- [ ] Configure TypeScript (strict mode)
- [ ] Setup path aliases (`@/` → `src/`)
- [ ] Configure Vite for development

### Project Structure:
- [ ] Create folder structure (components, composables, views, stores, services, types, utils, router)
- [ ] Setup main.css with Tailwind directives
- [ ] Configure Tailwind with design tokens
- [ ] Create global type definitions
- [ ] Setup router with basic routes
- [ ] Setup Pinia store instance

---

## 🔄 Phase 3: API Service Layer
- [ ] Create `src/services/api.ts` with axios instance
- [ ] Configure base URL and headers
- [ ] Create service file for each resource (e.g., `posts.service.ts`)
- [ ] Define TypeScript interfaces for API responses
- [ ] Implement error handling
- [ ] Add request/response interceptors if needed

---

## 📦 Phase 4: State Management (Pinia)
For each data type:
- [ ] Create Pinia store in `src/stores/`
- [ ] Define state with proper TypeScript types
- [ ] Create getters (computed properties)
- [ ] Create actions for API calls
- [ ] Add error handling in actions
- [ ] Add loading states

---

## 🧩 Phase 5: Component Migration

### Types First:
- [ ] Create `src/types/models.ts` with all data interfaces
- [ ] Create `src/types/api.ts` with API response types
- [ ] Create component prop types

### Shared Components (migrate these first):
- [ ] Button component
- [ ] Card component
- [ ] Input/Form components
- [ ] Navigation component
- [ ] Footer component
- [ ] Layout components
- [ ] Loading/Spinner components
- [ ] Error display components

### Content Components:
- [ ] Map each React component to Vue equivalent
- [ ] Convert React hooks to Vue composables
- [ ] Replace `className` with `class`
- [ ] Replace `onClick` with `@click`
- [ ] Convert inline styles to Tailwind classes
- [ ] Add TypeScript types to props
- [ ] Add proper emits definitions

### Composables (React Hooks → Vue):
- [ ] Create composable for each React custom hook
- [ ] Use `ref()`, `reactive()`, `computed()`, `watch()`
- [ ] Export composable functions
- [ ] Add TypeScript return types

---

## 🛣️ Phase 6: Routing
- [ ] Setup Vue Router in `src/router/index.ts`
- [ ] Create route for each page
- [ ] Add lazy loading for routes
- [ ] Setup route guards if needed
- [ ] Configure scroll behavior
- [ ] Add 404 page
- [ ] Test all navigation

---

## 📄 Phase 7: Views/Pages
For each page:
- [ ] Create view component in `src/views/`
- [ ] Import necessary components
- [ ] Connect to Pinia store
- [ ] Fetch data on mount
- [ ] Add loading states
- [ ] Add error handling
- [ ] Style with Tailwind
- [ ] Test responsiveness

---

## 🎨 Phase 8: Styling
- [ ] Migrate color palette to Tailwind config
- [ ] Migrate typography scale
- [ ] Migrate spacing scale
- [ ] Convert CSS Modules/Styled Components to Tailwind
- [ ] Add custom CSS only when necessary
- [ ] Use `@apply` for repeated patterns
- [ ] Test responsive breakpoints
- [ ] Test dark mode (if applicable)

---

## ✅ Phase 9: Testing & Quality
- [ ] Check TypeScript - no errors
- [ ] Check for `any` types - replace with proper types
- [ ] Run ESLint and fix issues
- [ ] Remove unused imports
- [ ] Remove console.logs (except intentional debugging)
- [ ] Test all forms and user interactions
- [ ] Test error states
- [ ] Test loading states
- [ ] Test empty states
- [ ] Test with different screen sizes

### Functional Testing:
- [ ] Test homepage loads
- [ ] Test all navigation links
- [ ] Test dynamic routes with IDs/slugs
- [ ] Test data fetching and display
- [ ] Test filtering/sorting (if applicable)
- [ ] Test pagination (if applicable)
- [ ] Test search (if applicable)
- [ ] Test forms submission (if applicable)

---

## 🚀 Phase 10: Optimization
- [ ] Enable route lazy loading
- [ ] Optimize images (use appropriate formats)
- [ ] Add loading="lazy" to images
- [ ] Minimize bundle size
- [ ] Enable production mode in Laravel
- [ ] Configure Laravel caching
- [ ] Add meta tags for SEO
- [ ] Test Lighthouse score

---

## 📝 Phase 11: Documentation
- [ ] Update README with new setup instructions
- [ ] Document environment variables
- [ ] Document API endpoints
- [ ] Document component props and events
- [ ] Add inline code comments for complex logic
- [ ] Create changelog of migration changes

---

## 🎯 Phase 12: Final Review
- [ ] **Code Style**: All files follow `code-style.md` guidelines
- [ ] **TypeScript**: Strict mode, no `any` types
- [ ] **Consistency**: Naming conventions consistent
- [ ] **Performance**: No unnecessary re-renders
- [ ] **Accessibility**: Proper ARIA labels, keyboard navigation
- [ ] **Responsive**: Works on mobile, tablet, desktop
- [ ] **Error Handling**: All API calls have try-catch
- [ ] **Loading States**: All async operations show loading
- [ ] **Build**: `npm run build` succeeds without errors
- [ ] **Production Ready**: Environment variables configured

---

## 🎬 Completion Criteria

✅ **Feature Parity**: All React features work in Vue
✅ **Visual Parity**: Design matches or improves original
✅ **No Errors**: Zero TypeScript errors
✅ **No Warnings**: Zero console warnings
✅ **Clean Code**: Follows code style guide
✅ **Type Safe**: Proper TypeScript throughout
✅ **Performant**: Fast load times
✅ **Responsive**: Works on all devices
✅ **Production Build**: Builds successfully

---

## 🐛 Debugging Checklist

If something doesn't work:
- [ ] Check browser console for errors
- [ ] Check network tab for failed API calls
- [ ] Verify API endpoint URLs are correct
- [ ] Check Laravel logs (`storage/logs/laravel.log`)
- [ ] Verify database connection
- [ ] Check CORS configuration
- [ ] Verify environment variables
- [ ] Check route definitions
- [ ] Verify component imports
- [ ] Check TypeScript errors in terminal

---

## 📂 File Creation Order

1. Backend Models & Migrations
2. Backend Seeders
3. Backend Controllers & Routes
4. Frontend Types
5. Frontend API Services
6. Frontend Pinia Stores
7. Frontend Composables
8. Frontend Shared Components
9. Frontend Views
10. Frontend Router
11. Styling & Polish

---

## 💡 Remember

- **Read code style guide FIRST**
- **Apply code style to EVERY file**
- **Use TypeScript strictly** (no `any`)
- **Composition API only** (`<script setup>`)
- **Test as you go** (don't wait until the end)
- **Commit frequently** (after each major component)
- **Document complex logic** (comments in code)

---

**Status Tracking**: Mark each checkbox as complete with [x]

Current Phase: ⬜ Not Started

---

*Good luck! Take it step by step.* 🚀
