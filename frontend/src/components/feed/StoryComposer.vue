<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, onMounted } from 'vue'
import { storiesApi } from '@/http/endpoints/stories'
import { usersApi } from '@/http/endpoints/users'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { resolveImage } from '@/utils/imageUrl'
import ImageUpload from '@/components/ui/ImageUpload.vue'

const emit = defineEmits<{
  close: []
  created: []
}>()

const authStore = useAuthStore()
const uiStore = useUiStore()

const imageUrl = ref('')
const caption = ref('')
const linkedPostId = ref<string | null>(null)
const savedPosts = ref<any[]>([])
const isLoadingSaved = ref(false)
const isSubmitting = ref(false)

async function loadSaved() {
  if (!authStore.user?.id) return
  isLoadingSaved.value = true
  try {
    const res = await usersApi.getSavedPosts(authStore.user.id, 1, 12)
    savedPosts.value = res.data.data.map((item: any) => item.post || item)
  } catch (error) {
    logger.error('Saved posts error:', error)
  } finally {
    isLoadingSaved.value = false
  }
}

async function submit() {
  if (!imageUrl.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await storiesApi.create({
      imageUrl: imageUrl.value,
      caption: caption.value.trim() || undefined,
      postId: linkedPostId.value || undefined,
    })
    uiStore.showToast('Story posted — visible for 24 hours', 'success')
    emit('created')
  } catch {
    uiStore.showToast('Failed to post story', 'error')
  } finally {
    isSubmitting.value = false
  }
}

function selectLinkedPost(post: any) {
  if (linkedPostId.value === post.id) {
    linkedPostId.value = null
    return
  }
  linkedPostId.value = post.id
  if (!imageUrl.value) imageUrl.value = post.imageUrl
}

onMounted(loadSaved)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[180] flex items-center justify-center p-6 bg-black/60"
      @click.self="emit('close')"
    >
      <div class="bg-surface border-1.5 border-border rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-modal">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="font-montserrat font-extrabold text-xl">Share a story</h3>
            <p class="text-xs text-text-dim">Visible to followers for 24 hours.</p>
          </div>
          <button @click="emit('close')" class="text-text-dim text-xl">✕</button>
        </div>

        <div v-if="imageUrl" class="mb-4 relative">
          <img :src="resolveImage(imageUrl)" class="w-full aspect-[3/4] object-cover rounded-2xl" />
          <button
            @click="imageUrl = ''"
            class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/55 text-white text-sm"
          >✕</button>
        </div>

        <ImageUpload
          v-else
          v-model="imageUrl"
          :max-size="4"
          @error="(msg: string) => uiStore.showToast(msg, 'error')"
        />

        <label class="block text-xs font-bold uppercase tracking-widest text-text-dim mt-5 mb-2">Caption (optional)</label>
        <textarea
          v-model="caption"
          maxlength="280"
          rows="2"
          placeholder="Say something…"
          class="w-full px-4 py-3 bg-background-secondary border-1.5 border-border rounded-xl text-sm outline-none focus:border-orange resize-none"
        ></textarea>

        <div v-if="savedPosts.length > 0" class="mt-5">
          <label class="block text-xs font-bold uppercase tracking-widest text-text-dim mb-3">Link a saved recipe (optional)</label>
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              v-for="post in savedPosts"
              :key="post.id"
              @click="selectLinkedPost(post)"
              :class="[
                'shrink-0 w-20 rounded-xl overflow-hidden border-2 transition-all',
                linkedPostId === post.id ? 'border-orange scale-105' : 'border-transparent hover:border-orange/40',
              ]"
            >
              <img :src="resolveImage(post.imageUrl, post.id)" class="w-full h-20 object-cover" :alt="post.title" />
              <p class="text-[9px] font-bold truncate p-1">{{ post.title }}</p>
            </button>
          </div>
        </div>

        <button
          @click="submit"
          :disabled="!imageUrl || isSubmitting"
          class="btn-primary w-full py-3 mt-6 text-sm disabled:opacity-50"
        >
          {{ isSubmitting ? 'Posting…' : 'Post story' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
