<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, onMounted, computed, watch } from "vue";
import { socialApi } from "@/http/endpoints/social";
import { postsApi } from "@/http/endpoints/posts";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import UserAvatar from "@/components/user/UserAvatar.vue";
import FollowButton from "@/components/user/FollowButton.vue";
import CommentSection from "@/components/post/CommentSection.vue";
import RatingInput from "@/components/ratings/RatingInput.vue";
import RatingList from "@/components/ratings/RatingList.vue";
import VariationList from "@/components/recipe/VariationList.vue";
import CollectionModal from "@/components/profile/CollectionModal.vue";
import ExperimentRecipeModal from "@/components/recipe/ExperimentRecipeModal.vue";
import { variationsApi } from "@/http/endpoints/variations";
import { ratingsApi } from "@/http/endpoints/ratings";
import { resolveSrcset, ogShareUrl } from "@/utils/imageUrl";
import { useRouter } from "vue-router";
import type { Post } from "@/typescript/interface/Post";

const props = defineProps<{
  postId: string | null;
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
const post = ref<Post | null>(null);
const isLoading = ref(false);
const activeTab = ref("ingredients");
const ratingListRef = ref<any>(null);
const showCollectionModal = ref(false);
const showExperiment = ref(false);
const isForking = ref(false);
const showCopyToast = ref(false);

const isOwner = computed(() => authStore.user?.id === post.value?.userId);

const nutritionFacts = computed(() => {
  const n = post.value?.recipe?.nutrition;
  return [
    { label: "Calories", val: n?.calories || "0", unit: "kcal", color: "#FF6B35" },
    { label: "Protein", val: n?.protein || "0", unit: "g", color: "#4ECDC4" },
    { label: "Carbs", val: n?.carbs || "0", unit: "g", color: "#FFE66D" },
    { label: "Fat", val: n?.fat || "0", unit: "g", color: "#FF6B8A" },
  ];
});

async function shareRecipe() {
  if (!post.value) return;
  const url = ogShareUrl(post.value.id);
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // ignore — toast still useful
  }
  showCopyToast.value = true;
  setTimeout(() => { showCopyToast.value = false; }, 2200);
}

async function forkRecipe() {
  if (!authStore.isAuthenticated) {
    uiStore.showToast("Please login to fork recipes", "info");
    return;
  }
  if (!post.value) return;

  isForking.value = true;
  try {
    const forkData = {
      title: `${post.value.title} (My version)`,
      description: post.value.description,
      variationDescription: "Inspired by the original",
      ...post.value.recipe,
    };
    const response = await variationsApi.fork(post.value.id, forkData);
    uiStore.showToast("Recipe forked! Redirecting to edit...", "success");
    emit("close");
    router.push(`/recipes/${response.data.data.variationPost.id}/edit`);
  } catch (error) {
    logger.error("Failed to fork recipe:", error);
    uiStore.showToast("Failed to fork recipe", "error");
  } finally {
    isForking.value = false;
  }
}

async function fetchPost() {
  if (!props.postId) return;
  isLoading.value = true;
  try {
    const response = await postsApi.getById(props.postId);
    post.value = response.data.data;
  } catch (error) {
    logger.error("Fetch post error:", error);
    uiStore.showToast("Failed to load recipe", "error");
    emit("close");
  } finally {
    isLoading.value = false;
  }
}

async function handleRatingSubmit(data: { rating: number; review?: string }) {
  if (!post.value) return;
  try {
    await ratingsApi.createOrUpdateRating(post.value.id, data.rating, data.review);
    uiStore.showToast("Rating submitted!", "success");

    // Refresh post and rating list
    const response = await postsApi.getById(post.value.id);
    post.value = response.data.data;
    ratingListRef.value?.refresh();
  } catch (error) {
    logger.error("Failed to submit rating:", error);
    uiStore.showToast("Failed to submit rating", "error");
  }
}

async function toggleLike() {
  if (!post.value || !authStore.isAuthenticated) {
    uiStore.showToast("Please sign in to like", "info");
    return;
  }
  const wasLiked = post.value.isLiked;
  post.value.isLiked = !wasLiked;
  post.value.likeCount += wasLiked ? -1 : 1;
  try {
    if (wasLiked) await socialApi.unlikePost(post.value.id);
    else await socialApi.likePost(post.value.id);
  } catch {
    post.value.isLiked = wasLiked;
    post.value.likeCount += wasLiked ? 1 : -1;
  }
}

async function toggleSave() {
  if (!post.value || !authStore.isAuthenticated) {
    uiStore.showToast("Please sign in to save", "info");
    return;
  }
  const wasSaved = post.value.isSaved;
  post.value.isSaved = !wasSaved;
  post.value.saveCount += wasSaved ? -1 : 1;
  try {
    if (wasSaved) await socialApi.unsavePost(post.value.id);
    else await socialApi.savePost(post.value.id);
  } catch {
    post.value.isSaved = wasSaved;
    post.value.saveCount += wasSaved ? 1 : -1;
  }
}

