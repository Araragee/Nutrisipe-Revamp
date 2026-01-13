<script setup lang="ts">
import { ref, computed } from 'vue'
import { socialApi } from '@/http/endpoints/social'
import { useFeedStore } from '@/stores/feed'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import UserAvatar from '@/components/user/UserAvatar.vue'
import LazyImage from '@/components/ui/LazyImage.vue'
import { formatNumber } from '@/utils/format'
import type { Post } from '@/typescript/interface/Post'

interface Props {
  post: Post
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [postId: string]
}>()

const feedStore = useFeedStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const isHovered = ref(false)
const isFollowingUser = ref(props.post.user.isFollowing || false)
const isFollowLoading = ref(false)

const isOwnPost = computed(() => authStore.user?.id === props.post.user.id)
const showFollowButton = computed(() => !isOwnPost.value && !isFollowingUser.value)

async function toggleLike(event: Event) {
  event.stopPropagation()

  const wasLiked = props.post.isLiked
  const previousCount = props.post.likeCount

  feedStore.updatePostEngagement(props.post.id, {
    isLiked: !wasLiked,
    likeCount: wasLiked ? previousCount - 1 : previousCount + 1,
  })

  try {
    if (wasLiked) {
      await socialApi.unlikePost(props.post.id)
    } else {
      await socialApi.likePost(props.post.id)
    }
  } catch (error) {
    feedStore.updatePostEngagement(props.post.id, {
      isLiked: wasLiked,
      likeCount: previousCount,
    })
    uiStore.showToast('Failed to update like', 'error')
  }
}

async function toggleSave(event: Event) {
  event.stopPropagation()

  const wasSaved = props.post.isSaved
  const previousCount = props.post.saveCount

  feedStore.updatePostEngagement(props.post.id, {
    isSaved: !wasSaved,
    saveCount: wasSaved ? previousCount - 1 : previousCount + 1,
  })

  try {
    if (wasSaved) {
      await socialApi.unsavePost(props.post.id)
    } else {
      await socialApi.savePost(props.post.id)
    }
  } catch (error) {
    feedStore.updatePostEngagement(props.post.id, {
      isSaved: wasSaved,
      saveCount: previousCount,
    })
    uiStore.showToast('Failed to update save', 'error')
  }
}

async function toggleFollow(event: Event) {
  event.stopPropagation()

  if (isFollowLoading.value) return

  isFollowLoading.value = true

  try {
    if (isFollowingUser.value) {
      await usersStore.unfollowUser(props.post.user.id)
      isFollowingUser.value = false
      uiStore.showToast('Unfollowed user', 'success')
    } else {
      await usersStore.followUser(props.post.user.id)
      isFollowingUser.value = true
      uiStore.showToast('Following user', 'success')
    }
  } catch (error) {
    uiStore.showToast('Failed to update follow status', 'error')
  } finally {
    isFollowLoading.value = false
  }
}
</script>

<template>
  <div
    class="group relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-xl transition-shadow cursor-pointer"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="emit('click', post.id)"
  >
    <div class="relative">
      <LazyImage :src="post.imageUrl" :alt="post.title" class="w-full h-auto object-cover" />

      <div
        v-if="isHovered"
        class="absolute inset-0 bg-black bg-opacity-40 transition-opacity flex items-center justify-center gap-2"
      >
        <button
          @click="toggleSave"
          class="p-3 bg-white rounded-full hover:scale-110 transition-transform"
          :class="{ 'text-primary-base': post.isSaved }"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </button>
      </div>
    </div>

    <div class="p-4">
      <h3 class="font-semibold text-lg line-clamp-2 text-gray-900 dark:text-white">
        {{ post.title }}
      </h3>

      <div class="flex items-center justify-between mt-3">
        <div class="flex items-center min-w-0 flex-1">
          <UserAvatar :user="post.user" size="sm" />
          <span class="ml-2 text-sm text-gray-600 dark:text-gray-400 truncate">
            {{ post.user.displayName }}
          </span>
        </div>

        <button
          v-if="showFollowButton && isHovered"
          @click="toggleFollow"
          :disabled="isFollowLoading"
          class="ml-2 px-3 py-1 text-xs font-medium bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {{ isFollowLoading ? '...' : 'Follow' }}
        </button>
      </div>

      <div class="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400 gap-4">
        <button
          @click="toggleLike"
          class="flex items-center hover:text-error-base transition-colors"
          :class="{ 'text-error-base': post.isLiked }"
        >
          <svg
            class="w-5 h-5 mr-1"
            :fill="post.isLiked ? 'currentColor' : 'none'"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{{ formatNumber(post.likeCount) }}</span>
        </button>

        <span class="flex items-center">
          <svg class="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          <span>{{ formatNumber(post.saveCount) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
