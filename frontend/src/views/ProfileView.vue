<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { postsApi } from '@/http/endpoints/posts'
import { usersApi } from '@/http/endpoints/users'
import UserAvatar from '@/components/user/UserAvatar.vue'
import FollowButton from '@/components/user/FollowButton.vue'
import PinGrid from '@/components/feed/PinGrid.vue'
import EditProfileModal from '@/components/user/EditProfileModal.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'
import RecipeMosaicBackground from '@/components/common/RecipeMosaicBackground.vue'
import { formatNumber } from '@/utils/format'
import type { Post } from '@/typescript/interface/Post'
import type { User } from '@/typescript/interface/User'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const user = ref<User | null>(null)
const posts = ref<Post[]>([])
const savedPosts = ref<Post[]>([])
const likedPosts = ref<Post[]>([])
const isLoading = ref(true)
const profileError = ref<string | null>(null)
const showEditModal = ref(false)
const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)
const activeTab = ref('posts')
const activities = ref<any[]>([])

const isCurrentUser = computed(() => user.value?.id === authStore.user?.id)

function handleProfileUpdated() {
  if (authStore.user) {
    user.value = authStore.user
  }
}

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

async function loadProfile() {
  const userId = route.params.userId as string
  if (!userId) return

  isLoading.value = true
  profileError.value = null
  try {
    user.value = await usersStore.getUserById(userId)
    const [postsRes, activityRes] = await Promise.all([
      postsApi.getByUser(userId, 1, 50),
      usersApi.getActivity(userId, 20)
    ])
    posts.value = postsRes.data.data
    activities.value = activityRes.data.data

    if (isCurrentUser.value) {
      const [savedRes, likedRes] = await Promise.all([
        usersApi.getSavedPosts(userId, 1, 50),
        usersApi.getLikedPosts(userId, 1, 50)
      ])
      savedPosts.value = savedRes.data.data
      likedPosts.value = likedRes.data.data
    } else {
      // For other users, we can only see their liked posts (saved are private)
      const likedRes = await usersApi.getLikedPosts(userId, 1, 50)
      likedPosts.value = likedRes.data.data
    }
  } catch (error: any) {
    profileError.value = error?.response?.data?.message || 'Failed to load profile. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProfile)
watch(() => route.params.userId, loadProfile)

const displayPosts = computed(() => {
  if (activeTab.value === 'posts') return posts.value
  if (activeTab.value === 'saved') return savedPosts.value
  if (activeTab.value === 'liked') return likedPosts.value
  return []
})
</script>

<template>
  <div class="profile-view min-h-screen bg-background pb-20">
    <div v-if="isLoading" class="flex items-center justify-center py-20">
       <div class="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="profileError" class="flex items-center justify-center py-20">
      <div class="text-center p-8 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-md">
        <p class="text-red-500 font-semibold mb-4">{{ profileError }}</p>
        <button @click="loadProfile" class="btn-primary">Try Again</button>
      </div>
    </div>

    <div v-else-if="user">
      <!-- Profile Header Hero -->
      <div class="relative h-64 md:h-80 overflow-hidden bg-background-secondary">
         <RecipeMosaicBackground :posts="posts" :count="12" :intensity="0.55" fallback-variant="warm" :blur="30" />
         <div class="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none"></div>

         <div class="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6">
            <div class="relative group">
              <UserAvatar :user="user" size="xl" class="!w-32 !h-32 md:!w-40 md:!h-40 border-4 border-background shadow-xl" />
              <button v-if="isCurrentUser" @click="showEditModal = true" class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs uppercase tracking-widest">Change</button>
            </div>

            <div class="pb-4 hidden md:block">
               <h1 class="font-montserrat font-extrabold text-4xl tracking-tight mb-1">{{ user.displayName }}</h1>
               <p class="text-text-dim font-bold text-sm tracking-wider uppercase">@{{ user.username }}</p>
            </div>
         </div>
      </div>

      <div class="px-8 md:px-12 mt-20 md:mt-24">
         <div class="flex flex-col md:flex-row gap-12">
            <!-- Left: Sidebar Info -->
            <div class="w-full md:w-80 shrink-0">
               <div class="md:hidden mb-6">
                  <h1 class="font-montserrat font-extrabold text-3xl tracking-tight mb-1">{{ user.displayName }}</h1>
                  <p class="text-text-dim font-bold text-xs tracking-wider uppercase">@{{ user.username }}</p>
               </div>

               <p v-if="user.bio" class="text-text-muted leading-relaxed mb-8">{{ user.bio }}</p>
               <p v-else class="text-text-dim italic mb-8">No bio yet. This cook prefers to let their recipes do the talking.</p>

               <div class="flex flex-col gap-4 mb-8">
                  <div class="flex items-center justify-between p-4 bg-background-secondary rounded-2xl border border-glass-border">
                     <span class="text-xs font-bold uppercase tracking-widest text-text-dim">Followers</span>
                     <span class="font-montserrat font-extrabold text-xl">{{ formatNumber(user.followerCount) }}</span>
                  </div>
                  <div class="flex items-center justify-between p-4 bg-background-secondary rounded-2xl border border-glass-border">
                     <span class="text-xs font-bold uppercase tracking-widest text-text-dim">Following</span>
                     <span class="font-montserrat font-extrabold text-xl">{{ formatNumber(user.followingCount) }}</span>
                  </div>
                  <div class="flex items-center justify-between p-4 bg-background-secondary rounded-2xl border border-glass-border">
                     <span class="text-xs font-bold uppercase tracking-widest text-text-dim">Recipes</span>
                     <span class="font-montserrat font-extrabold text-xl">{{ formatNumber(posts.length) }}</span>
                  </div>
               </div>

               <div v-if="!isCurrentUser" class="flex gap-3">
                  <FollowButton :user-id="user.id" :is-following="user.isFollowing" class="flex-1" />
                  <button @click="router.push('/messages')" class="w-12 h-12 rounded-xl bg-background-secondary border border-glass-border flex items-center justify-center text-xl hover:bg-orange-soft hover:text-orange transition-all">💬</button>
               </div>
               <button v-else @click="showEditModal = true" class="w-full btn-secondary">Edit Profile</button>
            </div>

            <!-- Right: Content Tabs -->
            <div class="flex-1">
               <div class="flex gap-10 border-b border-glass-border mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  <button
                    v-for="t in ['posts', 'saved', 'liked', 'activity'].filter(tab => tab !== 'saved' || isCurrentUser)"
                    :key="t"
                    @click="activeTab = t"
                    class="pb-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2"
                    :class="activeTab === t ? 'text-orange border-orange' : 'text-text-dim border-transparent'"
                  >
                    {{ t }}
                  </button>
               </div>

               <!-- Posts Grid -->
               <div v-if="activeTab !== 'activity'">
                  <div v-if="displayPosts.length > 0">
                    <PinGrid :posts="displayPosts" @post-click="handlePostClick" />
                  </div>
                  <div v-else class="py-20 text-center bg-background-secondary rounded-[32px] border-2 border-dashed border-glass-border">
                    <span class="text-4xl mb-4 block">🍳</span>
                    <h3 class="font-bold text-lg mb-1">Nothing to show here</h3>
                    <p class="text-text-dim text-sm">Explore and start building your collection!</p>
                  </div>
               </div>

               <!-- Activity Tab -->
               <div v-else class="space-y-4 max-w-2xl">
                  <div v-if="activities.length > 0" v-for="item in activities" :key="item.id" class="p-6 bg-background-secondary rounded-2xl border border-glass-border group hover:border-orange/20 transition-all">
                     <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-full bg-orange-soft flex items-center justify-center text-xl shrink-0">
                           <span v-if="item.type === 'like'">❤️</span>
                           <span v-else-if="item.type === 'comment'">💬</span>
                           <span v-else-if="item.type === 'follow'">👤</span>
                           <span v-else-if="item.type === 'rating'">⭐</span>
                        </div>
                        <div class="flex-1">
                           <div class="flex items-center justify-between mb-1">
                              <p class="text-sm font-medium">
                                 <template v-if="item.type === 'like'">
                                    Liked <RouterLink :to="`/recipe/${item.data.postId}`" class="font-bold hover:text-orange">{{ item.data.postTitle }}</RouterLink>
                                 </template>
                                 <template v-else-if="item.type === 'comment'">
                                    Commented on <RouterLink :to="`/recipe/${item.data.postId}`" class="font-bold hover:text-orange">{{ item.data.postTitle }}</RouterLink>
                                 </template>
                                 <template v-else-if="item.type === 'follow'">
                                    Started following <RouterLink :to="`/profile/${item.data.userId}`" class="font-bold hover:text-orange">{{ item.data.displayName }}</RouterLink>
                                 </template>
                                 <template v-else-if="item.type === 'rating'">
                                    Rated <RouterLink :to="`/recipe/${item.data.postId}`" class="font-bold hover:text-orange">{{ item.data.postTitle }}</RouterLink> with {{ item.data.score }} stars
                                 </template>
                              </p>
                              <span class="text-[10px] text-text-dim uppercase font-bold tracking-widest">{{ new Date(item.date).toLocaleDateString() }}</span>
                           </div>
                           <p v-if="item.data.content" class="text-sm text-text-muted mt-2 pl-4 border-l-2 border-orange/20 italic line-clamp-2">"{{ item.data.content }}"</p>
                        </div>
                     </div>
                  </div>
                  <div v-else class="py-20 text-center">
                    <p class="text-text-dim italic text-sm">No recent activity to show.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <h2 class="text-2xl font-bold">User not found</h2>
      <button @click="router.push('/')" class="mt-4 text-orange font-bold">Back to home</button>
    </div>

    <!-- Modals -->
    <EditProfileModal :show="showEditModal" @close="showEditModal = false" @updated="handleProfileUpdated" />
    <RecipeModal :post-id="selectedPostId" :show="showPostModal" @close="showPostModal = false" />
  </div>
</template>
