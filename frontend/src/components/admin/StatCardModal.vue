<script setup lang="ts">
import { DialogTitle } from '@headlessui/vue'
import BaseModal from '@/components/base/BaseModal.vue'
import type { Ingredient } from '@/types/Ingredient'

defineProps<{
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
  return '📝'
}
</script>

<template>
  <BaseModal :show="isOpen" size="lg" @close="emit('close')">
    <template #header>
      <DialogTitle as="h2" class="font-montserrat text-lg font-bold text-text">{{ title }}</DialogTitle>
      <p class="mt-0.5 text-xs text-text-dim tabular-nums">{{ items.length }} items</p>
    </template>
    <div class="space-y-2">
      <button
        v-for="it in items"
        :key="it.id"
        type="button"
        class="flex w-full items-center gap-4 rounded-xl border-1.5 border-transparent bg-background-secondary p-3.5 text-left transition-[border-color,background-color] duration-200 hover:border-orange hover:bg-orange/5"
        @click="emit('select', String(it.id))"
      >
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-xl" aria-hidden="true">
          {{ extras.get(String(it.id))?.emoji || '🍽️' }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-[14px] font-bold text-text">{{ it.food_item }}</div>
          <div class="truncate text-[12px] text-text-dim">{{ it.energy }} kcal · {{ extras.get(String(it.id))?.category || 'Unknown' }}</div>
        </div>
        <div class="shrink-0 text-lg" :title="extras.get(String(it.id))?.status">
          {{ getStatusEmoji(extras.get(String(it.id))?.status) }}
        </div>
      </button>
      <p v-if="items.length === 0" class="py-12 text-center text-text-dim">No items in this category.</p>
    </div>
  </BaseModal>
</template>