onMounted(() => {
  if (props.show) fetchPost();
});

watch(
  () => [props.show, props.postId],
  ([newShow, newPostId]) => {
    if (newShow && newPostId) {
      fetchPost();
    } else if (!newShow) {
      // Clear post data when modal closes to prevent flash of old data
      setTimeout(() => {
        post.value = null;
      }, 300);
    }
  },
);

const recipeImage = computed(() =>
  resolveSrcset(post.value?.imageUrl, post.value?.id, [800, 1200, 1600]),
);
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/75 backdrop-blur-md animate-revamp"
  >
    <div
      class="relative bg-background w-full max-w-5xl h-full max-h-[90vh] rounded-[32px] overflow-hidden shadow-modal border-1.5 border-glass-border flex animate-modalIn"
      @click.stop
    >
      <div v-if="isLoading" class="flex-1 flex items-center justify-center">
        <div
          class="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"
        ></div>
      </div>

      <template v-else-if="post">
        <!-- Close button (modal top-right, over image) -->
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <!-- Toast: link copied -->
        <div
          v-if="showCopyToast"
          class="fixed left-1/2 -translate-x-1/2 bottom-10 z-[150] flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/85 text-white text-sm font-bold shadow-2xl backdrop-blur-xl animate-toastIn"
        >
          <span class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          Link copied
        </div>

        <!-- Left: Image side -->
        <div class="hidden md:block w-[45%] h-full relative overflow-hidden bg-black">
          <img :src="recipeImage.src" :srcset="recipeImage.srcset" sizes="(min-width:1024px) 50vw, 100vw" class="w-full h-full object-cover opacity-90" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

          <!-- Glass dock: like / save / share (iOS 26-style, top-left) -->
          <div class="modal-quick-actions absolute top-4 left-4 z-20 flex items-center gap-1 p-1 rounded-full">
            <button
              @click="toggleLike"
              :class="['quick-icon-btn w-9 h-9 rounded-full flex items-center justify-center text-white transition-all', post.isLiked && 'is-active']"
              :title="post.isLiked ? 'Liked' : 'Like'"
              aria-label="Like"
            >
              <svg v-if="post.isLiked" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <button
              @click="toggleSave"
              :class="['quick-icon-btn w-9 h-9 rounded-full flex items-center justify-center text-white transition-all', post.isSaved && 'is-active']"
              :title="post.isSaved ? 'Saved' : 'Save'"
              aria-label="Save"
            >
              <svg v-if="post.isSaved" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button
              @click="shareRecipe"
              class="quick-icon-btn w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
              title="Share"
              aria-label="Share"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          </div>
        </div>

        <!-- Right: Content side -->
        <div class="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
          <!-- Header -->
          <div class="p-8 pb-6 pt-12 md:pt-8">
            <div class="flex items-center gap-3 mb-4">
              <span class="px-3.5 py-1 rounded-full bg-orange text-white text-[11px] font-bold tracking-wider uppercase">
                {{ post.category }}
              </span>
              <div class="flex items-center gap-1.5 text-orange font-bold text-xs">
                <span>★</span> {{ post.averageRating?.toFixed(1) || "0.0" }} ({{ post.ratingCount }})
              </div>
            </div>

            <h2
              class="font-montserrat font-extrabold text-3xl tracking-tight leading-tight mb-6"
            >
              {{ post.title }}
            </h2>

            <div
              class="flex items-center gap-4 py-4 border-y border-glass-border"
            >
              <UserAvatar
                :user="post.user"
                size="md"
                class="border-2 border-orange"
              />
              <div class="flex-1">
                <p class="font-bold text-sm">{{ post.user.displayName }}</p>
                <p class="text-xs text-text-dim">@{{ post.user.username }}</p>
              </div>
              <div v-if="!isOwner">
                <FollowButton :user-id="post.user.id" :is-following="post.user.isFollowing" />
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-8 pb-8">
            <!-- Stats Row -->
            <div class="grid grid-cols-4 gap-3 mb-8">
              <div
                v-for="n in nutritionFacts"
                :key="n.label"
                class="bg-background-secondary rounded-2xl p-4 text-center border border-glass-border"
              >
                <span class="block w-7 h-7 mx-auto mb-1.5 rounded-md flex items-center justify-center" :style="{ background: n.color + '22', color: n.color }">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
                  </svg>
                </span>
                <span class="font-montserrat font-extrabold text-lg block">{{ n.val }}</span>
                <span class="text-[10px] text-text-dim uppercase font-bold tracking-wider">{{ n.label }}</span>
              </div>
            </div>

            <!-- Tabs -->
            <div class="flex gap-8 border-b border-glass-border mb-6">
              <button
                v-for="t in ['ingredients', 'instructions', 'reviews']"
                :key="t"
                @click="activeTab = t"
                :class="[
                  'pb-3 text-sm font-bold capitalize transition-all border-b-2',
                  activeTab === t
                    ? 'text-orange border-orange'
                    : 'text-text-muted border-transparent',
                ]"
              >
                {{ t }}
              </button>
            </div>

            <div v-if="activeTab === 'ingredients'" class="space-y-3">
              <div
                v-if="
                  post.recipe?.ingredients && post.recipe.ingredients.length > 0
                "
              >
                <div
                  v-for="(ing, idx) in post.recipe.ingredients"
                  :key="idx"
                  class="flex items-center gap-3 p-3.5 bg-background-secondary rounded-xl border border-glass-border"
                >
                  <div class="w-2 h-2 rounded-full bg-orange"></div>
                  <span class="text-sm font-medium">{{ ing.name }}</span>
                  <span class="ml-auto text-xs font-bold text-orange">{{
                    ing.quantity
                  }}</span>
                </div>
              </div>
              <div
                v-else
                class="text-center py-10 text-text-dim text-sm italic"
              >
                No ingredients listed.
              </div>
            </div>

            <div v-if="activeTab === 'instructions'" class="space-y-6">
              <div
                v-if="
                  post.recipe?.instructions &&
                  post.recipe.instructions.length > 0
                "
              >
                <div
                  v-for="step in post.recipe.instructions"
                  :key="step.step"
                  class="flex gap-4"
                >
                  <div
                    class="w-9 h-9 rounded-full bg-orange text-white font-montserrat font-extrabold flex items-center justify-center shrink-0"
                  >
                    {{ step.step }}
                  </div>
                  <div>
                    <p class="text-sm text-text-muted leading-relaxed">
                      {{ step.text }}
                    </p>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="text-center py-10 text-text-dim text-sm italic"
              >
                No instructions listed.
              </div>
            </div>

            <div v-if="activeTab === 'reviews'" class="space-y-6">
               <div v-if="authStore.isAuthenticated && !isOwner">
                  <RatingInput @submit="handleRatingSubmit" />
                  <div class="my-6 border-b border-glass-border"></div>
               </div>
               <RatingList ref="ratingListRef" :post-id="post.id" />
               <div class="my-8"></div>
               <CommentSection :post-id="post.id" />
            </div>
          </div>

          <!-- Variations -->
          <div class="px-8 pb-10 border-t border-glass-border pt-8">
             <VariationList :post-id="post.id" />
          </div>

          <!-- Footer -->
          <div class="p-6 px-8 border-t border-glass-border bg-background flex gap-3">
            <button
              @click="showCollectionModal = true"
              class="flex-1 btn-secondary py-3.5 !text-sm flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              Save
            </button>
            <button
              @click="forkRecipe"
              :disabled="isForking"
              class="flex-1 py-3.5 rounded-xl border-1.5 border-glass-border font-bold text-sm text-text-muted hover:border-orange hover:text-orange flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v3a2 2 0 0 1-2 2H6"/><path d="M6 9v12"/></svg>
              {{ isForking ? 'Forking…' : 'Fork' }}
            </button>
            <button
              @click="showExperiment = true"
              class="flex-1 btn-primary py-3.5 !text-sm flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Experiment
            </button>
          </div>
        </div>
      </template>
    </div>

    <CollectionModal v-if="post && showCollectionModal" :show="showCollectionModal" :post-id="post.id" @close="showCollectionModal = false" />
    <ExperimentRecipeModal :show="showExperiment" :post="post" @close="showExperiment = false" />
  </div>
</template>

<style scoped>
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.animate-modalIn {
  animation: modalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes toastIn {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
.animate-toastIn {
  animation: toastIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* iOS 26-style glass dock for quick actions */
.modal-quick-actions {
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.18);
  backdrop-filter: blur(2px) saturate(120%);
  -webkit-backdrop-filter: blur(2px) saturate(120%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
  transition: background 0.32s ease, backdrop-filter 0.32s ease,
              border-color 0.32s ease, box-shadow 0.32s ease, transform 0.32s ease;
}
.modal-quick-actions:hover {
  background: rgba(255,255,255,0.22);
  border-color: rgba(255,255,255,0.45);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.55),
    inset 0 -1px 0 rgba(255,255,255,0.10),
    0 8px 32px rgba(0,0,0,0.18);
  transform: translateY(-1px);
}
.quick-icon-btn {
  text-shadow: 0 1px 2px rgba(0,0,0,0.35);
}
.quick-icon-btn:hover { background: rgba(255,255,255,0.28); transform: scale(1.06); }
.quick-icon-btn.is-active {
  background: var(--orange);
  color: #fff;
  box-shadow: 0 4px 14px var(--orange-glow), inset 0 1px 0 rgba(255,255,255,0.3);
  text-shadow: none;
}
</style>
