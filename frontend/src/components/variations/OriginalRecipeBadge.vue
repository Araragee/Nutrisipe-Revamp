<template>
  <div v-if="originalRecipe" class="original-badge">
    <div class="badge-header">
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <span class="label">Forked from</span>
    </div>

    <div class="badge-content" @click="navigateToOriginal">
      <div class="original-image">
        <img
          :src="originalRecipe.originalPost.imageUrl"
          :alt="originalRecipe.originalPost.title"
        />
      </div>
      <div class="original-info">
        <h4 class="original-title">{{ originalRecipe.originalPost.title }}</h4>
        <div class="original-author">
          <img
            :src="originalRecipe.originalPost.user.avatarUrl || '/default-avatar.png'"
            :alt="originalRecipe.originalPost.user.displayName"
            class="author-avatar"
          />
          <span class="author-name">by {{ originalRecipe.originalPost.user.displayName }}</span>
        </div>
      </div>
      <svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>

    <div v-if="originalRecipe.variation.description" class="variation-note">
      <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      <span>{{ originalRecipe.variation.description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVariationsStore } from '@/stores/variations'

interface Props {
  postId: string
}

const props = defineProps<Props>()
const router = useRouter()
const variationsStore = useVariationsStore()

const originalRecipe = ref<any>(null)

onMounted(async () => {
  try {
    const result = await variationsStore.getOriginalRecipe(props.postId)
    originalRecipe.value = result
  } catch (err) {
    // Not a variation, which is fine
  }
})

const navigateToOriginal = () => {
  if (originalRecipe.value) {
    router.push(`/recipes/${originalRecipe.value.originalPost.id}`)
  }
}
</script>

<style scoped>
.original-badge {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 2px solid #10b981;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.badge-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #059669;
}

.badge-header .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.label {
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.badge-content:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateX(4px);
}

.original-image {
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
}

.original-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.original-info {
  flex: 1;
  min-width: 0;
}

.original-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.original-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 0.875rem;
  color: #6b7280;
}

.arrow-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #10b981;
  flex-shrink: 0;
}

.variation-note {
  display: flex;
  align-items: start;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.variation-note .icon {
  width: 1rem;
  height: 1rem;
  color: #10b981;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

@media (max-width: 640px) {
  .original-title {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
