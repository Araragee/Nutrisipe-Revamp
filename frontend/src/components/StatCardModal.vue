<script setup lang="ts">
import { ref } from 'vue'
import type { Ingredient } from '@/typescript/interface/Ingredient'

const props = defineProps<{
  title: string
  items: Ingredient[]
  extras: Map<string, any>
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', id: string): void
}>()

const getStatusEmoji = (status: string) => {
  if (status === 'verified') return '✅'
  if (status === 'pending') return '⏳'
  return '📝' // draft
}


</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);">
        <!-- Backdrop click to close -->
        <div class="absolute inset-0" @click="emit('close')"></div>

        <!-- Modal content -->
        <div class="relative bg-surface dark:bg-zinc-900 border border-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
          
          <!-- Left side: Title -->
          <div class="w-full md:w-2/5 p-8 flex flex-col items-center justify-center bg-background-secondary border-b md:border-b-0 md:border-r border-border relative">
            <h2 class="font-montserrat font-black text-2xl text-text text-center mb-2 z-10">{{ title }}</h2>
            <p class="text-text-dim text-sm text-center mb-6 z-10">{{ items.length }} items</p>
            
            <button @click="emit('close')" class="absolute top-4 left-4 p-2 rounded-full bg-surface border border-border text-text-muted hover:text-text transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Right side: List of items -->
          <div class="w-full md:w-3/5 p-6 flex flex-col max-h-[60vh] md:max-h-none">
            <div class="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              <button
                v-for="it in items" :key="it.id"
                @click="emit('select', String(it.id))"
                class="w-full text-left p-3.5 rounded-xl border-1.5 border-transparent hover:border-orange hover:bg-orange/5 bg-background-secondary flex items-center gap-4 transition-all"
              >
                <div class="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-xl shrink-0">
                  {{ extras.get(String(it.id))?.emoji || '🍽️' }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-[14px] text-text truncate">{{ it.food_item }}</div>
                  <div class="text-[12px] text-text-dim truncate">{{ it.energy }} kcal · {{ extras.get(String(it.id))?.category || 'Unknown' }}</div>
                </div>
                <div class="shrink-0 text-lg" :title="extras.get(String(it.id))?.status">
                  {{ getStatusEmoji(extras.get(String(it.id))?.status) }}
                </div>
              </button>
              
              <div v-if="items.length === 0" class="py-12 text-center text-text-dim">
                No items in this category.
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--border);
  border-radius: 10px;
}
</style>
