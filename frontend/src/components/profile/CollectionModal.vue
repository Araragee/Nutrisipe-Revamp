<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, onMounted } from 'vue'
import { collectionsApi, type Collection } from '@/http/endpoints/collections'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { resolveImage } from '@/utils/imageUrl'
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
const addingId = ref<string | null>(null)

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
  if (addingId.value) return
  addingId.value = collectionId
  try {
    await collectionsApi.addPost(collectionId, props.postId)
    uiStore.showToast('Added to collection', 'success')
    emit('close')
  } catch (error) {
    uiStore.showToast('Already in collection', 'info')
  } finally {
    addingId.value = null
  }
}

async function createAndAdd() {
  if (!newCollectionName.value.trim()) return
  isCreating.value = true
  try {
    const response = await collectionsApi.create({ name: newCollectionName.value.trim() })
    const newCol = response.data.data
    await collectionsApi.addPost(newCol.id, props.postId)
    uiStore.showToast('Created and added', 'success')
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
    <div class="space-y-4">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-10">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent"></div>
      </div>

      <!-- List -->
      <div v-else-if="collections.length > 0" class="-mx-1 max-h-80 space-y-2 overflow-y-auto px-1">
        <button
          v-for="col in collections"
          :key="col.id"
          @click="addToCollection(col.id)"
          :disabled="!!addingId"
          class="group flex w-full items-center gap-4 rounded-2xl border border-border bg-background-secondary p-3 text-left transition-[transform,border-color] duration-200 ease-revamp hover:border-orange/40 active:scale-[0.99] disabled:opacity-60"
        >
          <div
            class="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface text-text-dim outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
          >
            <img
              v-if="col.thumbnailUrl"
              :src="resolveImage(col.thumbnailUrl, col.id)"
              :alt="col.name"
              class="h-full w-full object-cover"
            />
            <BaseIcons v-else name="folder" size="md" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate font-montserrat text-sm font-bold text-text">{{ col.name }}</div>
            <div class="text-[11px] font-bold uppercase tracking-widest text-text-dim">
              <span class="tabular-nums">{{ col.postCount ?? 0 }}</span> items
            </div>
          </div>
          <span
            class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-orange opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <span
              v-if="addingId === col.id"
              class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            ></span>
            <BaseIcons v-else name="plus" size="sm" />
          </span>
        </button>
      </div>

      <!-- Empty -->
      <div v-else class="flex flex-col items-center gap-2 py-8 text-center">
        <div class="grid h-12 w-12 place-items-center rounded-full bg-orange-soft text-orange">
          <BaseIcons name="folder" size="md" />
        </div>
        <p class="text-sm text-text-dim">No collections yet — create your first one below.</p>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <input
          v-model="newCollectionName"
          type="text"
          placeholder="New collection name…"
          class="flex-1 rounded-xl border-1.5 border-border bg-background-secondary px-4 py-2.5 text-sm text-text outline-none transition-colors duration-200 focus:border-orange"
          @keyup.enter="createAndAdd"
        />
        <button
          @click="createAndAdd"
          :disabled="!newCollectionName.trim() || isCreating"
          class="inline-flex items-center gap-1.5 rounded-xl bg-orange px-5 py-2.5 font-montserrat text-xs font-bold uppercase tracking-widest text-white transition-[transform,background-color,opacity] duration-200 ease-revamp hover:bg-orange-light active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            v-if="isCreating"
            class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          ></span>
          Create
        </button>
      </div>
    </template>
  </BaseModal>
</template>
