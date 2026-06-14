import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Discover' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true, title: 'Sign In' },
    },
    {
      path: '/register',
      name: 'register',
      redirect: (to) => ({ path: '/login', query: { ...to.query, mode: 'signup' } }),
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { requiresAuth: true, title: 'Welcome' },
    },
    {
      path: '/profile/:userId',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true, title: 'Profile' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true, title: 'Settings' },
    },
    {
      path: '/explore',
      name: 'explore',
      component: () => import('@/views/ExploreView.vue'),
      meta: { requiresAuth: true, title: 'Explore Recipes' },
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('@/views/MessagesView.vue'),
      meta: { requiresAuth: true, title: 'Messages' },
    },
    {
      path: '/recipes',
      name: 'recipes',
      redirect: { name: 'home', query: { scope: 'all' } }
    },

    {
      path: '/recipes/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue'),
      meta: { title: 'Recipe' },
    },
    {
      path: '/recipes/:id/edit',
      name: 'recipe-edit',
      component: () => import('@/views/RecipeEditView.vue'),
      meta: { requiresAuth: true, title: 'Edit Recipe' },
    },
    {
      path: '/recipes/:id/variations/compare',
      name: 'recipe-variation-compare',
      component: () => import('@/views/VariationView.vue'),
      meta: { title: 'Compare Variations' },
    },
    {
      path: '/users/:id',
      name: 'user-profile',
      redirect: to => ({ name: 'profile', params: { userId: to.params.id } })
    },
    {
      path: '/saved',
      name: 'saved-recipes',
      component: () => import('@/views/SavedRecipesView.vue'),
      meta: { requiresAuth: true, title: 'Saved Recipes' },
    },
    {
      path: '/plan',
      name: 'meal-plan',
      component: () => import('@/views/MealPlanView.vue'),
      meta: { requiresAuth: true, title: 'Meal Plan' },
    },
    {
      path: '/groceries',
      name: 'grocery-list',
      component: () => import('@/views/GroceryView.vue'),
      meta: { requiresAuth: true, title: 'Shopping List' },
    },
    {
      path: '/collections/:id',
      name: 'collection-detail',
      component: () => import('@/views/CollectionDetailView.vue'),
      meta: { requiresAuth: true, title: 'Collection' },
    },
    {
      path: '/following',
      name: 'following-feed',
      redirect: { name: 'home', query: { scope: 'following' } }
    },
    {
      path: '/ingredients',
      name: 'ingredients',
      component: () => import('@/views/IngredientsView.vue'),
      meta: { requiresAdmin: true, title: 'Nutrition Database' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/AdminDashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Admin Command Center' },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/admin/AdminUsersView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Citizen Management' },
    },
    {
      path: '/admin/reports',
      name: 'admin-reports',
      component: () => import('@/views/admin/AdminReportsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Content Moderation' },
    },
    {
      path: '/admin/analytics',
      name: 'admin-analytics',
      component: () => import('@/views/admin/AdminAnalyticsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true, title: 'Platform Insights' },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth to be initialized if it hasn't been yet
  if (!authStore.isInitialized) {
    await authStore.fetchUser()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'home' })
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'home' })
  } else {
    next()
  }
})

router.afterEach((to) => {
  const baseTitle = 'Nutrisipe — Share, Discover, and Plan Recipes'
  const sectionTitle = to.meta.title as string
  document.title = sectionTitle ? `${sectionTitle} | Nutrisipe` : baseTitle
})

export default router
