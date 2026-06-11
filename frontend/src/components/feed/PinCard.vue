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
import { resolveSrcset } from "@/utils/imageUrl";
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
  resolveSrcset(props.post.imageUrl, props.post.id, [400, 800, 1200]),
);

const nutriScoreClass = computed(() => {
  const score = props.post.recipe?.nutriScore?.toLowerCase();
  switch (score) {
    case "a":
      return "bg-nutriscore-a";
    case "b":
      return "bg-nutriscore-b";
    case "c":
      return "bg-nutriscore-c";
    case "d":
      return "bg-nutriscore-d";
    case "e":
      return "bg-nutriscore-e";
    default:
      return "bg-gray-500";
  }
});

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
    if (wasLiked) {
      await socialApi.unlikePost(props.post.id);
    } else {
      await socialApi.likePost(props.post.id);
    }
  } catch (error) {
    feedStore.updatePostEngagement(props.post.id, {
      isLiked: wasLiked,
      likeCount: previousCount,
    });
    uiStore.showToast("Failed to update like", "error");
  }
}
</script>

<template>
  <div
    class="recipe-card group cursor-pointer overflow-hidden rounded-card bg-surface dark:bg-surface border border-border shadow-card hover:shadow-card-hover transition-all duration-revamp w-full"
    @click="emit('click', post.id)"
  >
    <!-- Image -->
    <div :class="['relative overflow-hidden', aspectVariant.class]">
      <img
        :src="recipeImage.src"
        :srcset="recipeImage.srcset"
        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
        :alt="post.title"
        loading="lazy"
        decoding="async"
        @load="imageLoaded = true"
        :class="[
          'w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] will-change-transform',
          imageLoaded ? 'opacity-100' : 'opacity-0',
        ]"
      />
      <div
        v-if="!imageLoaded"
        class="absolute inset-0 bg-background-secondary dark:bg-background-secondary animate-pulse"
        aria-hidden="true"
      ></div>

      <!-- Nutri-Score -->
      <div
        v-if="post.recipe?.nutriScore"
        class="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md font-bold text-[11px] text-white"
        :class="nutriScoreClass"
      >
        {{ post.recipe.nutriScore }}
      </div>

      <!-- Like -->
      <button
        @click="toggleLike"
        class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-900/95 flex items-center justify-center transition-all duration-revamp opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
        :class="{ '!opacity-100 !translate-y-0': post.isLiked }"
        :aria-label="post.isLiked ? 'Unlike recipe' : 'Like recipe'"
      >
        <BaseIcons
          name="heart"
          :solid="post.isLiked"
          size="sm"
          :class="post.isLiked ? 'text-orange' : 'text-text-muted dark:text-text-muted'"
        />
      </button>
    </div>

    <!-- Footer -->
    <div class="p-3.5 flex flex-col gap-2">
      <MacroPills :nutrition="post.recipe?.nutrition" size="sm" />

      <h3 class="font-semibold text-[14px] leading-snug text-text dark:text-text line-clamp-2">
        {{ post.title }}
      </h3>

      <div class="flex items-center gap-2">
        <UserAvatar :user="post.user" size="sm" class="!w-6 !h-6 shrink-0" />
        <span class="text-xs text-text-muted dark:text-text-muted truncate">
          {{ post.user.displayName }}
        </span>

        <div class="ml-auto flex items-center gap-2.5 text-text-dim dark:text-text-dim shrink-0">
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
</template>

<style scoped>
.recipe-card:hover {
  transform: translateY(-3px);
}
</style>
