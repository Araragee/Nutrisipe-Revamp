<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usersApi } from '@/http/endpoints/users'
import { collectionsApi, type Collection } from '@/http/endpoints/collections'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { resolveImage } from '@/utils/imageUrl'
import PinGrid from '@/components/feed/PinGrid.vue'
import PinSkeleton from '@/components/feed/PinSkeleton.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'
import type { Post } from '@/typescript/interface/Post'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const { isNearBottom } = useInfiniteScroll()

const activeTab = ref<'collections' | 'all'>('collections')
const posts = ref<Post[]>([])
const collections = ref<Collection[]>([])
const isLoadingPosts = ref(true)
const isLoadingCollections = ref(true)
const hasMore = ref(true)
const page = ref(1)
const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)

const showNewModal = ref(false)
const newName = ref('')
const newDescription = ref('')
const newPublic = ref(false)
const isCreating = ref(false)

const collectionGradients = [
  'from-orange-400 to-red-500',
  'from-green-400 to-emerald-500',
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-yellow-400 to-amber-500',
  'from-purple-400 to-violet-500',
]

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

async function loadCollections() {
  if (!authStore.user?.id) return
  isLoadingCollections.value = true
  try {
    const response = await collectionsApi.getUserCollections(authStore.user.id)
    collections.value = response.data.data
  } catch (error) {
    logger.error('Failed to load collections:', error)
  } finally {
    isLoadingCollections.value = false
  }
}

async function fetchSavedPosts(reset = false) {
  if (!authStore.user?.id) return
  if (isLoadingPosts.value && !reset) return

  isLoadingPosts.value = true
  if (reset) {
    page.value = 1
    posts.value = []
    hasMore.value = true
  }

  try {
    const response = await usersApi.getSavedPosts(authStore.user.id, page.value, 20)
    const newPosts = response.data.data.map((item: any) => item.post || item)
    if (reset) {
      posts.value = newPosts
    } else {
      posts.value.push(...newPosts)
    }
    hasMore.value = page.value < response.data.pagination.totalPages
    page.value++
  } catch (error) {
    logger.error('Failed to load saved posts:', error)
  } finally {
    isLoadingPosts.value = false
  }
}

const canCreate = computed(() => newName.value.trim().length > 0 && !isCreating.value)

async function createCollection() {
  if (!canCreate.value) return
  isCreating.value = true
  try {
    const response = await collectionsApi.create({
      name: newName.value.trim(),
      description: newDescription.value.trim() || undefined,
      isPublic: newPublic.value,
    })
    collections.value.unshift(response.data.data)
    showNewModal.value = false
    newName.value = ''
    newDescription.value = ''
    newPublic.value = false
    uiStore.showToast('Collection created', 'success')
  } catch (error) {
    logger.error('Failed to create collection:', error)
    uiStore.showToast('Failed to create collection', 'error')
  } finally {
    isCreating.value = false
  }
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadCollections()
  fetchSavedPosts(true)
})

watch(isNearBottom, (near) => {
  if (activeTab.value !== 'all') return
  if (near && !isLoadingPosts.value && hasMore.value) {
    fetchSavedPosts()
  }
})
</script>

