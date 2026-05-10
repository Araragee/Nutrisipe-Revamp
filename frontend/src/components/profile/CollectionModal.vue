<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { collectionsApi, type Collection } from '@/http/endpoints/collections'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

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
    console.error('Failed to load collections:', error)
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
  <div v-if="show" class="fixed inset-0 z-[110] flex items-center justify-center p-6">
    <div class="absolute inset-0 bg-background/80 backdrop-blur-md" @click="emit('close')"></div>
    <div class="relative w-full max-w-md bg-background-secondary border border-glass-border rounded-[40px] p-8 shadow-2xl animate-revamp">
      <button @click="emit('close')" class="absolute top-6 right-6 w-9 h-9 rounded-full bg-background border-1.5 border-glass-border text-text-muted hover:border-orange hover:text-orange flex items-center justify-center transition-all">✕</button>
      <h2 class="font-montserrat font-extrabold text-2xl mb-8">Save to Collection</h2>

      <div v-if="loading" class="flex justify-center py-10">
         <div class="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else class="space-y-4 max-h-[400px] overflow-y-auto mb-8 pr-2">
         <button
           v-for="col in collections"
           :key="col.id"
           @click="addToCollection(col.id)"
           class="w-full flex items-center gap-4 p-4 rounded-2xl bg-background border border-glass-border hover:border-orange transition-all group"
         >
            <div class="w-12 h-12 bg-background-tertiary rounded-xl flex items-center justify-center text-xl overflow-hidden">
               <img v-if="col.thumbnailUrl" :src="col.thumbnailUrl" class="w-full h-full object-cover" />
               <span v-else>📁</span>
            </div>
            <div class="flex-1 text-left">
               <div class="font-bold text-sm">{{ col.name }}</div>
               <div class="text-[10px] text-text-dim uppercase tracking-widest">{{ col.postCount }} items</div>
            </div>
            <span class="opacity-0 group-hover:opacity-100 text-orange transition-opacity">+</span>
         </button>

         <div v-if="collections.length === 0" class="text-center py-6">
            <p class="text-text-dim text-xs">You don't have any collections yet.</p>
         </div>
      </div>

      <div class="border-t border-glass-border pt-8">
         <div class="flex gap-2">
            <input
              v-model="newCollectionName"
              type="text"
              placeholder="New collection name..."
              class="flex-1 bg-background border border-glass-border rounded-xl px-4 py-3 text-sm outline-none focus:border-orange"
            />
            <button
              @click="createAndAdd"
              :disabled="!newCollectionName || isCreating"
              class="bg-orange text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-dark disabled:opacity-50 transition-all"
            >
               Create
            </button>
         </div>
      </div>
    </div>
  </div>
</template>
