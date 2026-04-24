<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { useAuthStore } from '@/stores/auth'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import PinGrid from '@/components/feed/PinGrid.vue'
import PinSkeleton from '@/components/feed/PinSkeleton.vue'
import FeedHeader from '@/components/feed/FeedHeader.vue'
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

async function fetchAllRecipes(reset = false) {
  if (isLoading.value && !reset) return

  isLoading.value = true
  if (reset) {
    page.value = 1
    posts.value = []
    hasMore.value = true
  }

  try {
    const response = await postsApi.getFeed(page.value, 20)
    if (reset) {
      posts.value = response.data.data
    } else {
      posts.value.push(...response.data.data)
    }
    hasMore.value = page.value < response.data.pagination.totalPages
    page.value++
  } catch (error) {
    console.error('Failed to load recipes:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAllRecipes(true)
})

watch(isNearBottom, (near) => {
  if (near && !isLoading.value && hasMore.value) {
    fetchAllRecipes()
  }
})
</script>

<template>
  <div class="recipes-view min-h-screen">
    <FeedHeader />

    <div class="px-8 py-6">
      <div class="mb-8">
        <h2 class="font-montserrat font-extrabold text-2xl tracking-tight mb-1">
          All Recipes
        </h2>
        <p class="text-text-dim text-sm">Browse the complete collection of Nutrisipe healthy delights.</p>
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
        <PinSkeleton v-for="i in 10" :key="i" />
      </div>

      <div
        v-if="!isLoading && posts.length === 0"
        class="flex flex-col items-center justify-center py-24 text-center"
      >
        <span class="text-5xl mb-6">🍳</span>
        <h3 class="text-xl font-bold mb-2">No recipes found</h3>
        <p class="text-text-dim max-w-xs mx-auto">
          We couldn't find any recipes at the moment. Try checking back later!
        </p>
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
