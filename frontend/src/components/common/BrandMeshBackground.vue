<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'warm' | 'cool' | 'sunset' | 'morning'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    intensity?: number
    grain?: boolean
  }>(),
  {
    variant: 'warm',
    intensity: 1,
    grain: true,
  },
)

const palette = computed(() => {
  switch (props.variant) {
    case 'cool':
      return ['oklch(72% 0.14 220)', 'oklch(80% 0.11 180)', 'oklch(68% 0.18 280)', 'oklch(85% 0.08 200)']
    case 'sunset':
      return ['oklch(72% 0.20 30)', 'oklch(78% 0.16 60)', 'oklch(65% 0.22 350)', 'oklch(82% 0.12 45)']
    case 'morning':
      return ['oklch(88% 0.08 80)', 'oklch(85% 0.12 50)', 'oklch(92% 0.06 100)', 'oklch(78% 0.14 35)']
    case 'warm':
    default:
      return ['oklch(75% 0.17 40)', 'oklch(82% 0.13 60)', 'oklch(70% 0.18 25)', 'oklch(88% 0.09 70)']
  }
})

const blobs = computed(() =>
  palette.value.map((color, i) => ({
    color,
    x: [10, 70, 25, 80][i],
    y: [15, 25, 70, 65][i],
    size: [55, 65, 60, 50][i],
    delay: i * 4,
    duration: 22 + i * 3,
  })),
)
</script>

<template>
  <div
    class="brand-mesh-bg pointer-events-none absolute inset-0 overflow-hidden"
    :style="{ opacity: intensity }"
    aria-hidden="true"
  >
    <div
      v-for="(b, i) in blobs"
      :key="i"
      class="brand-mesh-blob absolute rounded-full"
      :style="{
        background: b.color,
        width: `${b.size}vmax`,
        height: `${b.size}vmax`,
        left: `${b.x}%`,
        top: `${b.y}%`,
        transform: 'translate(-50%, -50%)',
        animationDelay: `-${b.delay}s`,
        animationDuration: `${b.duration}s`,
      }"
    ></div>

    <svg v-if="grain" class="brand-mesh-grain absolute inset-0 w-full h-full mix-blend-overlay opacity-[0.35]">
      <filter id="brand-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#brand-grain)" />
    </svg>

    <div class="brand-mesh-veil absolute inset-0"></div>
  </div>
</template>

<style scoped>
.brand-mesh-bg {
  isolation: isolate;
  background: var(--background, #faf6ee);
}

.brand-mesh-blob {
  filter: blur(80px) saturate(1.25);
  opacity: 0.78;
  will-change: transform;
  animation-name: meshDrift;
  animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

@keyframes meshDrift {
  0% {
    transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1);
  }
  33% {
    transform: translate(-50%, -50%) translate3d(8vw, -6vh, 0) scale(1.08);
  }
  66% {
    transform: translate(-50%, -50%) translate3d(-6vw, 7vh, 0) scale(0.94);
  }
  100% {
    transform: translate(-50%, -50%) translate3d(5vw, 4vh, 0) scale(1.02);
  }
}

.brand-mesh-veil {
  background: radial-gradient(
    ellipse at center,
    transparent 0%,
    rgba(0, 0, 0, 0.05) 70%,
    rgba(0, 0, 0, 0.12) 100%
  );
}

:global(.dark) .brand-mesh-bg {
  background: var(--background, #0a0410);
}
:global(.dark) .brand-mesh-blob {
  opacity: 0.55;
}
:global(.dark) .brand-mesh-veil {
  background: radial-gradient(
    ellipse at center,
    transparent 0%,
    rgba(0, 0, 0, 0.2) 70%,
    rgba(0, 0, 0, 0.45) 100%
  );
}

@media (prefers-reduced-motion: reduce) {
  .brand-mesh-blob {
    animation: none;
  }
}
</style>
