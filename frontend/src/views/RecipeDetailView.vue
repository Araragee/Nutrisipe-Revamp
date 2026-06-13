<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { socialApi } from '@/http/endpoints/social'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import UserAvatar from '@/components/user/UserAvatar.vue'
import FollowButton from '@/components/user/FollowButton.vue'
import PinGrid from '@/components/feed/PinGrid.vue'
import RatingInput from '@/components/ratings/RatingInput.vue'
import RatingList from '@/components/ratings/RatingList.vue'
import RatingHistogram from '@/components/ratings/RatingHistogram.vue'
import CommentSection from '@/components/post/CommentSection.vue'
import VariationList from '@/components/recipe/VariationList.vue'
import CookMode from '@/components/recipe/CookMode.vue'
import CollectionModal from '@/components/profile/CollectionModal.vue'
import { variationsApi } from '@/http/endpoints/variations'
import { ratingsApi } from '@/http/endpoints/ratings'
import { resolveSrcset, ogShareUrl } from '@/utils/imageUrl'
import { scaleQuantity } from '@/utils/scaleQuantity'
import type { Post } from '@/typescript/interface/Post'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const post = ref<Post | null>(null)
const relatedPosts = ref<Post[]>([])
const isLoading = ref(true)
const isDeleting = ref(false)
const activeTab = ref('ingredients')
const ratingListRef = ref<any>(null)
const histogramRef = ref<any>(null)
const showCollectionModal = ref(false)
const showCookMode = ref(false)
const isForking = ref(false)
const hasInstructions = computed(
  () => (post.value?.recipe?.instructions?.length ?? 0) > 0,
)
const targetServings = ref<number | null>(null)

const baseServings = computed(() => post.value?.recipe?.servings ?? null)
const scaleFactor = computed(() => {
  if (!baseServings.value || !targetServings.value || baseServings.value <= 0) return 1
  return targetServings.value / baseServings.value
})
const scaledIngredients = computed(() => {
  const list = post.value?.recipe?.ingredients ?? []
  if (scaleFactor.value === 1) return list
  return list.map((ing: any) => ({ ...ing, quantity: scaleQuantity(ing.quantity, scaleFactor.value) }))
})
function adjustServings(delta: number) {
  const current = targetServings.value ?? baseServings.value ?? 1
  targetServings.value = Math.max(1, current + delta)
}
function resetServings() {
  targetServings.value = baseServings.value
}

const postId = computed(() => (Array.isArray(route.params.id) ? route.params.id[0] : route.params.id) as string)
const isOwner = computed(() => authStore.user?.id === post.value?.userId)
const hasIngredients = computed(() => (post.value?.recipe?.ingredients?.length ?? 0) > 0)
const isForkDisabled = computed(() => isForking.value || !post.value?.recipe || !hasIngredients.value || (authStore.isAuthenticated && isOwner.value))
const forkDisabledReason = computed(() => {
  if (isOwner.value) return "You can't fork your own recipe"
  if (!hasIngredients.value) return 'This recipe has no ingredients to fork'
  return ''
})

