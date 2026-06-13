<script setup lang="ts">
import { computed } from 'vue'
import PinCard from '@/components/feed/PinCard.vue'
import UserAvatar from '@/components/user/UserAvatar.vue'
import FollowButton from '@/components/user/FollowButton.vue'
import type { Post } from '@/typescript/interface/Post'
import type { UserBasic } from '@/typescript/interface/User'
import type { SearchType } from '@/composables/useExploreSearch'

const props = withDefaults(
  defineProps<{
    query: string
    searchType: SearchType
    posts?: Post[] | null
    users?: UserBasic[] | null
    loading?: boolean
    currentUserId?: string
  }>(),
  {
    posts: null,
    users: null,
    loading: false,
    currentUserId: undefined,
  },
)

defineEmits<{
  clear: []
  'open-post': [postId: string]
}>()

const isEmpty = computed(
  () => (props.posts?.length ?? 0) === 0 && (props.users?.length ?? 0) === 0,
)
</script>

<template>
  <div class="mb-12 animate-fadeIn">
    <div class="flex items-baseline justify-between mb-6">
      <h2 class="font-montserrat font-extrabold text-2xl">Results for "{{ query }}"</h2>
      <button
        @click="$emit('clear')"
        class="text-orange text-xs font-bold uppercase tracking-widest hover:underline"
      >Clear</button>
    </div>

    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="h-64 bg-background-secondary rounded-card animate-pulse"></div>
    </div>

    <template v-else>
      <!-- People -->
      <div v-if="users && users.length > 0" class="mb-10">
        <h3
          v-if="searchType === 'all'"
          class="font-montserrat font-extrabold text-base text-text-dim uppercase tracking-widest mb-4"
        >People</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="user in users"
            :key="user.id"
            class="flex items-center gap-4 p-4 bg-background-secondary/50 border border-border rounded-2xl hover:border-orange transition-all"
          >
            <RouterLink :to="`/profile/${user.id}`" class="flex items-center gap-3 flex-1 min-w-0">
              <UserAvatar :user="user" size="md" class="shrink-0" />
              <div class="min-w-0">
                <p class="font-bold text-sm truncate">{{ user.displayName }}</p>
                <p class="text-xs text-text-dim truncate">@{{ user.username }} · {{ user.followerCount ?? 0 }} followers</p>
              </div>
            </RouterLink>
            <FollowButton
              v-if="user.id !== currentUserId"
              :user-id="user.id"
              :is-following="user.isFollowing"
            />
          </div>
        </div>
      </div>

      <!-- Recipes -->
      <div v-if="posts && posts.length > 0">
        <h3
          v-if="searchType === 'all' && (users?.length ?? 0) > 0"
          class="font-montserrat font-extrabold text-base text-text-dim uppercase tracking-widest mb-4"
        >Recipes</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <PinCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            @click="$emit('open-post', $event)"
          />
        </div>
      </div>

      <!-- Empty -->
      <div
        v-if="isEmpty"
        class="text-center py-12 bg-background-secondary rounded-3xl border-1.5 border-dashed border-border"
      >
        <p class="text-text-dim">No results found for "{{ query }}".</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fadeIn { animation: fadeIn 0.3s ease-in; }
</style>
