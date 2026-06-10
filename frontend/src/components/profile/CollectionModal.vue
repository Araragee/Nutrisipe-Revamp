<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, onMounted } from 'vue'
import { collectionsApi, type Collection } from '@/http/endpoints/collections'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps<{
  show: boolean
  postId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const uiStore = useUiStore()
const collections = ref<Collection[]>([])
const loading = ref(true)
const newCollectionName = ref('')
const isCreating = ref(false)

async function loadCollections() {
  if (!authStore.user) return
  loading.value = true
  try {
    const response = await collectionsApi.getUserCollections(authStore.user.id)
    collections.value = response.data.data
  } catch (error) {
    logger.error('Failed to load collections:', error)
  } finally {
    loading.value = false
  }
}

async function addToCollection(collectionId: string) {
  try {
    await collectionsApi.addPost(collectionId, props.postId)
    uiStore.showToast('Added to collection', 'success')
    emit('close')
  } catch (error) {
    uiStore.showToast('Already in collection', 'info')
  }
}

async function createAndAdd() {
  if (!newCollectionName.value) return
  isCreating.value = true
  try {
    const response = await collectionsApi.create({ name: newCollectionName.value })
    const newCol = response.data.data
    await collectionsApi.addPost(newCol.id, props.postId)
    uiStore.showToast('Created and added!', 'success')
    emit('close')
  } catch (error) {
    uiStore.showToast('Failed to create collection', 'error')
  } finally {
    isCreating.value = false
  }
}

onMounted(loadCollections)
</script>

<template>
  <BaseModal :show="show" title="Save to Collection" size="md" @close="emit('close')">
    <div class="space-y-6">
      <div v-if="loading" class="flex justify-center py-10">
        <div class="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else class="max-h-96 overflow-y-auto space-y-3 -mx-6 px-6">
        <button
          v-for="col in collections"
          :key="col.id"
          @click="addToCollection(col.id)"
          class="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 hover:border-orange dark:hover:border-orange transition-all group"
        >
          <div class="w-12 h-12 bg-gray-200 dark:bg-zinc-600 rounded-lg flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
            <img v-if="col.thumbnailUrl" :src="col.thumbnailUrl" class="w-full h-full object-cover" />
            <span v-else>📁</span>
          </div>
          <div class="flex-1 text-left min-w-0">
            <div class="font-semibold text-sm text-gray-900 dark:text-white truncate">{{ col.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">{{ col.postCount }} items</div>
          </div>
          <span class="opacity-0 group-hover:opacity-100 text-orange transition-opacity flex-shrink-0">+</span>
        </button>

        <div v-if="collections.length === 0" class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400 text-sm">You don't have any collections yet.</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <input
          v-model="newCollectionName"
          type="text"
          placeholder="New collection name..."
          class="flex-1 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-sm outline-none focus:border-orange dark:text-white dark:placeholder-gray-400"
        />
        <button
          @click="createAndAdd"
          :disabled="!newCollectionName || isCreating"
          class="bg-orange hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create
        </button>
      </div>
    </template>
  </BaseModal>
</template>
