<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collectionsApi } from '@/http/endpoints/collections'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
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

async function load() {
  isLoading.value = true
  try {
    const response = await collectionsApi.getById(collectionId())
    collection.value = response.data.data
  } catch (error) {
    console.error('Failed to load collection:', error)
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

async function removeFromCollection(postId: string) {
  try {
    await collectionsApi.removePost(collectionId(), postId)
    if (collection.value) {
      collection.value.posts = collection.value.posts.filter((p: any) => p.id !== postId)
    }
    uiStore.showToast('Removed from collection', 'success')
  } catch {
    uiStore.showToast('Failed to remove', 'error')
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
  <div class="collection-detail min-h-screen py-10 px-6 md:px-12">
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="collection" class="max-w-7xl mx-auto">
      <RouterLink to="/saved" class="text-xs font-bold uppercase tracking-widest text-orange hover:underline mb-2 block">← Saved</RouterLink>

      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 class="font-montserrat font-extrabold text-4xl tracking-tight">{{ collection.name }}</h1>
          <p v-if="collection.description" class="text-text-muted mt-2 max-w-2xl">{{ collection.description }}</p>
          <p class="text-text-dim text-xs font-bold uppercase tracking-widest mt-3">
            {{ collection.posts?.length ?? 0 }} recipes · {{ collection.isPublic ? 'Public' : 'Private' }}
          </p>
        </div>
        <button
          v-if="collection.userId === authStore.user?.id"
          @click="deleteCollection"
          :disabled="isDeleting"
          class="btn-secondary px-6 py-2.5 text-xs hover:!text-red-500 hover:!border-red-500"
        >Delete Collection</button>
      </header>

      <div v-if="collection.posts && collection.posts.length > 0">
        <PinGrid :posts="collection.posts" @post-click="handlePostClick" />
        <div v-if="collection.userId === authStore.user?.id" class="mt-10 text-center">
          <p class="text-text-dim text-xs">Long-press a card to remove · or use the recipe modal Save button</p>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-24 text-center">
        <span class="text-5xl mb-6">📁</span>
        <h3 class="text-xl font-bold mb-2">Empty collection</h3>
        <p class="text-text-dim max-w-xs mx-auto">Save recipes here from the recipe modal.</p>
      </div>
    </div>

    <RecipeModal
      :post-id="selectedPostId"
      :show="showPostModal"
      @close="showPostModal = false"
    />
  </div>
</template>
