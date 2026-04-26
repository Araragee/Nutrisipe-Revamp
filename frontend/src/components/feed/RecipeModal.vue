<script setup lang="ts">
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
import { variationsApi } from "@/http/endpoints/variations";
import { ratingsApi } from "@/http/endpoints/ratings";
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
const isForking = ref(false);

const isOwner = computed(() => authStore.user?.id === post.value?.userId);

const nutritionFacts = computed(() => {
  const n = post.value?.recipe?.nutrition;
  return [
    { label: "Calories", val: n?.calories || "0", unit: "kcal", icon: "⚡" },
    { label: "Protein", val: n?.protein || "0", unit: "g", icon: "💪" },
    { label: "Carbs", val: n?.carbs || "0", unit: "g", icon: "🌾" },
    { label: "Fat", val: n?.fat || "0", unit: "g", icon: "🥑" },
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
    console.error("Failed to fork recipe:", error);
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
    console.error("Fetch post error:", error);
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
    console.error("Failed to submit rating:", error);
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

const recipeImage = computed(() => {
  return post.value?.imageUrl || `https://picsum.photos/800/1000?random=${post.value?.id || Math.random()}`;
});
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/75 backdrop-blur-md animate-revamp"
  >
    <div
      class="bg-background w-full max-w-5xl h-full max-h-[90vh] rounded-[32px] overflow-hidden shadow-modal border-1.5 border-glass-border flex animate-modalIn"
      @click.stop
    >
      <div v-if="isLoading" class="flex-1 flex items-center justify-center">
        <div
          class="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"
        ></div>
      </div>

      <template v-else-if="post">
        <!-- Left: Image side -->
        <div
          class="hidden md:block w-[45%] h-full relative overflow-hidden bg-black"
        >
          <img
            :src="recipeImage"
            class="w-full h-full object-cover opacity-90"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          ></div>
          <button
            @click="emit('close')"
            class="absolute top-6 left-6 w-10.5 h-10.5 rounded-full bg-black/45 backdrop-blur-lg border border-white/20 flex items-center justify-center text-white text-xl cursor-pointer hover:bg-black/70 transition-all"
          >
            ‹
          </button>
        </div>

        <!-- Right: Content side -->
        <div
          class="flex-1 flex flex-col h-full bg-background overflow-hidden relative"
        >
          <!-- Close button -->
          <button
            @click="emit('close')"
            class="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl transition-all border border-white/10 shadow-lg"
          >
            ✕
          </button>

          <!-- Header -->
          <div class="p-8 pb-6">
            <div class="flex items-center gap-3 mb-4">
              <span
                class="px-3.5 py-1 rounded-full bg-orange text-white text-[11px] font-bold tracking-wider uppercase"
              >
                {{ post.category }}
              </span>
              <div
                class="flex items-center gap-1.5 text-orange font-bold text-xs"
              >
                <span>★</span> {{ post.averageRating?.toFixed(1) || "0.0" }} ({{
                  post.ratingCount
                }})
              </div>
              <button
                @click="toggleLike"
                class="ml-auto w-10 h-10 rounded-full bg-background-secondary border border-glass-border flex items-center justify-center transition-all"
                :class="post.isLiked ? 'text-orange' : 'text-text-dim'"
              >
                {{ post.isLiked ? '❤️' : '🤍' }}
              </button>
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
                <span class="text-xl mb-1.5 block">{{ n.icon }}</span>
                <span class="font-montserrat font-extrabold text-lg block">{{
                  n.val
                }}</span>
                <span
                  class="text-[10px] text-text-dim uppercase font-bold tracking-wider"
                  >{{ n.label }}</span
                >
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
          <div
            class="p-6 px-8 border-t border-glass-border bg-background flex gap-4"
          >
            <button
              @click="showCollectionModal = true"
              class="flex-1 btn-secondary py-3.5 !text-sm flex items-center justify-center gap-2"
            >
              <span>📁</span> Save
            </button>
            <button
              @click="forkRecipe"
              :disabled="isForking"
              class="flex-1 btn-primary py-3.5 !text-sm flex items-center justify-center gap-2"
            >
              <span>{{ isForking ? '⏳' : '🍴' }}</span> Fork
            </button>
          </div>
        </div>
      </template>
    </div>

    <CollectionModal v-if="post && showCollectionModal" :show="showCollectionModal" :post-id="post.id" @close="showCollectionModal = false" />
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
</style>
