<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
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

interface ActivityItem {
  id: string
  type: 'like' | 'comment' | 'follow' | 'rating'
  date: string
  data: Record<string, any>
}

interface TabDef {
  key: string
  label: string
  icon: string
  count?: number
}

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
const isCurrentUser = computed(() => user.value?.id === authStore.user?.id)
const activeTab = ref('posts')
const activities = ref<ActivityItem[]>([])

watch(isCurrentUser, (val) => {
  activeTab.value = val ? 'my recipes' : 'posts'
})

const sharedPosts = computed(() => posts.value.filter((p) => p.isPublic !== false))
const privatePosts = computed(() => posts.value.filter((p) => p.isPublic === false))

const tabs = computed<TabDef[]>(() => {
  if (isCurrentUser.value) {
    return [
      { key: 'my recipes', label: 'Recipes', icon: 'squares-plus', count: privatePosts.value.length },
      { key: 'shared recipes', label: 'Shared', icon: 'globe-alt', count: sharedPosts.value.length },
      { key: 'saved', label: 'Saved', icon: 'bookmark', count: savedPosts.value.length },
      { key: 'liked', label: 'Liked', icon: 'heart', count: likedPosts.value.length },
      { key: 'activity', label: 'Activity', icon: 'sparkles' },
    ]
  }
  return [
    { key: 'posts', label: 'Recipes', icon: 'squares-plus', count: posts.value.length },
    { key: 'liked', label: 'Liked', icon: 'heart', count: likedPosts.value.length },
    { key: 'activity', label: 'Activity', icon: 'sparkles' },
  ]
})

