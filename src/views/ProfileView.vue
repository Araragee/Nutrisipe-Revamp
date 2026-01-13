<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { postsApi } from '@/http/endpoints/posts'
import LayoutThreeColumn from '@/components/layout/LayoutThreeColumn.vue'
import UserAvatar from '@/components/user/UserAvatar.vue'
import FollowButton from '@/components/user/FollowButton.vue'
import PinGrid from '@/components/feed/PinGrid.vue'
import EditProfileModal from '@/components/user/EditProfileModal.vue'
import PostDetailModal from '@/components/post/PostDetailModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatNumber } from '@/utils/format'
import type { Post } from '@/typescript/interface/Post'
import type { User } from '@/typescript/interface/User'

const route = useRoute()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const user = ref<User | null>(null)
const posts = ref<Post[]>([])
const isLoading = ref(true)
const showEditModal = ref(false)
const selectedPostId = ref<string | null>(null)
const showPostDetail = ref(false)

const isCurrentUser = computed(() => user.value?.id === authStore.user?.id)

function handleProfileUpdated() {
  // Refresh user data
  if (authStore.user) {
    user.value = authStore.user
  }
}

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostDetail.value = true
}

function handleCloseDetail() {
  showPostDetail.value = false
  selectedPostId.value = null
}

onMounted(async () => {
  const userId = route.params.userId as string

  try {
    user.value = await usersStore.getUserById(userId)

    const response = await postsApi.getByUser(userId, 1, 50)
    posts.value = response.data.data
  } catch (error) {
    console.error('Failed to load profile:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <LayoutThreeColumn>
    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-base mx-auto"></div>
    </div>

    <div v-else-if="user">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mb-8">
        <div class="flex items-start gap-6">
          <UserAvatar :user="user" size="xl" />

          <div class="flex-1">
            <div class="flex items-center justify-between mb-2">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ user.displayName }}
              </h1>
              <BaseButton
                v-if="isCurrentUser"
                variant="secondary"
                size="sm"
                @click="showEditModal = true"
              >
                Edit Profile
              </BaseButton>
              <FollowButton
                v-else
                :user-id="user.id"
                :is-following="user.isFollowing"
              />
            </div>

            <p class="text-gray-600 dark:text-gray-400 mb-4">@{{ user.username }}</p>

            <p v-if="user.bio" class="text-gray-700 dark:text-gray-300 mb-4">
              {{ user.bio }}
            </p>

            <div class="flex gap-6">
              <div>
                <span class="font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(user.followerCount) }}
                </span>
                <span class="text-gray-600 dark:text-gray-400 ml-1">followers</span>
              </div>
              <div>
                <span class="font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(user.followingCount) }}
                </span>
                <span class="text-gray-600 dark:text-gray-400 ml-1">following</span>
              </div>
              <div>
                <span class="font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(posts.length) }}
                </span>
                <span class="text-gray-600 dark:text-gray-400 ml-1">posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Posts</h2>
      </div>

      <PinGrid
        v-if="posts.length > 0"
        :posts="posts"
        @post-click="handlePostClick"
      />

      <div v-else class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400 text-lg">No posts yet</p>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400 text-lg">User not found</p>
    </div>

    <!-- Edit Profile Modal -->
    <EditProfileModal :show="showEditModal" @close="showEditModal = false" @updated="handleProfileUpdated" />

    <!-- Post Detail Modal -->
    <PostDetailModal
      :post-id="selectedPostId"
      :show="showPostDetail"
      @close="handleCloseDetail"
    />
  </LayoutThreeColumn>
</template>
