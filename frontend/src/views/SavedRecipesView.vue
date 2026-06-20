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

// Fallback tints only show when a collection has no thumbnail — never as the
// dominant treatment over real food photography.
const collectionGradients = [
  'from-orange/70 to-red-500/70',
  'from-green/70 to-emerald-500/70',
  'from-blue-400/70 to-indigo-500/70',
  'from-pink-400/70 to-rose-500/70',
  'from-amber-400/70 to-orange/70',
  'from-purple-400/70 to-violet-500/70',
]

const tabs = [
  { key: 'collections', label: 'Collections' },
  { key: 'all', label: 'All Saved' },
] as const

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

function openNewModal() {
  showNewModal.value = true
}

function resetNewForm() {
  newName.value = ''
  newDescription.value = ''
  newPublic.value = false
}

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
    resetNewForm()
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
  <div class="saved-recipes-view min-h-screen md:pt-8">
    <div class="mx-auto max-w-6xl px-5 sm:px-8 md:py-6">
      <!-- Header -->
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 class="text-balance font-montserrat text-3xl font-extrabold tracking-tight text-text">
            Saved
          </h1>
          <p class="mt-1 text-sm text-text-dim">Organize what you love into boards — or browse it all.</p>
        </div>
        <button
          v-if="activeTab === 'collections'"
          @click="openNewModal"
          class="inline-flex items-center gap-2 self-start rounded-full bg-orange px-5 py-3 font-montserrat text-xs font-bold uppercase tracking-widest text-white shadow-[0_6px_24px_rgba(255,107,53,0.35)] transition-[transform,background-color,box-shadow] duration-200 ease-revamp hover:bg-orange-light hover:shadow-[0_12px_32px_rgba(255,107,53,0.35)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:self-auto"
        >
          <BaseIcons name="plus" size="sm" />
          New Collection
        </button>
      </div>

      <!-- Tabs -->
      <div class="mb-8 flex gap-1 border-b border-border">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="activeTab = t.key"
          :class="[
            'relative px-4 py-3 font-montserrat text-xs font-bold uppercase tracking-widest transition-colors duration-200 ease-revamp',
            activeTab === t.key ? 'text-orange' : 'text-text-dim hover:text-text',
          ]"
        >
          {{ t.label }}
          <span
            v-if="activeTab === t.key"
            class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-orange"
          ></span>
        </button>
      </div>

      <!-- Collections tab -->
      <div v-if="activeTab === 'collections'">
        <div
          v-if="isLoadingCollections"
          class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="h-52 animate-pulse rounded-card bg-background-secondary"
          ></div>
        </div>

        <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Create card always first -->
          <button
            @click="openNewModal"
            class="group flex h-52 flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-border bg-background-secondary/50 text-text-dim transition-[transform,border-color,color] duration-200 ease-revamp hover:-translate-y-1 hover:border-orange/50 hover:text-orange active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              class="grid h-12 w-12 place-items-center rounded-full bg-surface shadow-card transition-transform duration-200 ease-revamp group-hover:scale-110"
            >
              <BaseIcons name="plus" size="lg" />
            </span>
            <span class="font-montserrat text-xs font-bold uppercase tracking-widest">New Collection</span>
          </button>

          <article
            v-for="(col, idx) in collections"
            :key="col.id"
            @click="router.push(`/collections/${col.id}`)"
            class="group relative h-52 cursor-pointer overflow-hidden rounded-card shadow-card outline outline-1 -outline-offset-1 outline-black/10 transition-[transform,box-shadow] duration-300 ease-revamp hover:-translate-y-1 hover:shadow-card-hover dark:outline-white/10"
          >
            <img
              :src="resolveImage(col.thumbnailUrl, col.id)"
              :alt="col.name"
              loading="lazy"
              class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <!-- Tint fallback for thumbnail-less boards + readability scrim -->
            <div
              v-if="!col.thumbnailUrl"
              :class="['absolute inset-0 bg-gradient-to-br opacity-90', collectionGradients[idx % collectionGradients.length]]"
            ></div>
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
            ></div>

            <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
              <div class="min-w-0">
                <h3 class="truncate font-montserrat text-xl font-extrabold text-white drop-shadow">
                  {{ col.name }}
                </h3>
                <p class="mt-0.5 text-xs font-semibold text-white/85">
                  <span class="tabular-nums">{{ col.postCount ?? 0 }}</span>
                  {{ (col.postCount ?? 0) === 1 ? 'recipe' : 'recipes' }}
                </p>
              </div>
              <span
                class="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur"
              >
                <BaseIcons :name="col.isPublic ? 'globe-alt' : 'lock-closed'" size="xs" />
                {{ col.isPublic ? 'Public' : 'Private' }}
              </span>
            </div>
          </article>
        </div>

        <!-- Truly empty (no collections at all) -->
        <div
          v-if="!isLoadingCollections && collections.length === 0"
          class="mt-5 flex flex-col items-center justify-center rounded-card border-2 border-dashed border-border bg-background-secondary/50 px-6 py-16 text-center"
        >
          <div class="mb-5 grid h-16 w-16 place-items-center rounded-full bg-orange-soft text-orange">
            <BaseIcons name="folder" size="xl" />
          </div>
          <h3 class="mb-2 font-montserrat text-xl font-bold text-text">No collections yet</h3>
          <p class="mx-auto max-w-xs text-pretty text-text-dim">
            Group saved recipes into boards — meal plans, holidays, anything.
          </p>
        </div>
      </div>

      <!-- All saved tab -->
      <div v-else-if="activeTab === 'all'">
        <PinGrid v-if="posts.length > 0" :posts="posts" @post-click="handlePostClick" />
        <div
          v-if="isLoadingPosts"
          class="mt-4 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          <PinSkeleton v-for="i in 5" :key="i" />
        </div>
        <div
          v-if="!isLoadingPosts && posts.length === 0"
          class="flex flex-col items-center justify-center rounded-card border-2 border-dashed border-border bg-background-secondary/50 px-6 py-20 text-center"
        >
          <div class="mb-5 grid h-16 w-16 place-items-center rounded-full bg-orange-soft text-orange">
            <BaseIcons name="bookmark" size="xl" />
          </div>
          <h3 class="mb-2 font-montserrat text-xl font-bold text-text">No saved recipes yet</h3>
          <p class="mx-auto max-w-xs text-pretty text-text-dim">
            Tap the bookmark on any recipe you love to save it.
          </p>
          <RouterLink to="/" class="btn-primary mt-6 !text-xs">Discover Recipes</RouterLink>
        </div>
      </div>
    </div>

    <!-- New collection modal -->
    <Transition name="modal">
      <div
        v-if="showNewModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
        @click.self="showNewModal = false"
      >
        <div
          class="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-surface shadow-modal"
        >
          <div class="p-7">
            <div class="mb-6 flex items-start justify-between">
              <div>
                <h3 class="font-montserrat text-2xl font-extrabold tracking-tight text-text">
                  New Collection
                </h3>
                <p class="mt-1 text-sm text-text-dim">Give your board a name and you’re set.</p>
              </div>
              <button
                @click="showNewModal = false"
                aria-label="Close"
                class="grid h-9 w-9 place-items-center rounded-full bg-background-secondary text-text-dim transition-[transform,color] duration-200 ease-revamp hover:text-text active:scale-90"
              >
                <BaseIcons name="x-mark" size="sm" />
              </button>
            </div>

            <label class="mb-2 block font-montserrat text-[11px] font-bold uppercase tracking-widest text-text-dim"
              >Name</label
            >
            <input
              v-model="newName"
              type="text"
              placeholder="Sunday Brunch"
              class="mb-4 w-full rounded-xl border-1.5 border-border bg-background-secondary px-4 py-3 text-sm text-text outline-none transition-colors duration-200 focus:border-orange"
              @keyup.enter="createCollection"
            />

            <label class="mb-2 block font-montserrat text-[11px] font-bold uppercase tracking-widest text-text-dim"
              >Description <span class="text-text-dim/60">(optional)</span></label
            >
            <textarea
              v-model="newDescription"
              rows="3"
              placeholder="Easy weekend recipes for slow mornings"
              class="mb-4 w-full resize-none rounded-xl border-1.5 border-border bg-background-secondary px-4 py-3 text-sm text-text outline-none transition-colors duration-200 focus:border-orange"
            ></textarea>

            <label
              class="mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background-secondary/60 p-3"
            >
              <input v-model="newPublic" type="checkbox" class="h-4 w-4 accent-orange" />
              <span class="text-sm text-text">
                <span class="font-semibold">Make public</span>
                <span class="text-text-dim"> — others can browse this board</span>
              </span>
            </label>

            <div class="flex justify-end gap-3">
              <button
                @click="showNewModal = false"
                class="rounded-full border border-border bg-surface px-5 py-2.5 font-montserrat text-xs font-bold uppercase tracking-widest text-text transition-[transform,color,border-color] duration-200 ease-revamp hover:border-orange/40 hover:text-orange active:scale-[0.96]"
              >
                Cancel
              </button>
              <button
                @click="createCollection"
                :disabled="!canCreate"
                class="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-2.5 font-montserrat text-xs font-bold uppercase tracking-widest text-white shadow-[0_6px_24px_rgba(255,107,53,0.35)] transition-[transform,background-color,opacity] duration-200 ease-revamp hover:bg-orange-light active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <span
                  v-if="isCreating"
                  class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></span>
                {{ isCreating ? 'Creating' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <RecipeModal :post-id="selectedPostId" :show="showPostModal" @close="showPostModal = false" />
  </div>
</template>

<style scoped>
.saved-recipes-view {
  -webkit-font-smoothing: antialiased;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition:
    opacity 0.25s cubic-bezier(0.34, 1.2, 0.64, 1),
    transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
.modal-leave-to > div {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active > div,
  .modal-leave-active > div {
    transition: none;
  }
}
</style>
