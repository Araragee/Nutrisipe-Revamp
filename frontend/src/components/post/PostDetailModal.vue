<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, computed, onMounted, watch } from 'vue'
import { postsApi } from '@/http/endpoints/posts'
import { usePostActions } from '@/composables/usePostActions'
import { resolveImage } from '@/utils/imageUrl'
import { formatNumber } from '@/utils/format'
import UserAvatar from '@/components/user/UserAvatar.vue'
import FollowButton from '@/components/user/FollowButton.vue'
import CommentSection from '@/components/post/CommentSection.vue'
import BaseIcons from '@/components/base/BaseIcons.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import type { Post } from '@/typescript/interface/Post'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  postId: string | null
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const post = ref<Post | null>(null)
const isLoading = ref(false)
const activeTab = ref<'details' | 'comments'>('details')

const { toggleLike, toggleSave, sharePost: handleShare } = usePostActions(post)

const isOwnPost = computed(() => post.value?.user.id === authStore.user?.id)

const formattedDate = computed(() => {
  if (!post.value) return ''
  const date = new Date(post.value.createdAt)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

const categoryLabel = computed(() => {
  if (!post.value) return ''
  return post.value.category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
})

async function loadPost() {
  if (!props.postId) return

  isLoading.value = true
  try {
    post.value = (await postsApi.getById(props.postId)).data.data
    activeTab.value = 'details'
  } catch (error) {
    logger.error('Failed to load post:', error)
  } finally {
    isLoading.value = false
  }
}

function handleClose() {
  emit('close')
  post.value = null
}

onMounted(() => {
  if (props.show && props.postId) {
    loadPost()
  }
})

watch(
  () => [props.show, props.postId],
  ([show, postId]) => {
    if (show && postId) {
      loadPost()
    }
  },
)
</script>

<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-5"
      @click.self="handleClose"
    >
      <div
        class="modal-card relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-modal md:flex-row"
      >
        <!-- Close -->
        <button
          @click="handleClose"
          type="button"
          aria-label="Close"
          class="absolute right-4 top-4 z-30 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-[transform,background-color] duration-200 ease-revamp hover:bg-black/60 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <BaseIcons name="x-mark" size="sm" />
        </button>

        <div v-if="isLoading" class="grid w-full place-items-center p-16">
          <LoadingSpinner size="lg" color="border-orange" />
        </div>

        <template v-else-if="post">
          <!-- Image stage -->
          <div class="hidden flex-col items-center justify-center bg-black md:flex md:w-3/5">
            <img
              :src="resolveImage(post.imageUrl, post.id)"
              :alt="post.title"
              class="max-h-[92vh] w-full object-contain"
            />
          </div>

          <!-- Detail rail -->
          <div class="flex w-full flex-col md:w-2/5">
            <!-- Author header -->
            <div class="flex shrink-0 items-center justify-between gap-3 border-b border-border p-4">
              <div class="flex min-w-0 items-center gap-3">
                <RouterLink :to="`/profile/${post.user.id}`" @click="handleClose">
                  <UserAvatar :user="post.user" size="md" />
                </RouterLink>
                <div class="min-w-0">
                  <RouterLink
                    :to="`/profile/${post.user.id}`"
                    @click="handleClose"
                    class="block truncate font-montserrat text-sm font-bold text-text transition-colors hover:text-orange"
                  >
                    {{ post.user.displayName }}
                  </RouterLink>
                  <p class="truncate text-xs text-text-dim">@{{ post.user.username }}</p>
                </div>
              </div>
              <FollowButton
                v-if="!isOwnPost"
                :user-id="post.user.id"
                :is-following="post.user.isFollowing"
                size="sm"
              />
            </div>

            <!-- Mobile image -->
            <div class="bg-black md:hidden">
              <img
                :src="resolveImage(post.imageUrl, post.id)"
                :alt="post.title"
                class="max-h-64 w-full object-cover"
              />
            </div>

            <!-- Tabs -->
            <div class="flex shrink-0 gap-1 border-b border-border px-2">
              <button
                v-for="tab in (['details', 'comments'] as const)"
                :key="tab"
                @click="activeTab = tab"
                :class="[
                  'relative flex flex-1 items-center justify-center gap-1.5 px-4 py-3 font-montserrat text-xs font-bold uppercase tracking-widest transition-colors duration-200 ease-revamp',
                  activeTab === tab ? 'text-orange' : 'text-text-dim hover:text-text',
                ]"
              >
                {{ tab }}
                <span
                  v-if="tab === 'comments'"
                  class="rounded-full bg-background-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-text-dim"
                  >{{ post.commentCount }}</span
                >
                <span
                  v-if="activeTab === tab"
                  class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-orange"
                ></span>
              </button>
            </div>

            <!-- Details -->
            <div v-if="activeTab === 'details'" class="flex min-h-0 flex-1 flex-col">
              <div class="flex-1 space-y-4 overflow-y-auto p-5">
                <div>
                  <span
                    class="inline-flex items-center rounded-full bg-orange-soft px-3 py-1 font-montserrat text-[10px] font-bold uppercase tracking-widest text-orange"
                    >{{ categoryLabel }}</span
                  >
                  <h2 class="mt-3 text-balance font-montserrat text-2xl font-extrabold tracking-tight text-text">
                    {{ post.title }}
                  </h2>
                </div>

                <p v-if="post.description" class="text-pretty leading-relaxed text-text-muted">
                  {{ post.description }}
                </p>

                <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in post.tags"
                    :key="tag"
                    class="rounded-full bg-background-secondary px-3 py-1 text-xs font-medium text-text-muted"
                    >#{{ tag }}</span
                  >
                </div>

                <p class="text-xs text-text-dim">Posted {{ formattedDate }}</p>
              </div>

              <!-- Action bar -->
              <div class="shrink-0 space-y-3 border-t border-border p-4">
                <div class="flex items-center gap-5 text-sm text-text-dim">
                  <span class="flex items-center gap-1.5">
                    <BaseIcons name="heart" size="sm" :solid="post.isLiked" :class="post.isLiked ? 'text-orange' : ''" />
                    <span class="tabular-nums">{{ formatNumber(post.likeCount) }}</span>
                  </span>
                  <span class="flex items-center gap-1.5">
                    <BaseIcons name="bookmark" size="sm" :solid="post.isSaved" :class="post.isSaved ? 'text-orange' : ''" />
                    <span class="tabular-nums">{{ formatNumber(post.saveCount) }}</span>
                  </span>
                </div>

                <div class="flex gap-2">
                  <button
                    @click="toggleLike"
                    :class="[
                      'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-montserrat text-xs font-bold uppercase tracking-widest transition-[transform,background-color,color] duration-200 ease-revamp active:scale-[0.96]',
                      post.isLiked
                        ? 'bg-orange text-white shadow-[0_4px_16px_rgba(255,107,53,0.3)]'
                        : 'bg-background-secondary text-text hover:text-orange',
                    ]"
                  >
                    <BaseIcons name="heart" size="sm" :solid="post.isLiked" />
                    {{ post.isLiked ? 'Liked' : 'Like' }}
                  </button>

                  <button
                    @click="toggleSave"
                    :class="[
                      'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-montserrat text-xs font-bold uppercase tracking-widest transition-[transform,background-color,color] duration-200 ease-revamp active:scale-[0.96]',
                      post.isSaved
                        ? 'bg-orange-soft text-orange'
                        : 'bg-background-secondary text-text hover:text-orange',
                    ]"
                  >
                    <BaseIcons name="bookmark" size="sm" :solid="post.isSaved" />
                    {{ post.isSaved ? 'Saved' : 'Save' }}
                  </button>

                  <button
                    @click="handleShare"
                    aria-label="Share"
                    class="grid w-12 place-items-center rounded-xl bg-background-secondary text-text transition-[transform,color] duration-200 ease-revamp hover:text-orange active:scale-[0.94]"
                  >
                    <BaseIcons name="share" size="sm" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Comments -->
            <div v-else-if="activeTab === 'comments'" class="min-h-0 flex-1 overflow-y-auto p-5">
              <CommentSection :post-id="post.id" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-enter-active .modal-card {
  transition: transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.25s ease;
}
.modal-leave-active .modal-card {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-card {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
}
.modal-leave-to .modal-card {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-card,
  .modal-leave-active .modal-card {
    transition: none;
  }
}
</style>