const joinedLabel = computed(() => {
  if (!user.value?.createdAt) return ''
  return new Date(user.value.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
})

const stats = computed(() => [
  { key: 'recipes', label: 'Recipes', value: posts.value.length },
  { key: 'followers', label: 'Followers', value: user.value?.followerCount ?? 0 },
  { key: 'following', label: 'Following', value: user.value?.followingCount ?? 0 },
])

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
      usersApi.getActivity(userId, 20),
    ])
    posts.value = postsRes.data.data
    activities.value = activityRes.data.data

    if (isCurrentUser.value) {
      const [savedRes, likedRes] = await Promise.all([
        usersApi.getSavedPosts(userId, 1, 50),
        usersApi.getLikedPosts(userId, 1, 50),
      ])
      savedPosts.value = savedRes.data.data
      likedPosts.value = likedRes.data.data
    } else {
      // For other users, we can only see their liked posts (saved are private)
      const likedRes = await usersApi.getLikedPosts(userId, 1, 50)
      likedPosts.value = likedRes.data.data
    }
  } catch (error: any) {
    profileError.value =
      error?.response?.data?.message || 'Failed to load profile. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProfile)
watch(() => route.params.userId, loadProfile)

const displayPosts = computed(() => {
  if (activeTab.value === 'posts') return posts.value
  if (activeTab.value === 'my recipes') return privatePosts.value
  if (activeTab.value === 'shared recipes') return sharedPosts.value
  if (activeTab.value === 'saved') return savedPosts.value
  if (activeTab.value === 'liked') return likedPosts.value
  return []
})

const emptyCopy = computed(() => {
  const mine = isCurrentUser.value
  switch (activeTab.value) {
    case 'saved':
      return {
        icon: 'bookmark',
        title: 'No saved recipes yet',
        body: 'Tap the bookmark on any recipe to keep it here.',
      }
    case 'liked':
      return {
        icon: 'heart',
        title: mine ? 'Nothing liked yet' : 'No likes to show',
        body: mine ? 'Recipes you love will gather here.' : 'This cook hasn’t liked anything publicly.',
      }
    case 'shared recipes':
      return {
        icon: 'globe-alt',
        title: 'No shared recipes',
        body: 'Make a recipe public to share it with the community.',
      }
    default:
      return {
        icon: 'squares-plus',
        title: mine ? 'No recipes yet' : 'Nothing cooking here yet',
        body: mine ? 'Post your first recipe and start building your kitchen.' : 'Check back soon for new recipes.',
      }
  }
})

function activityIcon(type: ActivityItem['type']) {
  return (
    { like: 'heart', comment: 'chat-bubble-left', follow: 'user-plus', rating: 'star' }[type] ||
    'sparkles'
  )
}
</script>

<template>
  <div class="profile-view min-h-screen bg-background md:pb-20">
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-32">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-orange border-t-transparent"></div>
    </div>

    <!-- Error -->
    <div v-else-if="profileError" class="flex items-center justify-center py-32 px-6">
      <div class="max-w-md rounded-card border border-red-500/20 bg-red-500/10 p-8 text-center shadow-card">
        <p class="mb-4 font-semibold text-red-500">{{ profileError }}</p>
        <button @click="loadProfile" class="btn-primary">Try Again</button>
      </div>
    </div>

    <div v-else-if="user">
      <!-- Banner + header -->
      <header class="relative">
        <div class="relative h-52 overflow-hidden bg-background-secondary sm:h-64 md:h-72">
          <RecipeMosaicBackground
            :posts="posts"
            :count="12"
            :intensity="0.55"
            fallback-variant="warm"
            :blur="30"
          />
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/5"
          ></div>
        </div>

        <div class="mx-auto max-w-6xl px-5 sm:px-8">
          <div class="relative -mt-16 flex flex-col gap-6 sm:-mt-20 md:flex-row md:items-end md:justify-between">
            <!-- Identity -->
            <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-end animate-rise">
              <div class="group relative">
                <UserAvatar
                  :user="user"
                  size="xl"
                  class="!h-28 !w-28 rounded-full border-4 border-background shadow-modal ring-1 ring-black/5 dark:ring-white/10 sm:!h-32 sm:!w-32 md:!h-36 md:!w-36"
                />
                <button
                  v-if="isCurrentUser"
                  @click="showEditModal = true"
                  class="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 ease-revamp group-hover:opacity-100"
                >
                  <span class="flex flex-col items-center gap-1">
                    <BaseIcons name="pencil" size="sm" />
                    Edit
                  </span>
                </button>
              </div>

              <div class="pb-1 sm:pb-3">
                <h1
                  class="text-balance font-montserrat text-3xl font-extrabold tracking-tight text-text sm:text-4xl"
                >
                  {{ user.displayName }}
                </h1>
                <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span class="font-semibold text-text-dim">@{{ user.username }}</span>
                  <span v-if="joinedLabel" class="flex items-center gap-1 text-xs text-text-dim">
                    <span class="h-1 w-1 rounded-full bg-text-dim/50"></span>
                    Joined {{ joinedLabel }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex shrink-0 items-center gap-3 pb-1 sm:pb-3 animate-rise" style="animation-delay: 80ms">
              <template v-if="!isCurrentUser">
                <FollowButton :user-id="user.id" :is-following="user.isFollowing" size="md" />
                <button
                  @click="router.push('/messages')"
                  aria-label="Message"
                  class="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-text shadow-card transition-[transform,color,border-color,background-color] duration-200 ease-revamp hover:border-orange/40 hover:text-orange active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <BaseIcons name="chat-bubble-left" size="md" />
                </button>
              </template>
              <button
                v-else
                @click="showEditModal = true"
                class="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-6 font-montserrat text-xs font-bold uppercase tracking-widest text-text shadow-card transition-[transform,color,border-color] duration-200 ease-revamp hover:border-orange/40 hover:text-orange active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <BaseIcons name="pencil" size="sm" />
                Edit profile
              </button>
            </div>
          </div>

          <!-- Bio -->
          <p
            v-if="user.bio"
            class="mt-5 max-w-2xl text-pretty leading-relaxed text-text-muted animate-rise"
            style="animation-delay: 120ms"
          >
            {{ user.bio }}
          </p>
          <p
            v-else
            class="mt-5 max-w-2xl text-pretty italic leading-relaxed text-text-dim animate-rise"
            style="animation-delay: 120ms"
          >
            No bio yet — this cook lets their recipes do the talking.
          </p>

          <!-- Stats -->
          <div class="mt-6 flex flex-wrap items-center gap-2 animate-rise" style="animation-delay: 160ms">
            <div
              v-for="s in stats"
              :key="s.key"
              class="flex items-baseline gap-2 rounded-full border border-border bg-surface px-4 py-2 shadow-card"
            >
              <span class="font-montserrat text-base font-extrabold tabular-nums text-text">{{
                formatNumber(s.value)
              }}</span>
              <span class="text-[11px] font-bold uppercase tracking-widest text-text-dim">{{
                s.label
              }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Tabs -->
      <nav
        class="sticky top-0 z-20 mt-8 border-b border-border bg-background/80 backdrop-blur-xl"
      >
        <div class="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 sm:px-7 scrollbar-hide">
          <button
            v-for="t in tabs"
            :key="t.key"
            @click="activeTab = t.key"
            :class="[
              'relative flex shrink-0 items-center gap-2 px-3 py-4 font-montserrat text-xs font-bold uppercase tracking-widest transition-colors duration-200 ease-revamp sm:px-4',
              activeTab === t.key ? 'text-orange' : 'text-text-dim hover:text-text',
            ]"
          >
            <BaseIcons :name="t.icon" size="sm" />
            <span>{{ t.label }}</span>
            <span
              v-if="t.count !== undefined"
              class="rounded-full bg-background-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-text-dim"
              >{{ t.count }}</span
            >
            <span
              v-if="activeTab === t.key"
              class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-orange"
            ></span>
          </button>
        </div>
      </nav>

      <div class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <!-- Grid tabs -->
        <div v-if="activeTab !== 'activity'">
          <Transition name="fade" mode="out-in">
            <PinGrid
              v-if="displayPosts.length > 0"
              :key="activeTab"
              :posts="displayPosts"
              @post-click="handlePostClick"
            />
            <div
              v-else
              :key="`empty-${activeTab}`"
              class="flex flex-col items-center justify-center rounded-card border-2 border-dashed border-border bg-background-secondary/60 px-6 py-20 text-center"
            >
              <div class="mb-5 grid h-16 w-16 place-items-center rounded-full bg-orange-soft text-orange">
                <BaseIcons :name="emptyCopy.icon" size="xl" />
              </div>
              <h3 class="mb-1 font-montserrat text-lg font-bold text-text">{{ emptyCopy.title }}</h3>
              <p class="max-w-xs text-pretty text-sm text-text-dim">{{ emptyCopy.body }}</p>
              <RouterLink
                v-if="isCurrentUser && (activeTab === 'saved' || activeTab === 'liked')"
                to="/"
                class="btn-primary mt-6 !text-xs"
                >Discover recipes</RouterLink
              >
            </div>
          </Transition>
        </div>

        <!-- Activity tab -->
        <div v-else class="mx-auto max-w-2xl">
          <ul v-if="activities.length > 0" class="space-y-3">
            <li
              v-for="(item, i) in activities"
              :key="item.id"
              class="animate-rise rounded-card border border-border bg-surface p-5 shadow-card transition-[transform,border-color] duration-200 ease-revamp hover:-translate-y-0.5 hover:border-orange/30"
              :style="{ animationDelay: `${Math.min(i, 8) * 40}ms` }"
            >
              <div class="flex items-start gap-4">
                <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-soft text-orange">
                  <BaseIcons :name="activityIcon(item.type)" size="sm" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <p class="text-sm leading-relaxed text-text">
                      <template v-if="item.type === 'like'">
                        Liked
                        <RouterLink
                          :to="`/recipes/${item.data.postId}`"
                          class="font-bold transition-colors hover:text-orange"
                          >{{ item.data.postTitle }}</RouterLink
                        >
                      </template>
                      <template v-else-if="item.type === 'comment'">
                        Commented on
                        <RouterLink
                          :to="`/recipes/${item.data.postId}`"
                          class="font-bold transition-colors hover:text-orange"
                          >{{ item.data.postTitle }}</RouterLink
                        >
                      </template>
                      <template v-else-if="item.type === 'follow'">
                        Started following
                        <RouterLink
                          :to="`/profile/${item.data.userId}`"
                          class="font-bold transition-colors hover:text-orange"
                          >{{ item.data.displayName }}</RouterLink
                        >
                      </template>
                      <template v-else-if="item.type === 'rating'">
                        Rated
                        <RouterLink
                          :to="`/recipes/${item.data.postId}`"
                          class="font-bold transition-colors hover:text-orange"
                          >{{ item.data.postTitle }}</RouterLink
                        >
                        · {{ item.data.score }}★
                      </template>
                    </p>
                    <time class="shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-text-dim">{{
                      new Date(item.date).toLocaleDateString()
                    }}</time>
                  </div>
                  <p
                    v-if="item.data.content"
                    class="mt-2 line-clamp-2 border-l-2 border-orange/30 pl-3 text-sm italic text-text-muted"
                  >
                    “{{ item.data.content }}”
                  </p>
                </div>
              </div>
            </li>
          </ul>
          <div
            v-else
            class="flex flex-col items-center justify-center rounded-card border-2 border-dashed border-border bg-background-secondary/60 px-6 py-20 text-center"
          >
            <div class="mb-5 grid h-16 w-16 place-items-center rounded-full bg-orange-soft text-orange">
              <BaseIcons name="sparkles" size="xl" />
            </div>
            <h3 class="mb-1 font-montserrat text-lg font-bold text-text">No activity yet</h3>
            <p class="max-w-xs text-pretty text-sm text-text-dim">
              Likes, comments and follows will show up here.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="py-32 text-center">
      <h2 class="font-montserrat text-2xl font-bold">User not found</h2>
      <button @click="router.push('/')" class="mt-4 font-bold text-orange hover:underline">
        Back to home
      </button>
    </div>

    <!-- Modals -->
    <EditProfileModal :show="showEditModal" @close="showEditModal = false" @updated="handleProfileUpdated" />
    <RecipeModal :post-id="selectedPostId" :show="showPostModal" @close="showPostModal = false" />
  </div>
</template>

<style scoped>
.profile-view {
  -webkit-font-smoothing: antialiased;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-rise {
  animation: rise 0.45s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .animate-rise,
  .fade-enter-active,
  .fade-leave-active {
    animation: none;
    transition: none;
  }
}
</style>
