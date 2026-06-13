<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  show: boolean
}>()
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[10000] bg-[#0c0907] flex items-center justify-center pointer-events-none">
      <div class="flex flex-col items-center">
        <span class="logo-mark w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(255,107,53,0.3)]">
          <svg viewBox="0 0 22 28" fill="none" class="w-[36px] h-[40px]">
            <path class="n-path" d="M 4,25 C 4,18 4,9 5,4 C 9,10 13,19 17,25 C 17,17 17,9 18,4"
              stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <p class="mt-5 font-montserrat font-bold text-white/80 tracking-widest uppercase text-[10px] animate-pulse">Loading...</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.logo-mark {
  background: var(--orange);
}
.n-path {
  stroke-dasharray: 72;
  stroke-dashoffset: 72;
  animation: drawN 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes drawN {
  to { stroke-dashoffset: 0; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
