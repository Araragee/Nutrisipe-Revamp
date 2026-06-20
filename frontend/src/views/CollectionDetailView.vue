<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collectionsApi } from '@/http/endpoints/collections'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { resolveImage } from '@/utils/imageUrl'
import PinGrid from '@/components/feed/PinGrid.vue'
import RecipeModal from '@/components/feed/RecipeModal.vue'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()
const authStore = useAuthStore()

const collection = ref<any>(null)
const isLoading = ref(true)
const selectedPostId = ref<string | null>(null)
const showPostModal = ref(false)
const isDeleting = ref(false)

const collectionId = () =>
  (Array.isArray(route.params.id) ? route.params.id[0] : route.params.id) as string

const isOwner = computed(() => collection.value?.userId === authStore.user?.id)
const postCount = computed(() => collection.value?.posts?.length ?? 0)

const coverImage = computed(() => {
  if (!collection.value) return ''
  const first = collection.value.posts?.[0]
  return resolveImage(collection.value.thumbnailUrl || first?.imageUrl, collection.value.id)
})

async function load() {
  isLoading.value = true
  try {
    const response = await collectionsApi.getById(collectionId())
    collection.value = response.data.data
  } catch (error) {
    logger.error('Failed to load collection:', error)
    uiStore.showToast('Collection not found', 'error')
    router.push('/saved')
  } finally {
    isLoading.value = false
  }
}

async function deleteCollection() {
  if (!confirm('Delete this collection? Posts will remain saved individually.')) return
  isDeleting.value = true
  try {
    await collectionsApi.delete(collectionId())
    uiStore.showToast('Collection deleted', 'success')
    router.push('/saved')
  } catch {
    uiStore.showToast('Failed to delete collection', 'error')
  } finally {
    isDeleting.value = false
  }
}

async function shareCollection() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    uiStore.showToast('Link copied to clipboard', 'success')
  } catch {
    uiStore.showToast('Could not copy link', 'error')
  }
}

function handlePostClick(postId: string) {
  selectedPostId.value = postId
  showPostModal.value = true
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="collection-detail min-h-screen">
    <div v-if="isLoading" class="flex justify-center py-32">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-orange border-t-transparent"></div>
    </div>

    <template v-else-if="collection">
      <!-- Cover banner -->
      <div class="relative h-44 overflow-hidden bg-background-secondary sm:h-56">
        <img
          v-if="coverImage"
          :src="coverImage"
          :alt="collection.name"
          class="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/15"></div>

        <div class="absolute inset-x-0 top-0 mx-auto max-w-6xl px-5 pt-6 sm:px-8">
          <RouterLink
            to="/saved"
            class="inline-flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1.5 font-montserrat text-[11px] font-bold uppercase tracking-widest text-text shadow-card backdrop-blur transition-[transform,color] duration-200 ease-revamp hover:text-orange active:scale-[0.96]"
          >
            <BaseIcons name="arrow-left" size="xs" />
            Saved
          </RouterLink>
        </div>
      </div>

      <div class="mx-auto max-w-6xl px-5 sm:px-8">
        <!-- Header -->
        <header class="-mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div class="min-w-0">
            <h1 class="text-balance font-montserrat text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
              {{ collection.name }}
            </h1>
            <p
              v-if="collection.description"
              class="mt-2 max-w-2xl text-pretty leading-relaxed text-text-muted"
            >
              {{ collection.description }}
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-text-dim shadow-card"
              >
                <BaseIcons name="squares-plus" size="xs" />
                <span class="tabular-nums">{{ postCount }}</span>
                {{ postCount === 1 ? 'recipe' : 'recipes' }}
              </span>
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-text-dim shadow-card"
              >
                <BaseIcons :name="collection.isPublic ? 'globe-alt' : 'lock-closed'" size="xs" />
                {{ collection.isPublic ? 'Public' : 'Private' }}
              </span>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <button
              @click="shareCollection"
              class="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-5 font-montserrat text-xs font-bold uppercase tracking-widest text-text shadow-card transition-[transform,color,border-color] duration-200 ease-revamp hover:border-orange/40 hover:text-orange active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <BaseIcons name="share" size="sm" />
              Share
            </button>
            <button
              v-if="isOwner"
              @click="deleteCollection"
              :disabled="isDeleting"
              aria-label="Delete collection"
              class="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-text-dim shadow-card transition-[transform,color,border-color,background-color] duration-200 ease-revamp hover:border-red-400/60 hover:bg-red-500/5 hover:text-red-500 active:scale-[0.94] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span
                v-if="isDeleting"
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              ></span>
              <BaseIcons v-else name="trash" size="sm" />
            </button>
          </div>
        </header>

        <!-- Grid -->
        <div class="py-8">
          <template v-if="postCount > 0">
            <PinGrid :posts="collection.posts" @post-click="handlePostClick" />
            <p v-if="isOwner" class="mt-8 text-center text-xs text-text-dim">
              Manage recipes from each card’s save button in the recipe view.
            </p>
          </template>

          <div
            v-else
            class="flex flex-col items-center justify-center rounded-card border-2 border-dashed border-border bg-background-secondary/50 px-6 py-24 text-center"
          >
            <div class="mb-5 grid h-16 w-16 place-items-center rounded-full bg-orange-soft text-orange">
              <BaseIcons name="folder" size="xl" />
            </div>
            <h3 class="mb-2 font-montserrat text-xl font-bold text-text">Empty collection</h3>
            <p class="mx-auto max-w-xs text-pretty text-text-dim">
              Save recipes here from any recipe’s save button.
            </p>
            <RouterLink to="/" class="btn-primary mt-6 !text-xs">Find recipes to save</RouterLink>
          </div>
        </div>
      </div>
    </template>

    <RecipeModal :post-id="selectedPostId" :show="showPostModal" @close="showPostModal = false" />
  </div>
</template>

<style scoped>
.collection-detail {
  -webkit-font-smoothing: antialiased;
}
</style>
