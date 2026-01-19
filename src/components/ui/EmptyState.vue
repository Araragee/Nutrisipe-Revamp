<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div v-if="icon" class="mb-4 text-gray-400 dark:text-gray-600">
      <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
      </svg>
    </div>

    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {{ title }}
    </h3>

    <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
      {{ description }}
    </p>

    <button
      v-if="actionLabel"
      @click="emit('action')"
      class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
