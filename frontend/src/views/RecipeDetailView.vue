<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { socialApi } from '@/http/endpoints/social'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import UserAvatar from '@/components/user/UserAvatar.vue'
import FollowButton from '@/components/user/FollowButton.vue'
import PinGrid from '@/components/feed/PinGrid.vue'
import RatingList from '@/components/ratings/RatingList.vue'
import VariationList from '@/components/recipe/VariationList.vue'
import CollectionModal from '@/components/profile/CollectionModal.vue'
import { variationsApi } from '@/http/endpoints/variations'
import { ratingsApi } from '@/http/endpoints/ratings'
import type { Post } from '@/typescript/interface/Post'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const post = ref<Post | null>(null)
const relatedPosts = ref<Post[]>([])
const isLoading = ref(true)
const activeTab = ref('ingredients')
const ratingListRef = ref<any>(null)
const showCollectionModal = ref(false)
const isForking = ref(false)

const postId = computed(() => (Array.isArray(route.params.id) ? route.params.id[0] : route.params.id) as string)
const isOwner = computed(() => authStore.user?.id === post.value?.userId)

const nutritionFacts = computed(() => {
  const n = post.value?.recipe?.nutrition
  return [
    { label: 'Calories', val: n?.calories || '0', unit: 'kcal', icon: '⚡' },
    { label: 'Protein', val: n?.protein || '0', unit: 'g', icon: '💪' },
    { label: 'Carbs', val: n?.carbs || '0', unit: 'g', icon: '🌾' },
    { label: 'Fat', val: n?.fat || '0', unit: 'g', icon: '🥑' },
  ]
})

async function forkRecipe() {
  if (!authStore.isAuthenticated) {
    uiStore.showToast('Please login to fork recipes', 'info')
    return
  }
  if (!post.value) return
  
  isForking.value = true
  try {
    const forkData = {
      title: `${post.value.title} (My version)`,
      description: post.value.description,
      variationDescription: 'Inspired by the original',
      ...post.value.recipe
    }
    const response = await variationsApi.fork(post.value.id, forkData)
    uiStore.showToast('Recipe forked! Redirecting to edit...', 'success')
    router.push(`/recipes/${response.data.data.variationPost.id}/edit`)
  } catch (error) {
    console.error('Failed to fork recipe:', error)
    uiStore.showToast('Failed to fork recipe', 'error')
  } finally {
    isForking.value = false
  }
}

async function loadPost() {
  if (!postId.value) return
  isLoading.value = true
  try {
    const response = await postsApi.getById(postId.value)
    post.value = response.data.data

    // Fetch real related posts
    const relatedRes = await postsApi.getRelated(postId.value)
    relatedPosts.value = relatedRes.data.data
  } catch (error) {
    console.error('Failed to load post:', error)
    uiStore.showToast('Post not found', 'error')
    router.push('/')
  } finally {
    isLoading.value = false
  }
}

async function handleRatingSubmit(data: { rating: number; review?: string }) {
  if (!post.value) return
  try {
    await ratingsApi.createOrUpdateRating(post.value.id, data.rating, data.review)
    uiStore.showToast('Rating submitted!', 'success')
    
    // Refresh post and rating list
    const response = await postsApi.getById(postId.value)
    post.value = response.data.data
    ratingListRef.value?.refresh()
  } catch (error) {
    console.error('Failed to submit rating:', error)
    uiStore.showToast('Failed to submit rating', 'error')
  }
}

async function toggleLike() {
  if (!post.value || !authStore.isAuthenticated) {
    uiStore.showToast('Please sign in to like', 'info')
    return
  }
  const wasLiked = post.value.isLiked
  post.value.isLiked = !wasLiked
  post.value.likeCount += wasLiked ? -1 : 1
  try {
    if (wasLiked) await socialApi.unlikePost(post.value.id)
    else await socialApi.likePost(post.value.id)
  } catch {
    post.value.isLiked = wasLiked
    post.value.likeCount += wasLiked ? 1 : -1
  }
}

async function toggleSave() {
  if (!post.value || !authStore.isAuthenticated) {
    uiStore.showToast('Please sign in to save', 'info')
    return
  }
  const wasSaved = post.value.isSaved
  post.value.isSaved = !wasSaved
  post.value.saveCount += wasSaved ? -1 : 1
  try {
    if (wasSaved) await socialApi.unsavePost(post.value.id)
    else await socialApi.savePost(post.value.id)
  } catch {
    post.value.isSaved = wasSaved
    post.value.saveCount += wasSaved ? 1 : -1
  }
}

onMounted(loadPost)
watch(postId, loadPost)

const recipeImage = computed(() => {
  return post.value?.imageUrl || `https://picsum.photos/800/1000?random=${post.value?.id}`
})
</script>

