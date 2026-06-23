<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
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
import { resolveImage } from '@/utils/imageUrl'
import { scaleQuantity } from '@/utils/scaleQuantity'
import { usePostActions } from '@/composables/usePostActions'
import type { Post } from '@/typescript/interface/Post'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const post = ref<Post | null>(null)
const { toggleLike, toggleSave, sharePost: shareRecipe } = usePostActions(post)
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

const prepTime = computed(() => post.value?.recipe?.prepTime ?? 0)
const cookTime = computed(() => post.value?.recipe?.cookTime ?? 0)
const totalTime = computed(() => prepTime.value + cookTime.value)

function formatMinutes(mins: number): string {
  if (!mins || mins <= 0) return '—'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

// Quick-glance meta strip — only renders entries with real data
const metaStats = computed(() => {
  const r = post.value?.recipe
  return [
    { key: 'prep', icon: 'clock', label: 'Prep', value: formatMinutes(prepTime.value), show: prepTime.value > 0 },
    { key: 'cook', icon: 'fire', label: 'Cook', value: formatMinutes(cookTime.value), show: cookTime.value > 0 },
    { key: 'total', icon: 'check-circle', label: 'Total', value: formatMinutes(totalTime.value), show: totalTime.value > 0 },
    { key: 'serves', icon: 'users', label: 'Serves', value: String(baseServings.value ?? '—'), show: !!baseServings.value },
  ].filter((s) => s.show)
})

// Explicit class map so Tailwind JIT keeps these (no dynamic interpolation)
const metaGridClass = computed(() => ({
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}[metaStats.value.length] ?? 'grid-cols-4'))

// Ingredient check-off — index-based, resets when the recipe changes
const checkedIngredients = ref<Set<number>>(new Set())
function toggleIngredient(idx: number) {
  const next = new Set(checkedIngredients.value)
  next.has(idx) ? next.delete(idx) : next.add(idx)
  checkedIngredients.value = next
}
watch(postId, () => { checkedIngredients.value = new Set() })

const reviewCount = computed(() => post.value?.ratingCount ?? 0)

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

onMounted(loadPost)
watch(postId, loadPost)

const recipeImage = computed(() =>
  resolveImage(post.value?.imageUrl, post.value?.id),
)
</script>

<template>
  <div class="recipe-detail-view min-h-screen bg-background antialiased">
    <div v-if="isLoading" class="flex items-center justify-center py-32">
       <div class="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
    </div>

    <article v-else-if="post">
       <!-- Cinematic hero — food fills the frame, chrome decorates the edges -->
       <header class="recipe-hero relative w-full overflow-hidden">
          <img
            :src="recipeImage"
            sizes="100vw"
            :alt="post.title"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <!-- Warm reading gradient — carries title without a hard panel -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15"></div>
          <div class="absolute inset-0 hidden lg:block bg-gradient-to-r from-black/45 via-transparent to-transparent"></div>

          <!-- Top utility bar -->
          <div class="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-5 flex items-center justify-between">
             <button
               @click="router.back()"
               class="h-11 px-4 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white text-xs font-montserrat font-bold uppercase tracking-widest flex items-center gap-2 transition-transform duration-200 ease-out hover:bg-black/45 active:scale-[0.96]"
             >
               <BaseIcons name="arrow-left" size="sm" /> <span class="hidden sm:inline">Back</span>
             </button>
             <div class="flex items-center gap-2.5">
                <button
                  @click="toggleLike"
                  class="recipe-fab"
                  :class="post.isLiked ? 'is-active' : ''"
                  :aria-label="post.isLiked ? 'Unlike' : 'Like'"
                >
                  <BaseIcons name="heart" :solid="post.isLiked" size="md" />
                </button>
                <button
                  @click="toggleSave"
                  class="recipe-fab"
                  :class="post.isSaved ? 'is-active' : ''"
                  :aria-label="post.isSaved ? 'Unsave' : 'Save'"
                  :title="post.isSaved ? 'Saved — tap to remove' : 'Save recipe'"
                >
                  <BaseIcons name="bookmark" :solid="post.isSaved" size="md" />
                </button>
                <button @click="shareRecipe" class="recipe-fab" aria-label="Share">
                  <BaseIcons name="share" size="md" />
                </button>
             </div>
          </div>

          <!-- Hero title block -->
          <div class="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pb-8 sm:pb-12">
             <div class="flex flex-wrap items-center gap-2.5 mb-4 hero-fade" style="animation-delay: 40ms">
                <span class="px-3.5 py-1.5 rounded-full bg-orange text-white text-[11px] font-montserrat font-bold tracking-widest uppercase shadow-[0_6px_20px_rgba(255,107,53,0.4)]">{{ post.category }}</span>
                <span v-if="post.isPublic === false && isOwner" class="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-montserrat font-bold tracking-widest uppercase flex items-center gap-1.5">
                   <BaseIcons name="lock-closed" size="xs" /> Private
                </span>
                <span class="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-montserrat font-bold tracking-wide flex items-center gap-1.5">
                   <span class="text-orange-light">★</span>
                   <span class="tabular-nums">{{ post.averageRating?.toFixed(1) || '0.0' }}</span>
                   <span class="text-white/65">({{ reviewCount }})</span>
                </span>
             </div>
             <h1 class="hero-fade font-montserrat font-black text-white text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] max-w-3xl text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]" style="animation-delay: 100ms">{{ post.title }}</h1>
             <p v-if="post.description" class="hero-fade mt-4 text-white/85 text-base sm:text-lg leading-relaxed max-w-2xl text-pretty drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]" style="animation-delay: 160ms">{{ post.description }}</p>
          </div>
       </header>

       <!-- Content -->
       <div class="max-w-7xl mx-auto px-5 sm:px-8 pb-20">
          <!-- Quick-glance meta strip -->
          <div v-if="metaStats.length" class="meta-strip relative -mt-7 sm:-mt-9 z-20 grid gap-px rounded-card overflow-hidden border-1.5 border-border bg-border shadow-card" :class="metaGridClass">
             <div v-for="m in metaStats" :key="m.key" class="bg-surface px-3 py-4 sm:py-5 flex flex-col items-center text-center gap-1">
                <BaseIcons :name="m.icon" size="sm" class="text-orange mb-0.5" />
                <span class="font-montserrat font-extrabold text-lg sm:text-xl leading-none tabular-nums">{{ m.value }}</span>
                <span class="text-[10px] text-text-dim uppercase font-montserrat font-bold tracking-widest">{{ m.label }}</span>
             </div>
          </div>

          <div class="flex flex-col lg:flex-row gap-8 lg:gap-14 mt-10 lg:mt-12">
             <!-- Main column -->
             <div class="flex-1 min-w-0 order-2 lg:order-1">
                <!-- Tabs -->
                <div class="sticky top-0 z-20 -mx-5 sm:-mx-8 px-5 sm:px-8 bg-background/85 backdrop-blur-md">
                   <div role="tablist" class="flex gap-7 sm:gap-10 border-b border-border overflow-x-auto scrollbar-hide">
                      <button
                        v-for="t in ['ingredients', 'instructions', 'reviews']"
                        :key="t"
                        role="tab"
                        :aria-selected="activeTab === t"
                        @click="activeTab = t"
                        :class="[
                          'relative py-4 text-[13px] font-montserrat font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 ease-out',
                          activeTab === t ? 'text-orange' : 'text-text-muted hover:text-text'
                        ]"
                      >
                        {{ t }}
                        <span v-if="t === 'reviews' && reviewCount" class="ml-1.5 text-text-dim tabular-nums">{{ reviewCount }}</span>
                        <span class="absolute left-0 -bottom-px h-0.5 rounded-full bg-orange transition-all duration-300 ease-out" :class="activeTab === t ? 'w-full opacity-100' : 'w-0 opacity-0'"></span>
                      </button>
                   </div>
                </div>

                <div class="pt-8">
                   <!-- Ingredients -->
                   <section v-show="activeTab === 'ingredients'" class="tab-fade space-y-5">
                      <div v-if="baseServings" class="flex items-center justify-between gap-3 p-2 pl-5 bg-background-secondary border border-border rounded-full">
                         <span class="text-[11px] font-montserrat font-bold uppercase tracking-widest text-text-dim">Servings</span>
                         <div class="flex items-center gap-1.5">
                            <button @click="adjustServings(-1)" :disabled="(targetServings ?? baseServings) <= 1" class="w-9 h-9 rounded-full bg-surface border border-border text-text font-bold text-lg flex items-center justify-center transition-transform duration-150 ease-out hover:border-orange hover:text-orange active:scale-[0.92] disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text">−</button>
                            <span class="font-montserrat font-extrabold text-lg w-10 text-center tabular-nums">{{ targetServings ?? baseServings }}</span>
                            <button @click="adjustServings(1)" class="w-9 h-9 rounded-full bg-surface border border-border text-text font-bold text-lg flex items-center justify-center transition-transform duration-150 ease-out hover:border-orange hover:text-orange active:scale-[0.92]">+</button>
                            <button v-if="scaleFactor !== 1" @click="resetServings" class="ml-1.5 mr-1 text-[10px] font-montserrat font-bold uppercase tracking-widest text-orange hover:underline">Reset</button>
                         </div>
                      </div>

                      <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                         <li v-for="(ing, idx) in scaledIngredients" :key="idx">
                            <button
                              type="button"
                              @click="toggleIngredient(idx)"
                              class="group w-full flex items-center gap-3.5 p-3.5 bg-surface rounded-2xl border border-border text-left transition-colors duration-200 ease-out hover:border-orange/50"
                              :class="checkedIngredients.has(idx) ? 'opacity-55' : ''"
                            >
                               <span
                                 class="w-6 h-6 rounded-full border-1.5 shrink-0 flex items-center justify-center transition-colors duration-200 ease-out"
                                 :class="checkedIngredients.has(idx) ? 'bg-orange border-orange text-white' : 'border-border text-transparent group-hover:border-orange'"
                               >
                                  <BaseIcons name="check" size="xs" class="transition-all duration-200 ease-out" :class="checkedIngredients.has(idx) ? 'scale-100 opacity-100' : 'scale-50 opacity-0'" />
                               </span>
                               <span class="text-[15px] font-medium leading-snug transition-all duration-200" :class="checkedIngredients.has(idx) ? 'line-through text-text-dim' : 'text-text'">{{ ing.name }}</span>
                               <span class="ml-auto pl-2 font-montserrat font-bold text-orange text-sm tabular-nums whitespace-nowrap">{{ ing.quantity }}</span>
                            </button>
                         </li>
                         <li v-if="scaledIngredients.length === 0" class="sm:col-span-2 text-center py-12 text-text-dim italic">No ingredients listed.</li>
                      </ul>
                   </section>

                   <!-- Instructions -->
                   <section v-show="activeTab === 'instructions'" class="tab-fade">
                      <ol v-if="hasInstructions" class="relative space-y-7 before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-px before:bg-border">
                         <li v-for="step in post.recipe?.instructions" :key="step.step" class="relative flex gap-5">
                            <div class="relative z-10 w-10 h-10 rounded-full bg-orange text-white font-montserrat font-extrabold flex items-center justify-center shrink-0 shadow-[0_6px_18px_rgba(255,107,53,0.35)] tabular-nums">{{ step.step }}</div>
                            <p class="text-text-muted leading-relaxed text-pretty pt-2">{{ step.text }}</p>
                         </li>
                      </ol>
                      <div v-else class="text-center py-12 text-text-dim italic">No instructions listed.</div>
                   </section>

                   <!-- Reviews -->
                   <section v-show="activeTab === 'reviews'" class="tab-fade space-y-8">
                      <RatingHistogram ref="histogramRef" :post-id="post.id" />
                      <div v-if="authStore.isAuthenticated && !isOwner">
                         <RatingInput @submit="handleRatingSubmit" />
                      </div>
                      <RatingList ref="ratingListRef" :post-id="post.id" />
                      <CommentSection :post-id="post.id" />
                   </section>
                </div>
             </div>

             <!-- Sidebar -->
             <aside class="w-full lg:w-[340px] shrink-0 order-1 lg:order-2 space-y-5">
                <!-- Author card -->
                <div class="bg-surface rounded-card border border-border p-5 shadow-card">
                   <div class="flex items-center gap-3.5">
                      <UserAvatar :user="post.user" size="md" class="ring-2 ring-orange ring-offset-2 ring-offset-surface" />
                      <div class="flex-1 min-w-0">
                         <p class="font-montserrat font-bold text-[15px] truncate">{{ post.user.displayName }}</p>
                         <p class="text-xs text-text-dim font-bold uppercase tracking-wider truncate">@{{ post.user.username }}</p>
                      </div>
                   </div>
                   <div class="mt-4">
                      <FollowButton v-if="!isOwner" :user-id="post.user.id" :is-following="post.user.isFollowing" class="w-full" />
                      <button v-else @click="router.push(`/recipes/${post.id}/edit`)" class="w-full h-11 rounded-btn border border-border bg-background-secondary text-text font-montserrat font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-200 ease-out hover:border-orange hover:text-orange active:scale-[0.98]">
                         <BaseIcons name="pencil-square" size="sm" /> Edit Recipe
                      </button>
                   </div>
                </div>

                <!-- Primary actions -->
                <div class="bg-surface rounded-card border border-border p-5 shadow-card space-y-2.5">
                   <button v-if="hasInstructions" @click="showCookMode = true" class="w-full h-12 rounded-btn bg-orange text-white font-montserrat font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,107,53,0.35)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(255,107,53,0.4)] active:scale-[0.98]">
                      <BaseIcons name="play" :solid="true" size="sm" /> Start Cook Mode
                   </button>
                   <div class="grid grid-cols-2 gap-2.5">
                      <button @click="showCollectionModal = true" class="recipe-action">
                         <BaseIcons name="folder-plus" size="sm" /> Save
                      </button>
                      <button @click="forkRecipe" :disabled="isForkDisabled" :title="forkDisabledReason" class="recipe-action disabled:opacity-40 disabled:cursor-not-allowed">
                         <BaseIcons name="arrow-path-rounded-square" size="sm" :class="{ 'animate-spin': isForking }" /> Fork
                      </button>
                   </div>
                   <button v-if="isOwner" @click="handleDelete" :disabled="isDeleting" class="w-full h-11 rounded-btn border border-red-500/25 bg-red-500/5 text-red-500 font-montserrat font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-200 ease-out hover:bg-red-500/10 active:scale-[0.98]">
                      <BaseIcons name="trash" size="sm" /> Delete
                   </button>
                </div>

                <!-- Nutrition -->
                <div class="bg-surface rounded-card border border-border p-5 shadow-card">
                   <h2 class="text-[11px] font-montserrat font-bold uppercase tracking-widest text-text-dim mb-4">Per Serving</h2>
                   <div class="grid grid-cols-2 gap-2.5">
                      <div v-for="n in nutritionFacts" :key="n.label" class="bg-background-secondary rounded-2xl p-3.5 flex flex-col gap-1">
                         <BaseIcons :name="n.icon" size="sm" class="text-orange" />
                         <span class="font-montserrat font-extrabold text-xl leading-none tabular-nums">{{ n.val }}<span class="text-xs text-text-dim font-bold ml-0.5">{{ n.unit }}</span></span>
                         <span class="text-[10px] text-text-dim uppercase font-montserrat font-bold tracking-widest">{{ n.label }}</span>
                      </div>
                   </div>
                </div>
             </aside>
          </div>

          <!-- Variations -->
          <div class="mt-14 border-t border-border pt-12">
             <VariationList :post-id="post.id" />
          </div>

          <!-- Related Posts -->
          <div class="mt-16 md:mt-20">
             <h2 class="font-montserrat font-extrabold text-2xl sm:text-3xl tracking-tight mb-8 text-balance">You might also like</h2>
             <PinGrid :posts="relatedPosts" @post-click="(id) => router.push(`/recipes/${id}`)" />
          </div>
       </div>
    </article>

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

<style scoped>
.recipe-hero {
  min-height: 56vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
@media (min-width: 1024px) {
  .recipe-hero {
    min-height: 64vh;
    max-height: 720px;
  }
}

.recipe-fab {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  transition: transform 0.2s ease-out, background-color 0.2s ease-out, color 0.2s ease-out;
}
.recipe-fab:hover {
  background: rgba(0, 0, 0, 0.45);
}
.recipe-fab:active {
  transform: scale(0.92);
}
.recipe-fab.is-active {
  color: var(--orange);
  background: #fff;
}

.recipe-action {
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: var(--radius-btn);
  border: 1px solid var(--border);
  background: var(--bg2);
  color: var(--text2);
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: transform 0.15s ease-out, border-color 0.2s ease-out, color 0.2s ease-out;
}
.recipe-action:hover:not(:disabled) {
  border-color: var(--orange);
  color: var(--orange);
}
.recipe-action:active:not(:disabled) {
  transform: scale(0.97);
}

/* Staggered hero entrance */
.hero-fade {
  opacity: 0;
  animation: heroFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes heroFade {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Tab content cross-fade */
.tab-fade {
  animation: tabFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes tabFade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-fade,
  .tab-fade {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
