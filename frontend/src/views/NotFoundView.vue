<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseIcons from '@/components/base/BaseIcons.vue'

const router = useRouter()
</script>

<template>
  <div class="not-found-view relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 md:py-16 overflow-hidden">
    <!-- ambient warmth -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 opacity-70"
      style="background: radial-gradient(60% 50% at 50% 30%, var(--orange-soft), transparent 70%)"
      aria-hidden="true"
    ></div>

    <!-- floating pantry crumbs -->
    <div class="nf-float" aria-hidden="true">
      <span>🍅</span><span>🥑</span><span>🌿</span><span>🧄</span><span>🍋</span>
    </div>

    <div class="nf-stack relative flex flex-col items-center">
      <div class="nf-badge w-16 h-16 rounded-card bg-orange-soft text-orange flex items-center justify-center mb-7 shadow-card">
        <BaseIcons name="magnifying-glass" size="xl" />
      </div>

      <p class="nf-404 font-montserrat font-black text-7xl sm:text-8xl tracking-tight text-text leading-none mb-3 tabular-nums">404</p>
      <h1 class="nf-title font-montserrat font-extrabold text-2xl sm:text-3xl tracking-tight text-text mb-2.5 text-balance">
        This dish is off the menu
      </h1>
      <p class="nf-sub text-text-muted max-w-sm mb-9 leading-relaxed text-pretty">
        That recipe, page, or link doesn't exist or may have moved. Let's get you back to something tasty.
      </p>

      <div class="nf-actions flex flex-col sm:flex-row items-center gap-3">
        <button
          @click="router.back()"
          class="h-11 px-5 rounded-btn border-1.5 border-border bg-surface text-text-muted hover:text-text hover:border-orange font-montserrat font-bold text-sm transition-[color,border-color,transform] duration-200 active:scale-[0.96]"
        >
          Go back
        </button>
        <RouterLink
          to="/"
          class="h-11 px-6 rounded-btn bg-orange text-white hover:bg-orange-light font-montserrat font-bold text-sm flex items-center shadow-[0_6px_24px_var(--orange-glow)] hover:shadow-[0_12px_32px_var(--orange-glow)] hover:-translate-y-0.5 transition-[transform,box-shadow,background-color] duration-200 active:scale-[0.96]"
        >
          Back to Discover
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nf-stack > * {
  opacity: 0;
  animation: nfRise 0.55s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}
.nf-badge { animation-delay: 0.05s; }
.nf-404 { animation-delay: 0.13s; }
.nf-title { animation-delay: 0.21s; }
.nf-sub { animation-delay: 0.29s; }
.nf-actions { animation-delay: 0.37s; }

@keyframes nfRise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.nf-float {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}
.nf-float span {
  position: absolute;
  font-size: 30px;
  opacity: 0.28;
  animation: nfDrift 8s ease-in-out infinite;
}
.nf-float span:nth-child(1) { left: 12%; top: 22%; animation-delay: 0s; }
.nf-float span:nth-child(2) { left: 80%; top: 28%; animation-delay: 1.4s; font-size: 36px; }
.nf-float span:nth-child(3) { left: 18%; top: 72%; animation-delay: 2.6s; }
.nf-float span:nth-child(4) { left: 84%; top: 70%; animation-delay: 0.8s; font-size: 34px; }
.nf-float span:nth-child(5) { left: 50%; top: 14%; animation-delay: 2s; }

@keyframes nfDrift {
  0%, 100% { transform: translateY(0) rotate(-8deg); }
  50% { transform: translateY(-18px) rotate(8deg); }
}

@media (prefers-reduced-motion: reduce) {
  .nf-stack > * { animation: none; opacity: 1; }
  .nf-float span { animation: none; }
}
</style>
