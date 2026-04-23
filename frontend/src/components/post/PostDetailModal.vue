<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getPostById } from '@/http/posts'
import { socialApi } from '@/http/endpoints/social'
import UserAvatar from '@/components/user/UserAvatar.vue'
import CommentSection from '@/components/post/CommentSection.vue'
import type { Post } from '@/typescript/interface/Post'

const props = defineProps<{
  postId: string | null
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const post = ref<Post | null>(null)
const isLoading = ref(false)
const activeTab = ref<'details' | 'comments'>('details')

const formattedDate = computed(() => {
  if (!post.value) return ''
  const date = new Date(post.value.createdAt)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

async function loadPost() {
  if (!props.postId) return

  isLoading.value = true
  try {
    post.value = await getPostById(props.postId)
  } catch (error) {
    console.error('Failed to load post:', error)
  } finally {
    isLoading.value = false
  }
}

function handleClose() {
  emit('close')
  post.value = null
}

async function toggleLike() {
  if (!post.value) return

  const postId = post.value.id
  const wasLiked = post.value.isLiked

  // Optimistic update
  post.value.isLiked = !wasLiked
  post.value.likeCount += wasLiked ? -1 : 1

  try {
    if (wasLiked) {
      await socialApi.unlikePost(postId)
    } else {
      await socialApi.likePost(postId)
    }
  } catch (error) {
    // Revert on error
    post.value.isLiked = wasLiked
    post.value.likeCount += wasLiked ? 1 : -1
  }
}

async function toggleSave() {
  if (!post.value) return

  const postId = post.value.id
  const wasSaved = post.value.isSaved

  // Optimistic update
  post.value.isSaved = !wasSaved
  post.value.saveCount += wasSaved ? -1 : 1

  try {
    if (wasSaved) {
      await socialApi.unsavePost(postId)
    } else {
      await socialApi.savePost(postId)
    }
  } catch (error) {
    // Revert on error
    post.value.isSaved = wasSaved
    post.value.saveCount += wasSaved ? 1 : -1
  }
}

async function handleShare() {
  if (!post.value) return

  const postUrl = `${window.location.origin}/post/${post.value.id}`

  try {
    if (navigator.share) {
      await navigator.share({
        title: post.value.title,
        text: post.value.description || '',
        url: postUrl,
      })
    } else {
      await navigator.clipboard.writeText(postUrl)
      alert('Link copied to clipboard!')
    }
  } catch (error) {
    console.error('Failed to share:', error)
  }
}

onMounted(() => {
  if (props.show && props.postId) {
    loadPost()
  }
})

watch(() => [props.show, props.postId], ([show, postId]) => {
  if (show && postId) {
    loadPost()
  }
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
      <div v-if="isLoading" class="flex items-center justify-center w-full p-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>

      <template v-else-if="post">
        <!-- Image Section -->
        <div class="md:w-2/3 bg-black flex items-center justify-center">
          <img
            :src="post.imageUrl"
            :alt="post.title"
            class="w-full h-full object-contain max-h-[90vh]"
          />
        </div>

        <!-- Details Section -->
        <div class="md:w-1/3 flex flex-col max-h-[90vh]">
          <!-- Header -->
          <div class="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <RouterLink :to="`/profile/${post.user.id}`" @click="handleClose">
                <UserAvatar :user="post.user" size="md" />
              </RouterLink>
              <div>
                <RouterLink
                  :to="`/profile/${post.user.id}`"
                  @click="handleClose"
                  class="font-semibold text-gray-900 hover:text-orange-500 transition-colors"
                >
                  {{ post.user.displayName }}
                </RouterLink>
                <p class="text-xs text-gray-500">@{{ post.user.username }}</p>
              </div>
            </div>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-gray-200 flex-shrink-0">
            <button
              @click="activeTab = 'details'"
              :class="[
                'flex-1 px-4 py-3 font-medium transition-colors',
                activeTab === 'details'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
              ]"
            >
              Details
            </button>
            <button
              @click="activeTab = 'comments'"
              :class="[
                'flex-1 px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2',
                activeTab === 'comments'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
              ]"
            >
              Comments
              <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {{ post.commentCount }}
              </span>
            </button>
          </div>

          <!-- Content -->
          <div v-if="activeTab === 'details'" class="flex-1 overflow-y-auto">
            <div class="p-4 space-y-4">
            <!-- Title -->
            <h2 class="text-2xl font-bold text-gray-900">{{ post.title }}</h2>

            <!-- Category Badge -->
            <div>
              <span class="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                {{ post.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }}
              </span>
            </div>

            <!-- Description -->
            <p v-if="post.description" class="text-gray-700 leading-relaxed">
              {{ post.description }}
            </p>

            <!-- Tags -->
            <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="tag in post.tags"
                :key="tag"
                class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                #{{ tag }}
              </span>
            </div>

            <!-- Date -->
            <p class="text-sm text-gray-500">Posted on {{ formattedDate }}</p>
            </div>

            <!-- Actions -->
            <div class="p-4 border-t border-gray-200 space-y-3 flex-shrink-0">
            <!-- Engagement Stats -->
            <div class="flex items-center gap-6 text-sm text-gray-600">
              <div class="flex items-center gap-1">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                </svg>
                <span>{{ post.likeCount }}</span>
              </div>
              <div class="flex items-center gap-1">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                <span>{{ post.saveCount }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button
                @click="toggleLike"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                  post.isLiked
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                <svg class="w-5 h-5" :fill="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {{ post.isLiked ? 'Liked' : 'Like' }}
              </button>

              <button
                @click="toggleSave"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                  post.isSaved
                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                <svg class="w-5 h-5" :fill="post.isSaved ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {{ post.isSaved ? 'Saved' : 'Save' }}
              </button>

              <button
                @click="handleShare"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
            </div>
          </div>

          <!-- Comments Tab Content -->
          <div v-else-if="activeTab === 'comments'" class="flex-1 overflow-hidden">
            <CommentSection :post-id="post.id" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
