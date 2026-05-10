<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usersApi } from '@/http/endpoints/users'
import { useAuthStore } from '@/stores/auth'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import PinGrid from '@/components/feed/PinGrid.vue'
import PinSkeleton from '@/components/feed/PinSkeleton.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'
import type { Post } from '@/typescript/interface/Post'

const router = useRouter()
const authStore = useAuthStore()
const { isNearBottom } = useInfiniteScroll()

const posts = ref<Post[]>([])
const isLoading = ref(true)
const hasMore = ref(true)
const page = ref(1)
const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

async function fetchSavedPosts(reset = false) {
  if (!authStore.user?.id) return
  if (isLoading.value && !reset) return

  isLoading.value = true
  if (reset) {
    page.value = 1
    posts.value = []
    hasMore.value = true
  }

  try {
    const response = await usersApi.getSavedPosts(authStore.user.id, page.value, 20)

    // The endpoint returns Post objects (sometimes nested in a Save object, let's map if needed)
    // Based on backend usersController.getSavedPostsHandler, it usually returns the posts directly or mapped
    const newPosts = response.data.data.map((item: any) => item.post || item)

    if (reset) {
      posts.value = newPosts
    } else {
      posts.value.push(...newPosts)
    }
    hasMore.value = page.value < response.data.pagination.totalPages
    page.value++
  } catch (error) {
    console.error('Failed to load saved posts:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  fetchSavedPosts(true)
})

watch(isNearBottom, (near) => {
  if (near && !isLoading.value && hasMore.value) {
    fetchSavedPosts()
  }
})
</script>

<template>
  <div class="saved-recipes-view min-h-screen pt-8">

    <div class="px-8 py-6">
      <div class="mb-8">
        <h2 class="font-montserrat font-extrabold text-2xl tracking-tight mb-1">
          Saved Recipes
        </h2>
        <p class="text-text-dim text-sm">Your personal collection of healthy inspirations.</p>
      </div>

      <PinGrid
        v-if="posts.length > 0"
        :posts="posts"
        @post-click="handlePostClick"
      />

      <div
        v-if="isLoading"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-4"
      >
        <PinSkeleton v-for="i in 5" :key="i" />
      </div>

      <div
        v-if="!isLoading && posts.length === 0"
        class="flex flex-col items-center justify-center py-24 text-center"
      >
        <span class="text-5xl mb-6">🔖</span>
        <h3 class="text-xl font-bold mb-2">No saved recipes yet</h3>
        <p class="text-text-dim max-w-xs mx-auto">
          Tap the heart on any recipe you love to save it to your collection.
        </p>
        <router-link to="/" class="mt-6 btn-primary px-8">
          Discover Recipes
        </router-link>
      </div>
    </div>

    <!-- Post Detail Modal -->
    <RecipeModal
      :post-id="selectedPostId"
      :show="showPostModal"
      @close="showPostModal = false"
    />
  </div>
</template>
