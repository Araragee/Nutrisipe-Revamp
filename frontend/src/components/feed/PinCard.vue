<script setup lang="ts">
import { ref, computed } from "vue";
import { socialApi } from "@/http/endpoints/social";
import { useFeedStore } from "@/stores/feed";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import UserAvatar from "@/components/user/UserAvatar.vue";
import BaseIcons from "@/components/base/BaseIcons.vue";
import MacroPills from "@/components/recipe/MacroPills.vue";
import { formatNumber } from "@/utils/format";
import { resolveImage } from "@/utils/imageUrl";
import type { Post } from "@/typescript/interface/Post";

interface Props {
  post: Post;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [postId: string];
}>();

const feedStore = useFeedStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

const aspectVariants = [
  { class: "aspect-[3/4]", ratio: 3 / 4 },
  { class: "aspect-[4/5]", ratio: 4 / 5 },
  { class: "aspect-[2/3]", ratio: 2 / 3 },
  { class: "aspect-square", ratio: 1 },
  { class: "aspect-[3/5]", ratio: 3 / 5 },
  { class: "aspect-[5/6]", ratio: 5 / 6 },
] as const;

const imageLoaded = ref(false);

const aspectVariant = computed(() => {
  let hash = 0;
  for (let i = 0; i < props.post.id.length; i++) {
    hash = (hash << 5) - hash + props.post.id.charCodeAt(i);
    hash |= 0;
  }
  return aspectVariants[Math.abs(hash) % aspectVariants.length];
});

const recipeImage = computed(() =>
  resolveImage(props.post.imageUrl, props.post.id),
);

// Nutri-Score uses regulatory traffic-light colors — never re-themed.
const nutriScoreClass = computed(() => {
  const score = props.post.recipe?.nutriScore?.toLowerCase();
  return (
    {
      a: "bg-nutriscore-a",
      b: "bg-nutriscore-b",
      c: "bg-nutriscore-c",
      d: "bg-nutriscore-d",
      e: "bg-nutriscore-e",
    }[score ?? ""] ?? "bg-gray-500"
  );
});

const hasRating = computed(() => props.post.ratingCount > 0);

async function toggleLike(event: Event) {
  event.stopPropagation();
  if (!authStore.isAuthenticated) return;

  const wasLiked = props.post.isLiked;
  const previousCount = props.post.likeCount;

  feedStore.updatePostEngagement(props.post.id, {
    isLiked: !wasLiked,
    likeCount: wasLiked ? Math.max(0, previousCount - 1) : previousCount + 1,
  });

  try {
    if (wasLiked) await socialApi.unlikePost(props.post.id);
    else await socialApi.likePost(props.post.id);
  } catch (error) {
    feedStore.updatePostEngagement(props.post.id, {
      isLiked: wasLiked,
      likeCount: previousCount,
    });
    uiStore.showToast("Failed to update like", "error");
  }
}

async function toggleSave(event: Event) {
  event.stopPropagation();
  if (!authStore.isAuthenticated) return;

  const wasSaved = props.post.isSaved;
  const previousCount = props.post.saveCount;

  feedStore.updatePostEngagement(props.post.id, {
    isSaved: !wasSaved,
    saveCount: wasSaved ? Math.max(0, previousCount - 1) : previousCount + 1,
  });

  try {
    if (wasSaved) await socialApi.unsavePost(props.post.id);
    else await socialApi.savePost(props.post.id);
  } catch (error) {
    feedStore.updatePostEngagement(props.post.id, {
      isSaved: wasSaved,
      saveCount: previousCount,
    });
    uiStore.showToast("Failed to update save", "error");
  }
}
</script>