const nutritionFacts = computed(() => {
  const n = post.value?.recipe?.nutrition
  return [
    { label: 'Calories', val: n?.calories || '0', unit: 'kcal', icon: 'fire' },
    { label: 'Protein', val: n?.protein || '0', unit: 'g', icon: 'bolt' },
    { label: 'Carbs', val: n?.carbs || '0', unit: 'g', icon: 'circle-stack' },
    { label: 'Fat', val: n?.fat || '0', unit: 'g', icon: 'beaker' },
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
    logger.error('Failed to fork recipe:', error)
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
    targetServings.value = post.value?.recipe?.servings ?? null

    // Fetch real related posts
    const relatedRes = await postsApi.getRelated(postId.value)
    relatedPosts.value = relatedRes.data.data
  } catch (error) {
    logger.error('Failed to load post:', error)
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
    
    // Refresh post + rating list + histogram
    const response = await postsApi.getById(postId.value)
    post.value = response.data.data
    ratingListRef.value?.refresh()
    histogramRef.value?.refresh()
  } catch (error) {
    logger.error('Failed to submit rating:', error)
    uiStore.showToast('Failed to submit rating', 'error')
  }
}

async function handleDelete() {
  if (!post.value) return
  if (!confirm('Are you sure you want to delete this recipe?')) return
  isDeleting.value = true
  try {
    await postsApi.delete(post.value.id)
    uiStore.showToast('Recipe deleted successfully', 'success')
    router.push(`/profile/${authStore.user?.id}`)
  } catch (error) {
    logger.error('Failed to delete recipe:', error)
    uiStore.showToast('Failed to delete recipe', 'error')
    isDeleting.value = false
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

async function shareRecipe() {
  if (!post.value) return
  const url = ogShareUrl(post.value.id)
  const shareData = {
    title: post.value.title,
    text: post.value.description || post.value.title,
    url,
  }
  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return
    } catch (err: any) {
      if (err?.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    uiStore.showToast('Link copied to clipboard', 'success')
  } catch {
    uiStore.showToast('Failed to share', 'error')
  }
}

onMounted(loadPost)
watch(postId, loadPost)

const recipeImage = computed(() =>
  resolveSrcset(post.value?.imageUrl, post.value?.id, [800, 1200, 1600]),
)
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
             <div class="relative rounded-[40px] overflow-hidden shadow-2xl group border-1.5 border-border">
                <img :src="recipeImage.src" :srcset="recipeImage.srcset" sizes="(min-width:1024px) 45vw, 100vw" class="w-full object-cover aspect-[4/5]" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                <div class="absolute top-6 right-6 flex flex-col gap-3">
                  <button
                    @click="toggleLike"
                    class="w-14 h-14 rounded-full bg-surface/80 border border-border flex items-center justify-center text-2xl transition-all active:scale-90"
                    :class="post.isLiked ? 'text-orange shadow-lg shadow-orange/20' : 'text-text-dim'"
                    :aria-label="post.isLiked ? 'Unlike' : 'Like'"
                  >
                    <BaseIcons name="heart" :solid="post.isLiked" size="lg" />
                  </button>
                  <button
                    @click="toggleSave"
                    class="w-14 h-14 rounded-full bg-surface/80 border border-border flex items-center justify-center text-2xl transition-all active:scale-90"
                    :class="post.isSaved ? 'text-orange shadow-lg shadow-orange/20' : 'text-text-dim'"
                    :aria-label="post.isSaved ? 'Unsave' : 'Save'"
                    :title="post.isSaved ? 'Saved — tap to remove' : 'Save recipe'"
                  >
                    <BaseIcons name="bookmark" :solid="post.isSaved" size="lg" />
                  </button>
                </div>
             </div>
          </div>

          <!-- Right: Details -->
          <div class="flex-1 flex flex-col pt-4">
             <div class="flex items-center gap-3 mb-6">
                <span class="px-4 py-1.5 rounded-full bg-orange text-white text-xs font-bold tracking-widest uppercase">{{ post.category }}</span>
                <span v-if="post.isPublic === false && isOwner" class="px-4 py-1.5 rounded-full bg-background-secondary border border-border text-text-muted text-xs font-bold tracking-widest uppercase flex items-center gap-1.5"><BaseIcons name="lock-closed" size="sm" /> Private</span>
                <div class="flex items-center gap-1.5 text-orange font-bold text-sm">★ {{ post.averageRating?.toFixed(1) || '0.0' }} ({{ post.ratingCount }})</div>
             </div>

             <h1 class="font-montserrat font-extrabold text-4xl md:text-5xl tracking-tight leading-[1.1] mb-8">{{ post.title }}</h1>

             <div class="flex items-center gap-4 p-5 bg-background-secondary rounded-3xl border border-border mb-10">
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
                <div v-for="n in nutritionFacts" :key="n.label" class="bg-background-secondary/50 rounded-2xl p-4 text-center border border-border">
                   <BaseIcons :name="n.icon" size="md" class="mx-auto mb-1.5 text-text-dim" />
                   <span class="font-montserrat font-extrabold text-lg block leading-none mb-1">{{ n.val }}</span>
                   <span class="text-[9px] text-text-dim uppercase font-bold tracking-widest">{{ n.label }}</span>
                </div>
             </div>

             <!-- Tabs -->
             <div class="flex gap-10 border-b border-border mb-8">
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
                <div v-if="activeTab === 'ingredients'">
                   <div v-if="baseServings" class="flex items-center justify-between gap-3 mb-5 p-3 bg-background-secondary/40 border border-border rounded-2xl">
                      <span class="text-xs font-bold uppercase tracking-widest text-text-dim">Servings</span>
                      <div class="flex items-center gap-2">
                          <button @click="adjustServings(-1)" :disabled="(targetServings ?? baseServings) <= 1" class="w-8 h-8 rounded-full bg-background-secondary border border-border text-text font-bold disabled:opacity-40">−</button>
                          <span class="font-montserrat font-extrabold text-lg w-12 text-center tabular-nums">{{ targetServings ?? baseServings }}</span>
                          <button @click="adjustServings(1)" class="w-8 h-8 rounded-full bg-background-secondary border border-border text-text font-bold">+</button>
                          <button v-if="scaleFactor !== 1" @click="resetServings" class="ml-2 text-[10px] font-bold uppercase tracking-widest text-orange hover:underline">Reset</button>
                      </div>
                   </div>

                   <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div v-for="(ing, idx) in scaledIngredients" :key="idx" class="flex items-center gap-4 p-4 bg-background-secondary/30 rounded-2xl border border-border">
                         <div class="w-2.5 h-2.5 rounded-full bg-orange"></div>
                         <span class="text-[15px] font-medium">{{ ing.name }}</span>
                         <span class="ml-auto font-bold text-orange text-sm">{{ ing.quantity }}</span>
                      </div>
                      <div v-if="scaledIngredients.length === 0" class="col-span-full text-center py-10 text-text-dim italic">No ingredients listed.</div>
                   </div>
                </div>

                <div v-if="activeTab === 'instructions'" class="space-y-8">
                    <div v-for="step in post.recipe?.instructions" :key="step.step" class="flex gap-6">
                       <div class="w-10 h-10 rounded-full bg-orange text-white font-montserrat font-extrabold flex items-center justify-center shrink-0 shadow-lg shadow-orange/30">{{ step.step }}</div>
                       <div>
                          <p class="text-text-muted leading-relaxed">{{ step.text }}</p>
                       </div>
                    </div>
                    <div v-if="!post.recipe?.instructions || post.recipe.instructions.length === 0" class="text-center py-10 text-text-dim italic">No instructions listed.</div>
                </div>

                <div v-if="activeTab === 'reviews'" class="space-y-8">
                   <RatingHistogram ref="histogramRef" :post-id="post.id" />
                   <div v-if="authStore.isAuthenticated && !isOwner">
                      <RatingInput @submit="handleRatingSubmit" />
                      <div class="my-8 border-b border-border"></div>
                   </div>
                   <RatingList ref="ratingListRef" :post-id="post.id" />
                   <div class="my-10"></div>
                   <CommentSection :post-id="post.id" />
                </div>
             </div>

             <!-- Actions -->
             <div class="flex flex-wrap gap-4 mb-10">
                <button v-if="hasInstructions" @click="showCookMode = true" class="flex-1 min-w-[200px] btn-primary flex items-center justify-center gap-2 h-14">
                  <BaseIcons name="play" size="sm" /> Cook Mode
                </button>
                <button @click="showCollectionModal = true" class="flex-1 min-w-[160px] btn-secondary flex items-center justify-center gap-2 h-14">
                  <BaseIcons name="folder-plus" size="sm" /> Save to Collection
                </button>
                <button @click="forkRecipe" :disabled="isForkDisabled" :title="forkDisabledReason" class="flex-1 min-w-[160px] btn-secondary flex items-center justify-center gap-2 h-14 disabled:opacity-50 disabled:cursor-not-allowed">
                  <BaseIcons name="arrow-path-rounded-square" size="sm" :class="{ 'animate-spin': isForking }" /> Fork
                </button>
                <button @click="shareRecipe" class="flex-1 min-w-[140px] btn-secondary flex items-center justify-center gap-2 h-14">
                  <BaseIcons name="share" size="sm" /> Share
                </button>
                <button v-if="isOwner" @click="handleDelete" :disabled="isDeleting" class="flex-1 min-w-[140px] btn-secondary flex items-center justify-center gap-2 h-14 !text-red-500 !border-red-500/30 hover:!bg-red-500/10">
                  <BaseIcons name="trash" size="sm" /> Delete
                </button>
             </div>

             <!-- Variations -->
             <div class="mt-12 border-t border-border pt-12">
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

    <CookMode
      v-if="post"
      :show="showCookMode"
      :title="post.title"
      :instructions="post.recipe?.instructions ?? []"
      @close="showCookMode = false"
    />
  </div>
</template>
