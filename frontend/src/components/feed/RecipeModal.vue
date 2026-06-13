<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, onMounted, computed, watch } from "vue";
import { postsApi } from "@/http/endpoints/posts";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { usePostActions } from "@/composables/usePostActions";
import UserAvatar from "@/components/user/UserAvatar.vue";
import BaseIcons from "@/components/base/BaseIcons.vue";
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

const { toggleLike, toggleSave, sharePost: shareRecipe, showCopyToast } = usePostActions(post);

const isOwner = computed(() => authStore.user?.id === post.value?.userId);
const hasIngredients = computed(() => (post.value?.recipe?.ingredients?.length ?? 0) > 0);
const isForkDisabled = computed(() => isForking.value || !post.value?.recipe || !hasIngredients.value || (authStore.isAuthenticated && isOwner.value));
const forkDisabledReason = computed(() => {
  if (isOwner.value) return "You can't fork your own recipe";
  if (!hasIngredients.value) return "This recipe has no ingredients to fork";
  return "";
});

const nutritionFacts = computed(() => {
  const n = post.value?.recipe?.nutrition;
  return [
    { label: "Calories", val: n?.calories ?? 0, unit: "kcal", icon: "fire", accent: true },
    { label: "Protein", val: n?.protein ?? 0, unit: "g", icon: "bolt", accent: false },
    { label: "Carbs", val: n?.carbs ?? 0, unit: "g", icon: "circle-stack", accent: false },
    { label: "Fat", val: n?.fat ?? 0, unit: "g", icon: "beaker", accent: false },
  ];
});


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
    v-if="show && (isLoading || post)"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/60 animate-revamp"
    @click.self="emit('close')"
  >
    <div
      class="relative bg-surface dark:bg-surface w-full max-w-5xl h-full max-h-[90vh] rounded-[28px] overflow-hidden shadow-modal border border-border flex animate-modalIn"
      @click.stop
    >
      <div v-if="isLoading" class="flex-1 flex items-center justify-center">
        <div
          class="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"
        ></div>
      </div>

      <template v-else-if="post">
        <!-- Close button -->
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-surface/95 dark:bg-surface/95 border border-border hover:bg-background-secondary flex items-center justify-center text-text-muted hover:text-text transition-colors"
          aria-label="Close"
        >
          <BaseIcons name="x-mark" size="sm" />
        </button>

        <!-- Toast: link copied -->
        <div
          v-if="showCopyToast"
          class="fixed left-1/2 -translate-x-1/2 bottom-10 z-[150] flex items-center gap-2 px-4 py-2.5 rounded-full bg-text text-background text-sm font-semibold shadow-modal animate-toastIn"
        >
          <span class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <BaseIcons name="check" size="xs" class="text-white" />
          </span>
          Link copied
        </div>

        <!-- Left: Image side -->
        <div class="hidden md:block w-[45%] h-full relative overflow-hidden bg-background-secondary">
          <img :src="recipeImage.src" :srcset="recipeImage.srcset" sizes="(min-width:1024px) 50vw, 100vw" class="w-full h-full object-cover" />

          <!-- Quick actions: flat white pills -->
          <div class="absolute top-4 left-4 z-20 flex items-center gap-2">
            <button
              @click="toggleLike"
              :class="['w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-card', post.isLiked ? 'bg-orange text-white' : 'bg-surface/95 text-text-muted hover:text-orange']"
              :aria-label="post.isLiked ? 'Unlike' : 'Like'"
            >
              <BaseIcons name="heart" :solid="post.isLiked" size="sm" />
            </button>
            <button
              @click="toggleSave"
              :class="['w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-card', post.isSaved ? 'bg-orange text-white' : 'bg-surface/95 text-text-muted hover:text-orange']"
              :aria-label="post.isSaved ? 'Unsave' : 'Save'"
            >
              <BaseIcons name="bookmark" :solid="post.isSaved" size="sm" />
            </button>
            <button
              @click="shareRecipe"
              class="w-10 h-10 rounded-full bg-surface/95 text-text-muted hover:text-orange flex items-center justify-center transition-colors shadow-card"
              aria-label="Share"
            >
              <BaseIcons name="share" size="sm" />
            </button>
          </div>
        </div>

        <!-- Right: Content side -->
        <div class="flex-1 flex flex-col h-full bg-surface dark:bg-surface overflow-hidden relative">
          <!-- Header -->
          <div class="p-7 pb-5 pt-12 md:pt-7">
            <div class="flex items-center gap-3 mb-3.5">
              <span class="px-3 py-1 rounded-full bg-orange-soft text-orange-deep dark:text-orange-light text-[11px] font-semibold capitalize">
                {{ post.category }}
              </span>
              <div class="flex items-center gap-1 text-text-muted font-semibold text-xs">
                <BaseIcons name="star" solid size="xs" class="text-orange" />
                <span class="tabular-nums">{{ post.averageRating?.toFixed(1) || "0.0" }}</span>
                <span class="text-text-dim font-normal">({{ post.ratingCount }})</span>
              </div>
            </div>

            <h2
              class="font-montserrat font-extrabold text-2xl sm:text-3xl tracking-tight leading-tight mb-5 text-text dark:text-text"
            >
              {{ post.title }}
            </h2>

            <div
              class="flex items-center gap-3 py-3.5 border-y border-border"
            >
              <UserAvatar :user="post.user" size="md" />
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-text dark:text-text truncate">{{ post.user.displayName }}</p>
                <p class="text-xs text-text-dim truncate">@{{ post.user.username }}</p>
              </div>
              <div v-if="!isOwner">
                <FollowButton :user-id="post.user.id" :is-following="post.user.isFollowing" />
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-7 pb-7">
            <!-- Nutrition stats -->
            <div class="grid grid-cols-4 gap-2.5 mb-7">
              <div
                v-for="n in nutritionFacts"
                :key="n.label"
                :class="['rounded-2xl p-3.5 text-center border', n.accent ? 'bg-orange-soft border-transparent' : 'bg-background-secondary border-border']"
              >
                <BaseIcons
                  :name="n.icon"
                  size="sm"
                  :class="['mx-auto mb-1.5', n.accent ? 'text-orange' : 'text-text-dim']"
                />
                <span :class="['font-montserrat font-extrabold text-lg block tabular-nums', n.accent ? 'text-orange-deep dark:text-orange-light' : 'text-text dark:text-text']">{{ n.val }}</span>
                <span class="text-[10px] text-text-dim uppercase font-semibold tracking-wider">{{ n.label }}</span>
              </div>
            </div>

            <!-- Tabs -->
            <div class="flex gap-6 border-b border-border mb-6">
              <button
                v-for="t in ['ingredients', 'instructions', 'reviews']"
                :key="t"
                @click="activeTab = t"
                :class="[
                  'pb-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px',
                  activeTab === t
                    ? 'text-orange border-orange'
                    : 'text-text-muted border-transparent hover:text-text',
                ]"
              >
                {{ t }}
              </button>
            </div>

            <div v-if="activeTab === 'ingredients'" class="space-y-2.5">
              <div
                v-if="
                  post.recipe?.ingredients && post.recipe.ingredients.length > 0
                "
                class="space-y-2.5"
              >
                <div
                  v-for="(ing, idx) in post.recipe.ingredients"
                  :key="idx"
                  class="flex items-center gap-3 p-3.5 bg-background-secondary rounded-xl border border-border"
                >
                  <div class="w-1.5 h-1.5 rounded-full bg-orange shrink-0"></div>
                  <span class="text-sm font-medium text-text dark:text-text">{{ ing.name }}</span>
                  <span class="ml-auto text-xs font-semibold text-orange tabular-nums">{{
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

            <div v-if="activeTab === 'instructions'" class="space-y-5">
              <div
                v-if="
                  post.recipe?.instructions &&
                  post.recipe.instructions.length > 0
                "
                class="space-y-5"
              >
                <div
                  v-for="step in post.recipe.instructions"
                  :key="step.step"
                  class="flex gap-4"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-orange-soft text-orange font-montserrat font-bold text-sm flex items-center justify-center shrink-0 tabular-nums"
                  >
                    {{ step.step }}
                  </div>
                  <p class="text-sm text-text-muted dark:text-text-muted leading-relaxed pt-1">
                    {{ step.text }}
                  </p>
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
                  <div class="my-6 border-b border-border"></div>
               </div>
               <RatingList ref="ratingListRef" :post-id="post.id" />
               <div class="my-8"></div>
               <CommentSection :post-id="post.id" />
            </div>

            <!-- Variations -->
            <div class="mt-8 pt-7 border-t border-border">
               <VariationList :post-id="post.id" />
            </div>
          </div>

          <!-- Footer -->
          <div class="p-5 px-7 border-t border-border bg-surface dark:bg-surface flex gap-2.5">
            <button
              @click="showCollectionModal = true"
              class="flex-1 btn-secondary py-3 !text-sm flex items-center justify-center gap-2"
            >
              <BaseIcons name="folder-plus" size="sm" />
              Save
            </button>
            <button
              @click="forkRecipe"
              :disabled="isForkDisabled"
              :title="forkDisabledReason"
              class="flex-1 py-3 rounded-btn border border-border font-semibold text-sm text-text-muted hover:border-orange hover:text-orange flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BaseIcons name="arrow-path-rounded-square" size="sm" :class="{ 'animate-spin': isForking }" />
              {{ isForking ? 'Forking…' : 'Fork' }}
            </button>
            <button
              @click="showExperiment = true"
              class="flex-1 btn-primary py-3 !text-sm flex items-center justify-center gap-2"
            >
              <BaseIcons name="sparkles" size="sm" />
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
</style>
