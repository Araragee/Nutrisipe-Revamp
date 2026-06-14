<script setup lang="ts">
import IngredientPlate from '@/components/landing/IngredientPlate.vue'

defineProps<{
  show: boolean
}>()
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[10000] bg-[#0c0907] flex items-center justify-center pointer-events-none">
      <div class="flex flex-col items-center gap-6">
        <div class="w-40 h-40 bowl-pulse">
          <IngredientPlate />
        </div>
        <p class="font-montserrat font-bold text-white/80 tracking-widest uppercase text-[10px] animate-pulse">Loading...</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.bowl-pulse {
  animation: bowlFloat 2s ease-in-out infinite;
}
@keyframes bowlFloat {
  0%, 100% { transform: translateY(0px); opacity: 0.9; }
  50% { transform: translateY(-6px); opacity: 1; }
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