<template>
  <div class="recipe-detail-view min-h-screen bg-background">
    <div v-if="isLoading" class="flex items-center justify-center py-20">
       <div class="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="post" class="max-w-7xl mx-auto px-6 py-10 md:py-16">
       <div class="flex flex-col lg:flex-row gap-12">
          <!-- Left: Hero Image -->
          <div class="w-full lg:w-1/2 shrink-0">
             <div class="relative rounded-[40px] overflow-hidden shadow-2xl group border-1.5 border-glass-border">
                <img :src="recipeImage" class="w-full object-cover aspect-[4/5]" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                <button
                  @click="toggleLike"
                  class="absolute top-6 right-6 w-14 h-14 rounded-full bg-surface/80 backdrop-blur-xl border border-glass-border flex items-center justify-center text-2xl transition-all active:scale-90"
                  :class="post.isLiked ? 'text-orange shadow-lg shadow-orange/20' : 'text-text-dim'"
                >
                  {{ post.isLiked ? '❤️' : '🤍' }}
                </button>
             </div>
          </div>

          <!-- Right: Details -->
          <div class="flex-1 flex flex-col pt-4">
             <div class="flex items-center gap-3 mb-6">
                <span class="px-4 py-1.5 rounded-full bg-orange text-white text-xs font-bold tracking-widest uppercase">{{ post.category }}</span>
                <div class="flex items-center gap-1.5 text-orange font-bold text-sm">★ {{ post.averageRating?.toFixed(1) || '0.0' }} ({{ post.ratingCount }})</div>
             </div>

             <h1 class="font-montserrat font-extrabold text-4xl md:text-5xl tracking-tight leading-[1.1] mb-8">{{ post.title }}</h1>

             <div class="flex items-center gap-4 p-5 bg-background-secondary rounded-3xl border border-glass-border mb-10">
                <UserAvatar :user="post.user" size="md" class="border-2 border-orange" />
                <div class="flex-1">
                   <p class="font-bold text-[15px]">{{ post.user.displayName }}</p>
                   <p class="text-xs text-text-dim font-bold uppercase tracking-wider">@{{ post.user.username }}</p>
                </div>
                <div v-if="!isOwner">
                  <FollowButton :user-id="post.user.id" :is-following="post.user.isFollowing" />
                </div>
                <button v-else @click="router.push(`/recipes/${post.id}/edit`)" class="btn-secondary py-2.5 px-6 !text-xs">Edit Post</button>
             </div>

             <!-- Nutrition Row -->
             <div class="grid grid-cols-4 gap-4 mb-10">
                <div v-for="n in nutritionFacts" :key="n.label" class="bg-background-secondary/50 rounded-2xl p-4 text-center border border-glass-border">
                   <span class="text-2xl mb-1.5 block">{{ n.icon }}</span>
                   <span class="font-montserrat font-extrabold text-lg block leading-none mb-1">{{ n.val }}</span>
                   <span class="text-[9px] text-text-dim uppercase font-bold tracking-widest">{{ n.label }}</span>
                </div>
             </div>

             <!-- Tabs -->
             <div class="flex gap-10 border-b border-glass-border mb-8">
                <button
                  v-for="t in ['ingredients', 'instructions', 'reviews']"
                  :key="t"
                  @click="activeTab = t"
                  :class="[
                    'pb-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2',
                    activeTab === t ? 'text-orange border-orange' : 'text-text-muted border-transparent hover:text-text'
                  ]"
                >
                  {{ t }}
                </button>
             </div>

             <div class="flex-1 mb-10">
                <div v-if="activeTab === 'ingredients'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <template v-if="post.recipe?.ingredients && post.recipe.ingredients.length > 0">
                     <div v-for="(ing, idx) in post.recipe.ingredients" :key="idx" class="flex items-center gap-4 p-4 bg-background-secondary/30 rounded-2xl border border-glass-border">
                        <div class="w-2.5 h-2.5 rounded-full bg-orange"></div>
                        <span class="text-[15px] font-medium">{{ ing.name }}</span>
                        <span class="ml-auto font-bold text-orange text-sm">{{ ing.quantity }}</span>
                     </div>
                   </template>
                   <div v-else class="col-span-full text-center py-10 text-text-dim italic">No ingredients listed.</div>
                </div>

                <div v-if="activeTab === 'instructions'" class="space-y-8">
                   <template v-if="post.recipe?.instructions && post.recipe.instructions.length > 0">
                     <div v-for="step in post.recipe.instructions" :key="step.step" class="flex gap-6">
                        <div class="w-10 h-10 rounded-full bg-orange text-white font-montserrat font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-orange/30">{{ step.step }}</div>
                        <div>
                           <p class="text-text-muted leading-relaxed">{{ step.text }}</p>
                        </div>
                     </div>
                   </template>
                   <div v-else class="text-center py-10 text-text-dim italic">No instructions listed.</div>
                </div>

                <div v-if="activeTab === 'reviews'" class="space-y-8">
                   <div v-if="authStore.isAuthenticated && !isOwner">
                      <RatingInput @submit="handleRatingSubmit" />
                      <div class="my-8 border-b border-glass-border"></div>
                   </div>
                   <RatingList ref="ratingListRef" :post-id="post.id" />
                   <div class="my-10"></div>
                   <CommentSection :post-id="post.id" />
                </div>
             </div>

             <!-- Actions -->
             <div class="flex gap-4 mb-10">
                <button @click="showCollectionModal = true" class="flex-1 btn-secondary flex items-center justify-center gap-2 h-14">
                  <span>📁</span> Save to Collection
                </button>
                <button @click="forkRecipe" :disabled="isForking" class="flex-1 btn-primary flex items-center justify-center gap-2 h-14">
                  <span>{{ isForking ? '⏳' : '🍴' }}</span> Fork Variation
                </button>
                <button class="flex-1 btn-secondary flex items-center justify-center gap-2 h-14">
                  <span>📤</span> Share
                </button>
             </div>

             <!-- Variations -->
             <div class="mt-12 border-t border-glass-border pt-12">
                <VariationList :post-id="post.id" />
             </div>
          </div>
       </div>

       <!-- Related Posts -->
       <div class="mt-24">
          <h2 class="font-montserrat font-extrabold text-3xl tracking-tight mb-10">You might also like</h2>
          <PinGrid :posts="relatedPosts" />
       </div>
    </div>

    <CollectionModal v-if="post && showCollectionModal" :show="showCollectionModal" :post-id="post.id" @close="showCollectionModal = false" />
  </div>
</template>