<template>
  <div class="saved-recipes-view min-h-screen pt-8">
    <div class="px-8 py-6 max-w-7xl mx-auto">
      <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="font-montserrat font-extrabold text-3xl tracking-tight mb-1">Saved</h2>
          <p class="text-text-dim text-sm">Organize loves into boards. Or browse them all.</p>
        </div>
        <button
          v-if="activeTab === 'collections'"
          @click="showNewModal = true"
          class="btn-primary px-6 py-3 text-xs whitespace-nowrap"
        >+ New Collection</button>
      </div>

      <div class="flex gap-8 border-b border-border mb-8">
        <button
          v-for="t in (['collections', 'all'] as const)"
          :key="t"
          @click="activeTab = t"
          :class="[
            'pb-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2',
            activeTab === t ? 'text-orange border-orange' : 'text-text-muted border-transparent hover:text-text'
          ]"
        >{{ t === 'collections' ? 'Collections' : 'All Saved' }}</button>
      </div>

      <!-- Collections tab -->
      <div v-if="activeTab === 'collections'">
        <div v-if="isLoadingCollections" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="h-56 bg-background-secondary rounded-3xl animate-pulse"></div>
        </div>
        <div v-else-if="collections.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(col, idx) in collections"
            :key="col.id"
            @click="router.push(`/collections/${col.id}`)"
            class="group relative h-56 rounded-3xl overflow-hidden cursor-pointer shadow-card transition-all hover:-translate-y-1 border-1.5 border-border"
          >
            <img :src="resolveImage(col.thumbnailUrl, col.id)" :alt="col.name" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div :class="['absolute inset-0 bg-gradient-to-t opacity-60', collectionGradients[idx % collectionGradients.length]]"></div>
            <div class="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 class="font-montserrat font-extrabold text-2xl text-white drop-shadow-md">{{ col.name }}</h3>
              <p class="text-white/85 text-sm font-medium">{{ col.postCount ?? 0 }} recipes · {{ col.isPublic ? 'Public' : 'Private' }}</p>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-24 text-center">
          <BaseIcons name="folder" size="xl" class="mx-auto mb-6 text-text-dim" />
          <h3 class="text-xl font-bold mb-2">No collections yet</h3>
          <p class="text-text-dim max-w-xs mx-auto mb-6">Group saved recipes into boards — meal plans, holidays, anything.</p>
          <button @click="showNewModal = true" class="btn-primary px-8">+ Create Collection</button>
        </div>
      </div>

      <!-- All saved tab -->
      <div v-else-if="activeTab === 'all'">
        <PinGrid
          v-if="posts.length > 0"
          :posts="posts"
          @post-click="handlePostClick"
        />
        <div
          v-if="isLoadingPosts"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-4"
        >
          <PinSkeleton v-for="i in 5" :key="i" />
        </div>
        <div
          v-if="!isLoadingPosts && posts.length === 0"
          class="flex flex-col items-center justify-center py-24 text-center"
        >
          <BaseIcons name="bookmark" size="xl" class="mx-auto mb-6 text-text-dim" />
          <h3 class="text-xl font-bold mb-2">No saved recipes yet</h3>
          <p class="text-text-dim max-w-xs mx-auto">Tap the heart on any recipe you love to save it.</p>
          <RouterLink to="/" class="mt-6 btn-primary px-8">Discover Recipes</RouterLink>
        </div>
      </div>
    </div>

    <!-- New collection modal -->
    <div
      v-if="showNewModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
      @click.self="showNewModal = false"
    >
      <div class="bg-surface border-1.5 border-border rounded-3xl p-8 max-w-md w-full shadow-modal">
        <h3 class="font-montserrat font-extrabold text-2xl mb-6">New Collection</h3>
        <label class="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Name</label>
        <input
          v-model="newName"
          type="text"
          placeholder="Sunday Brunch"
          class="w-full px-4 py-3 bg-background-secondary border-1.5 border-border rounded-xl text-sm outline-none focus:border-orange transition-all mb-4"
        />
        <label class="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Description (optional)</label>
        <textarea
          v-model="newDescription"
          rows="3"
          placeholder="Easy weekend recipes for slow mornings"
          class="w-full px-4 py-3 bg-background-secondary border-1.5 border-border rounded-xl text-sm outline-none focus:border-orange transition-all resize-none mb-4"
        ></textarea>
        <label class="flex items-center gap-3 cursor-pointer mb-6">
          <input v-model="newPublic" type="checkbox" class="w-4 h-4 accent-orange" />
          <span class="text-sm">Make public — others can browse</span>
        </label>
        <div class="flex gap-3 justify-end">
          <button @click="showNewModal = false" class="btn-secondary px-6 py-2.5 text-xs">Cancel</button>
          <button @click="createCollection" :disabled="!canCreate" class="btn-primary px-6 py-2.5 text-xs disabled:opacity-50">
            {{ isCreating ? 'Creating…' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <RecipeModal
      :post-id="selectedPostId"
      :show="showPostModal"
      @close="showPostModal = false"
    />
  </div>
</template>