<template>
  <div
    class="recipe-card group relative cursor-pointer overflow-hidden rounded-card bg-surface shadow-card transition-all duration-revamp ease-revamp w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    role="button"
    tabindex="0"
    :aria-label="post.title"
    @click="emit('click', post.id)"
    @keydown.enter.prevent="emit('click', post.id)"
    @keydown.space.prevent="emit('click', post.id)"
  >
    <!-- Image stage -->
    <div :class="['relative overflow-hidden', aspectVariant.class]">
      <img
        :src="recipeImage"
        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
        :alt="post.title"
        loading="lazy"
        decoding="async"
        @load="imageLoaded = true"
        :class="[
          'w-full h-full object-cover transition-transform duration-500 ease-revamp group-hover:scale-105 will-change-transform',
          imageLoaded ? 'opacity-100' : 'opacity-0',
        ]"
      />
      <div
        v-if="!imageLoaded"
        class="absolute inset-0 bg-background-secondary animate-pulse"
        aria-hidden="true"
      ></div>

      <!-- Legibility gradient: food stays vivid, chrome stays readable -->
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-90"
        aria-hidden="true"
      ></div>

      <!-- Nutri-Score (top-left, regulatory color) -->
      <div
        v-if="post.recipe?.nutriScore"
        class="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md font-montserrat font-bold text-[11px] tracking-wide text-white shadow-sm backdrop-blur-[2px]"
        :class="nutriScoreClass"
      >
        {{ post.recipe.nutriScore }}
      </div>

      <!-- Quick actions (top-right): save + like -->
      <div class="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
        <button
          @click="toggleSave"
          class="w-9 h-9 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white transition-all duration-revamp ease-revamp opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-black/55 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          :class="{ '!opacity-100 !translate-y-0': post.isSaved }"
          :aria-label="post.isSaved ? 'Unsave recipe' : 'Save recipe'"
          :aria-pressed="post.isSaved"
        >
          <BaseIcons
            name="bookmark"
            :solid="post.isSaved"
            size="sm"
            :class="post.isSaved ? 'text-orange' : 'text-white'"
          />
        </button>
        <button
          @click="toggleLike"
          class="w-9 h-9 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white transition-all duration-revamp ease-revamp opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-black/55 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          :class="{ '!opacity-100 !translate-y-0': post.isLiked }"
          :aria-label="post.isLiked ? 'Unlike recipe' : 'Like recipe'"
          :aria-pressed="post.isLiked"
        >
          <BaseIcons
            name="heart"
            :solid="post.isLiked"
            size="sm"
            :class="post.isLiked ? 'text-orange' : 'text-white'"
          />
        </button>
      </div>

      <!-- Overlay content: title, author, meta sit on the gradient -->
      <div class="absolute inset-x-0 bottom-0 z-10 p-3.5 flex flex-col gap-2">
        <MacroPills :nutrition="post.recipe?.nutrition" size="sm" />

        <h3
          class="font-montserrat font-bold text-[15px] leading-snug text-white line-clamp-2 [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]"
        >
          {{ post.title }}
        </h3>

        <div class="flex items-center gap-2">
          <UserAvatar :user="post.user" size="sm" class="!w-6 !h-6 shrink-0 ring-1 ring-white/40" />
          <span class="text-xs font-medium text-white/90 truncate">
            {{ post.user.displayName }}
          </span>

          <div class="ml-auto flex items-center gap-2.5 text-white/80 shrink-0">
            <span
              v-if="hasRating"
              class="inline-flex items-center gap-1 text-[11px] tabular-nums"
              :aria-label="`Rated ${post.averageRating.toFixed(1)} out of 5`"
            >
              <BaseIcons name="star" solid size="xs" class="text-yellow-400" />
              {{ post.averageRating.toFixed(1) }}
            </span>
            <span class="inline-flex items-center gap-1 text-[11px] tabular-nums">
              <BaseIcons name="heart" :solid="post.isLiked" size="xs" :class="post.isLiked ? 'text-orange' : ''" />
              {{ formatNumber(post.likeCount) }}
            </span>
            <span
              v-if="post.variationCount > 0"
              class="inline-flex items-center gap-1 text-[11px] tabular-nums"
            >
              <BaseIcons name="arrow-path-rounded-square" size="xs" />
              {{ formatNumber(post.variationCount) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}
@media (prefers-reduced-motion: reduce) {
  .recipe-card,
  .recipe-card img {
    transition: none !important;
  }
  .recipe-card:hover {
    transform: none;
  }
  .recipe-card:hover img {
    transform: none;
  }
}
</style>
