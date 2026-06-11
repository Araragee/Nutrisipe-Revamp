<template>
  <div class="variation-chain">
    <div class="header">
      <h3>Recipe Lineage</h3>
      <p class="subtitle">Trace the evolution of this recipe</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Loading chain...</span>
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="chain.length === 0" class="empty">
      <p>This is an original recipe with no variations yet.</p>
    </div>

    <div v-else class="chain-container">
      <div class="chain-info">
        <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <span>{{ depth }} generation{{ depth === 1 ? '' : 's' }} deep</span>
      </div>

      <div class="chain-list">
        <div
          v-for="(item, index) in chain"
          :key="item.post.id"
          class="chain-item"
          :class="{ 'is-current': index === chain.length - 1 }"
        >
          <div class="chain-connector" v-if="index > 0">
            <div class="connector-line"></div>
            <div class="connector-arrow">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>

          <div class="item-card" @click="navigateToPost(item.post.id)">
            <div class="item-image">
              <img :src="item.post.imageUrl" :alt="item.post.title" />
              <div v-if="index === 0" class="badge original">Original</div>
              <div v-else-if="index === chain.length - 1" class="badge current">Current</div>
              <div v-else class="badge">Fork {{ index }}</div>
            </div>

            <div class="item-content">
              <div class="item-header">
                <h4 class="item-title">{{ item.post.title }}</h4>
                <div class="generation-badge">Gen {{ index + 1 }}</div>
              </div>

              <div class="item-author">
                <img
                  :src="item.post.user.avatarUrl || '/default-avatar.png'"
                  :alt="item.post.user.displayName"
                  class="author-avatar"
                />
                <span class="author-name">{{ item.post.user.displayName }}</span>
              </div>

              <p v-if="item.variation?.description" class="item-description">
                <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <span>{{ item.variation.description }}</span>
              </p>

              <div class="item-stats">
                <div class="stat">
                  <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                  </svg>
                  <span>{{ item.post.likeCount || 0 }}</span>
                </div>
                <div class="stat">
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{{ item.post.variationCount || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chain-summary">
        <h4>Evolution Summary</h4>
        <p>This recipe has evolved through {{ depth }} generation{{ depth === 1 ? '' : 's' }}, with each creator adding their unique twist.</p>
        <div class="contributors">
          <span class="label">Contributors:</span>
          <AvatarStack :users="chain.map(item => item.post.user)" :max="5" size="md" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVariationsStore } from '@/stores/variations'
import AvatarStack from '@/components/common/AvatarStack.vue'
import type { VariationChainItem } from '@/http/endpoints/variations'

interface Props {
  postId: string
}

const props = defineProps<Props>()
const router = useRouter()
const variationsStore = useVariationsStore()

const chain = ref<VariationChainItem[]>([])
const depth = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  await loadChain()
})

const loadChain = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await variationsStore.getVariationChain(props.postId)
    chain.value = response.chain
    depth.value = response.depth
  } catch (err: any) {
    error.value = 'Failed to load variation chain'
  } finally {
    loading.value = false
  }
}

const navigateToPost = (postId: string) => {
  router.push(`/recipes/${postId}`)
}
</script>

<style scoped>
.variation-chain {
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

.chain-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.chain-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  color: #1e40af;
  margin-bottom: 1.5rem;
}

.chain-info .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.chain-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chain-item {
  position: relative;
}

.chain-connector {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
  padding-left: 2rem;
}

.connector-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(to right, #d1d5db, #10b981);
}

.connector-arrow {
  color: #10b981;
  margin-left: 0.5rem;
}

.connector-arrow svg {
  width: 1.5rem;
  height: 1.5rem;
}

.item-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: #10b981;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.chain-item.is-current .item-card {
  background: #ecfdf5;
  border-color: #10b981;
}

.item-image {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
}

.badge.original {
  background: #10b981;
}

.badge.current {
  background: #6366f1;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.item-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  flex: 1;
}

.generation-badge {
  padding: 0.25rem 0.625rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}

.item-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.item-description {
  display: flex;
  align-items: start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border-left: 3px solid #10b981;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  font-style: italic;
}

.item-description .icon {
  width: 1rem;
  height: 1rem;
  color: #10b981;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.item-stats {
  display: flex;
  gap: 1rem;
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

.chain-summary {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.chain-summary h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.chain-summary p {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.contributors {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.avatar-stack {
  display: flex;
  margin-left: -0.5rem;
}

.avatar-stack .avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid white;
  object-fit: cover;
  margin-left: -0.5rem;
  transition: transform 0.2s;
}

.avatar-stack .avatar:hover {
  transform: translateY(-2px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .item-card {
    flex-direction: column;
  }

  .item-image {
    width: 100%;
    height: 200px;
  }
}
</style>
