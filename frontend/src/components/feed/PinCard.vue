<script setup lang="ts">
import { ref, computed } from "vue";
import { socialApi } from "@/http/endpoints/social";
import { useFeedStore } from "@/stores/feed";
import { useUsersStore } from "@/stores/users";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import UserAvatar from "@/components/user/UserAvatar.vue";
import { formatNumber } from "@/utils/format";
import type { Post } from "@/typescript/interface/Post";

interface Props {
  post: Post;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [postId: string];
}>();

const feedStore = useFeedStore();
const usersStore = useUsersStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

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

const aspectVariants = [
  { class: "aspect-[3/4]", ratio: 3 / 4 },
  { class: "aspect-[4/5]", ratio: 4 / 5 },
  { class: "aspect-[2/3]", ratio: 2 / 3 },
  { class: "aspect-square", ratio: 1 },
  { class: "aspect-[3/5]", ratio: 3 / 5 },
  { class: "aspect-[5/6]", ratio: 5 / 6 },
] as const;

const aspectVariant = computed(() => {
  let hash = 0;
  for (let i = 0; i < props.post.id.length; i++) {
    hash = (hash << 5) - hash + props.post.id.charCodeAt(i);
    hash |= 0;
  }
  return aspectVariants[Math.abs(hash) % aspectVariants.length];
});

const placeholderHeight = computed(() =>
  Math.round(400 / aspectVariant.value.ratio),
);

const recipeImage = computed(() => {
  if (!props.post.imageUrl)
    return `https://picsum.photos/400/${placeholderHeight.value}?random=${props.post.id}`;
  if (props.post.imageUrl.startsWith("http")) return props.post.imageUrl;
  return `http://localhost:3001/${props.post.imageUrl}`;
});

const tags = computed(() => {
  return props.post.tags || ["Healthy", "Nutrisipe"];
});

const nutriScoreClass = computed(() => {
  const score = props.post.recipe?.nutriScore;
  switch (score) {
    case "A":
      return "bg-[#008b4c]";
    case "B":
      return "bg-[#85bb2f]";
    case "C":
      return "bg-[#fecb02]";
    case "D":
      return "bg-[#ee8100]";
    case "E":
      return "bg-[#e63e11]";
    default:
      return "bg-gray-500";
  }
});
</script>

<template>
  <div
    class="recipe-card group relative rounded-card overflow-hidden cursor-pointer shadow-card transition-all duration-revamp border-1.5 border-glass-border bg-[#111] w-full"
    :class="aspectVariant.class"
    @click="emit('click', post.id)"
  >
    <!-- Background Image -->
    <img
      :src="recipeImage"
      :alt="post.title"
      loading="lazy"
      decoding="async"
      class="recipe-img w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
    />

    <!-- Top Actions -->
    <button
      @click="toggleLike"
      class="card-heart-btn absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer transition-all duration-revamp group-hover:opacity-100 group-hover:translate-y-0 opacity-0 -translate-y-1 scale-90"
      :class="{
        'liked bg-orange/85 !opacity-100 !translate-y-0 !scale-100':
          post.isLiked,
      }"
    >
      <span class="text-white text-base">{{ post.isLiked ? "❤️" : "🤍" }}</span>
    </button>

    <div
      class="card-like-count absolute top-3 right-14 z-10 bg-black/45 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 font-montserrat font-bold text-xs text-white transition-all duration-revamp delay-75 group-hover:opacity-100 group-hover:translate-y-0 opacity-0 -translate-y-1 scale-90"
      :class="{ '!opacity-100 !translate-y-0 !scale-100': post.isLiked }"
    >
      {{ formatNumber(post.likeCount) }}
    </div>

    <!-- Nutri-Score -->
    <div
      v-if="post.recipe?.nutriScore"
      class="absolute top-3 left-3 z-10 px-2 py-1 rounded-md font-montserrat font-extrabold text-[10px] text-white shadow-lg backdrop-blur-md border border-white/20"
      :class="nutriScoreClass"
    >
      Nutri-Score {{ post.recipe.nutriScore }}
    </div>

    <!-- Bottom Overlay -->
    <div
      class="card-overlay absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none"
    >
      <div class="card-tags flex gap-1.5 flex-wrap mb-2">
        <span
          v-for="tag in tags.slice(0, 2)"
          :key="tag"
          class="card-tag px-2.5 py-0.5 rounded-full bg-orange/75 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider uppercase"
        >
          {{ tag }}
        </span>
      </div>

      <h3
        class="card-title font-montserrat font-extrabold text-sm leading-snug text-white drop-shadow-md mb-2.5"
      >
        {{ post.title }}
      </h3>

      <div class="card-author-row flex items-center gap-2 pointer-events-auto">
        <UserAvatar
          :user="post.user"
          size="sm"
          class="!w-6.5 !h-6.5 border-1.5 border-white/50"
        />
        <span
          class="card-author-name text-xs font-semibold text-white/90 truncate"
        >
          {{ post.user.displayName }}
        </span>
        <span class="card-time ml-auto text-[11px] font-medium text-white/65">
          {{ post.category }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recipe-card:hover {
  transform: translateY(-7px) scale(1.015);
  box-shadow: 0 20px 56px rgba(20, 10, 0, 0.2);
}
</style>
