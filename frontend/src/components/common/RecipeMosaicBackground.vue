<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { searchApi } from '@/http/endpoints/search'
import { resolveImage } from '@/utils/imageUrl'
import { useTheme } from '@/composables/useTheme'
import BrandMeshBackground from './BrandMeshBackground.vue'
import type { Post } from '@/typescript/interface/Post'

type FallbackVariant = 'warm' | 'cool' | 'sunset' | 'morning'

const props = withDefaults(
  defineProps<{
    posts?: Post[]
    count?: number
    /** Scrim strength: higher = more wash behind the hero text, lower = more food visible. */
    intensity?: number
    fallbackVariant?: FallbackVariant
    blur?: number
  }>(),
  {
    count: 12,
    intensity: 0.55,
    fallbackVariant: 'warm',
    blur: 40,
  },
)

const { isDark } = useTheme()

const fetched = ref<Post[] | null>(null)
const failed = ref(false)

const tiles = computed(() => {
  const source = props.posts && props.posts.length > 0 ? props.posts : fetched.value ?? []
  return source.slice(0, props.count)
})

const showFallback = computed(() => failed.value || tiles.value.length === 0)

// Food stays vivid; the wash comes only from the scrim below — never from
// dimming the imagery toward a flat white/black base. In dark mode we keep the
// photography close to full strength so the hero reads as a lit kitchen, not a
// blacked-out panel.
const gridStyle = computed(() => ({
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '0px',
  filter: `blur(${props.blur}px) saturate(1.25)`,
  opacity: isDark.value ? 0.78 : 1,
}))

// The veil exists for one reason: keep centered hero text legible over busy
// food photography. When we fall back to the brand mesh (no photos), there is
// nothing to obscure, so the heavy scrim only darkens the page — drop it to a
// whisper-thin base fade instead.
const veilStyle = computed(() => {
  if (showFallback.value) {
    // Just fade the very bottom into the page background; no central dimming.
    return {
      background: 'linear-gradient(to bottom, transparent 72%, var(--bg) 100%)',
    }
  }
  if (isDark.value) {
    // Gentle top-down warmth-preserving scrim — enough for AA text contrast,
    // light enough that the food still glows behind the hero.
    return {
      background:
        'linear-gradient(to bottom, rgba(8,6,4,0.30) 0%, rgba(8,6,4,0.48) 64%, var(--bg) 100%)',
    }
  }
  const core = Math.min(props.intensity + 0.18, 0.82)
  const mid = Math.max(props.intensity - 0.15, 0.08)
  const edge = Math.max(props.intensity - 0.35, 0.04)
  return {
    background:
      `radial-gradient(ellipse 92% 75% at 50% 44%, rgba(255,255,255,${core}) 0%, rgba(255,255,255,${mid}) 62%, rgba(255,255,255,${edge}) 100%),` +
      ' linear-gradient(to bottom, transparent 60%, var(--bg) 100%)',
  }
})

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

    <div v-else class="absolute inset-0 grid" :style="gridStyle">
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

    <div class="absolute inset-0" :style="veilStyle"></div>
  </div>
</template>

<style scoped>
.recipe-mosaic-bg {
  isolation: isolate;
  background: var(--bg, #fafafa);
}

:global(.dark .recipe-mosaic-bg) {
  background: var(--bg, #09090b);
}
</style>
