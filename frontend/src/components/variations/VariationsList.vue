<template>
  <div class="variations-list">
    <div class="header">
      <h3>Recipe Variations ({{ totalCount }})</h3>
      <p class="subtitle">See how others have adapted this recipe</p>
    </div>

    <div v-if="loading && !variations.length" class="loading">
      <div class="spinner"></div>
      <span>Loading variations...</span>
    </div>

    <div v-else-if="error" class="error">
      <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="!variations.length" class="empty">
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <h4>No variations yet</h4>
      <p>Be the first to create a variation of this recipe!</p>
    </div>

    <div v-else class="variations-grid">
      <div
        v-for="variation in variations"
        :key="variation.id"
        class="variation-card"
        @click="handleVariationClick(variation)"
      >
        <div class="variation-image">
          <img
            :src="variation.variationPost.imageUrl"
            :alt="variation.variationPost.title"
          />
          <div class="variation-badge">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Fork</span>
          </div>
        </div>

        <div class="variation-content">
          <h4 class="variation-title">{{ variation.variationPost.title }}</h4>

          <div class="variation-author">
            <img
              :src="variation.user.avatarUrl || '/default-avatar.png'"
              :alt="variation.user.displayName"
              class="author-avatar"
            />
            <span class="author-name">{{ variation.user.displayName }}</span>
          </div>

          <p v-if="variation.description" class="variation-description">
            {{ variation.description }}
          </p>

          <div class="variation-stats">
            <div class="stat">
              <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
              </svg>
              <span>{{ variation.variationPost._count?.likes || 0 }}</span>
            </div>
            <div class="stat">
              <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
              </svg>
              <span>{{ variation.variationPost._count?.comments || 0 }}</span>
            </div>
            <div class="stat">
              <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              <span>{{ variation.variationPost._count?.saves || 0 }}</span>
            </div>
          </div>

          <div class="variation-date">
            {{ formatDate(variation.createdAt) }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="hasMore && variations.length > 0" class="load-more">
      <button @click="loadMore" :disabled="loading" class="btn-load-more">
        <span v-if="loading" class="spinner-small"></span>
        <span>{{ loading ? 'Loading...' : 'Load More' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useVariationsStore } from '@/stores/variations'
import type { RecipeVariation } from '@/http/endpoints/variations'

interface Props {
  postId: string
  initialVariations?: RecipeVariation[]
}

const props = defineProps<Props>()
const router = useRouter()
const variationsStore = useVariationsStore()

const variations = ref<RecipeVariation[]>(props.initialVariations || [])
const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const totalCount = ref(0)
const totalPages = ref(0)

const hasMore = computed(() => page.value < totalPages.value)

onMounted(async () => {
  if (!props.initialVariations) {
    await loadVariations()
  }
})

const loadVariations = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await variationsStore.getVariations(props.postId, page.value, 12)
    variations.value = response.variations
    totalCount.value = response.pagination.total
    totalPages.value = response.pagination.totalPages
  } catch (err: any) {
    error.value = 'Failed to load variations'
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loading.value || !hasMore.value) return

  page.value++
  loading.value = true

  try {
    const response = await variationsStore.getVariations(props.postId, page.value, 12)
    variations.value.push(...response.variations)
  } catch (err: any) {
    error.value = 'Failed to load more variations'
    page.value-- // Revert page increment on error
  } finally {
    loading.value = false
  }
}

const handleVariationClick = (variation: RecipeVariation) => {
  router.push(`/recipe/${variation.variationPostId}`)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.variations-list {
  padding: 1.5rem 0;
}

.header {
  margin-bottom: 1.5rem;
}

.header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

.loading,
.error,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;
}

.loading .spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e5e7eb;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

.error {
  color: #dc2626;
}

.error .icon,
.empty .icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.empty h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.variations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.variation-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.variation-card:hover {
  border-color: #10b981;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.variation-image {
  position: relative;
  width: 100%;
  padding-top: 66.67%;
  overflow: hidden;
}

.variation-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.variation-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(16, 185, 129, 0.9);
  color: white;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.variation-badge .icon {
  width: 0.875rem;
  height: 0.875rem;
}

.variation-content {
  padding: 1rem;
}

.variation-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.variation-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.author-avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 0.875rem;
  color: #6b7280;
}

.variation-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.variation-stats {
  display: flex;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.stat .icon {
  width: 1rem;
  height: 1rem;
}

.variation-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.btn-load-more {
  padding: 0.625rem 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-load-more:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #10b981;
  color: #10b981;
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
