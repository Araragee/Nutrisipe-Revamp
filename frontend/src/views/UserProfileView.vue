<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { postsApi } from '@/http/endpoints/posts'
import UserAvatar from '@/components/user/UserAvatar.vue'
import FollowButton from '@/components/user/FollowButton.vue'
import PinGrid from '@/components/feed/PinGrid.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'
import { formatNumber } from '@/utils/format'
import type { Post } from '@/typescript/interface/Post'
import type { User } from '@/typescript/interface/User'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const user = ref<User | null>(null)
const posts = ref<Post[]>([])
const isLoading = ref(true)
const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)
const activeTab = ref('posts')

const userId = computed(() => route.params.id as string)
const isCurrentUser = computed(() => user.value?.id === authStore.user?.id)

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

async function loadProfile() {
  if (!userId.value) return

  isLoading.value = true
  try {
    user.value = await usersStore.getUserById(userId.value)
    const response = await postsApi.getByUser(userId.value, 1, 50)
    posts.value = response.data.data
  } catch (error) {
    console.error('Failed to load profile:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProfile)
watch(userId, loadProfile)

const displayPosts = computed(() => {
  if (activeTab.value === 'posts') return posts.value
  return []
})
</script>

<template>
  <div class="user-profile-view min-h-screen bg-background pb-20">
    <div v-if="isLoading" class="flex items-center justify-center py-20">
       <div class="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="user">
      <!-- Profile Header Hero -->
      <div class="relative h-64 md:h-80 bg-[#111]">
         <img src="https://picsum.photos/1200/400?random=101" class="w-full h-full object-cover opacity-40 blur-[2px]" />
         <div class="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>

         <div class="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6">
            <UserAvatar :user="user" size="xl" class="!w-32 !h-32 md:!w-40 md:!h-40 border-4 border-background shadow-xl" />

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
               <p v-else class="text-text-dim italic mb-8">This user is busy cooking up something special.</p>

               <div class="flex flex-col gap-4 mb-8">
                  <div class="flex items-center justify-between p-4 bg-background-secondary rounded-2xl border border-glass-border">
                     <span class="text-xs font-bold uppercase tracking-widest text-text-dim">Followers</span>
                     <span class="font-montserrat font-extrabold text-xl">{{ formatNumber(user.followerCount) }}</span>
                  </div>
                  <div class="flex items-center justify-between p-4 bg-background-secondary rounded-2xl border border-glass-border">
                     <span class="text-xs font-bold uppercase tracking-widest text-text-dim">Following</span>
                     <span class="font-montserrat font-extrabold text-xl">{{ formatNumber(user.followingCount) }}</span>
                  </div>
               </div>

               <div v-if="!isCurrentUser" class="flex gap-3">
                  <FollowButton :user-id="user.id" :is-following="user.isFollowing" class="flex-1" />
                  <button @click="router.push('/messages')" class="w-12 h-12 rounded-xl bg-background-secondary border border-glass-border flex items-center justify-center text-xl hover:bg-orange-soft hover:text-orange transition-all">💬</button>
               </div>
               <button v-else @click="router.push('/settings')" class="w-full btn-secondary">Manage Account</button>
            </div>

            <!-- Right: Content Tabs -->
            <div class="flex-1">
               <div class="flex gap-10 border-b border-glass-border mb-8">
                  <button
                    @click="activeTab = 'posts'"
                    :class="[
                      'pb-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2',
                      activeTab === 'posts' ? 'text-orange border-orange' : 'text-text-muted border-transparent hover:text-text'
                    ]"
                  >
                    Recipes
                  </button>
               </div>

               <div v-if="displayPosts.length > 0">
                  <PinGrid :posts="displayPosts" @post-click="handlePostClick" />
               </div>
               <div v-else class="py-20 text-center bg-background-secondary rounded-[32px] border-2 border-dashed border-glass-border">
                  <span class="text-4xl mb-4 block">🍳</span>
                  <h3 class="font-bold text-lg mb-1">No recipes shared yet</h3>
                  <p class="text-text-dim text-sm">Stay tuned for more updates from this cook!</p>
               </div>
            </div>
         </div>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <h2 class="text-2xl font-bold">User not found</h2>
      <button @click="router.push('/')" class="mt-4 text-orange font-bold">Back to home</button>
    </div>

    <RecipeModal :post-id="selectedPostId" :show="showPostModal" @close="showPostModal = false" />
  </div>
</template>
