<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { searchApi } from '@/http/endpoints/search'
import { resolveImage } from '@/utils/imageUrl'
import BrandMeshBackground from './BrandMeshBackground.vue'
import type { Post } from '@/typescript/interface/Post'

const props = withDefaults(
  defineProps<{
    posts?: Post[]
    count?: number
    intensity?: number
    fallbackVariant?: 'warm' | 'cool' | 'sunset' | 'morning'
    blur?: number
  }>(),
  {
    count: 12,
    intensity: 0.55,
    fallbackVariant: 'warm',
    blur: 40,
  },
)

const fetched = ref<Post[] | null>(null)
const failed = ref(false)

const tiles = computed(() => {
  const source = props.posts && props.posts.length > 0 ? props.posts : fetched.value ?? []
  return source.slice(0, props.count)
})

const showFallback = computed(() => failed.value || tiles.value.length === 0)

async function load() {
  if (props.posts && props.posts.length > 0) return
  try {
    const response = await searchApi.getTrending({ period: '30days', limit: props.count })
    fetched.value = response.data.data
  } catch (error) {
    failed.value = true
  }
}

onMounted(load)
watch(() => props.posts, load)
</script>

<template>
  <div
    class="recipe-mosaic-bg pointer-events-none absolute inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <BrandMeshBackground v-if="showFallback" :variant="fallbackVariant" :intensity="0.8" />

    <div
      v-else
      class="absolute inset-0 grid"
      :style="{
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0px',
        filter: `blur(${blur}px) saturate(1.25)`,
        opacity: intensity,
      }"
    >
      <div
        v-for="(post, idx) in tiles"
        :key="post.id"
        class="aspect-square overflow-hidden"
        :style="{ animationDelay: `${idx * 0.08}s` }"
      >
        <img
          :src="resolveImage(post.imageUrl, post.id)"
          alt=""
          class="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>

    <div class="absolute inset-0 recipe-mosaic-veil"></div>
  </div>
</template>

<style scoped>
.recipe-mosaic-bg {
  isolation: isolate;
  background: var(--background, #faf6ee);
}

.recipe-mosaic-veil {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.15) 0%,
    rgba(0, 0, 0, 0.35) 60%,
    var(--background, #faf6ee) 100%
  );
}

:global(.dark) .recipe-mosaic-bg {
  background: var(--background, #0a0410);
}
:global(.dark) .recipe-mosaic-veil {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.6) 60%,
    var(--background, #0a0410) 100%
  );
}
</style>
