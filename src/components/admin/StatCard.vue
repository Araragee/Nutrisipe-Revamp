<template>
  <div :class="['bg-white dark:bg-gray-800 rounded-lg shadow-md p-6', borderColorClass]">
    <div class="flex items-center justify-between mb-2">
      <span class="text-2xl">{{ icon }}</span>
      <span :class="['text-3xl font-bold', textColorClass]">{{ value }}</span>
    </div>
    <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{{ title }}</h3>
    <p class="text-xs text-gray-500 dark:text-gray-500">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: number
  subtitle: string
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}>()

const borderColorClass = computed(() => {
  const colors = {
    blue: 'border-l-4 border-blue-500',
    green: 'border-l-4 border-green-500',
    purple: 'border-l-4 border-purple-500',
    orange: 'border-l-4 border-orange-500',
  }
  return colors[props.color]
})

const textColorClass = computed(() => {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
  }
  return colors[props.color]
})
</script>
