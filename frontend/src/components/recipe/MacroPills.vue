<script setup lang="ts">
import { computed } from 'vue'
import type { RecipeNutrition } from '@/typescript/interface/Recipe'

interface Props {
  nutrition?: RecipeNutrition
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  nutrition: undefined,
  size: 'sm',
})

const hasData = computed(() => {
  const n = props.nutrition
  return !!n && [n.calories, n.protein, n.carbs, n.fat].some((v) => typeof v === 'number')
})

const sizeStyle = computed(() => ({
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-[13px] px-2.5 py-1 gap-1.5',
}[props.size]))

const pills = computed(() => {
  const n = props.nutrition
  if (!n) return []
  return [
    {
      key: 'kcal',
      label: `${Math.round(n.calories ?? 0)} kcal`,
      show: typeof n.calories === 'number',
      style: 'bg-orange-soft text-orange-deep dark:text-orange-light font-semibold',
    },
    {
      key: 'protein',
      label: `${Math.round(n.protein ?? 0)}P`,
      show: typeof n.protein === 'number',
      style: 'bg-orange-soft text-orange-deep dark:text-orange-light font-medium',
    },
    {
      key: 'carbs',
      label: `${Math.round(n.carbs ?? 0)}C`,
      show: typeof n.carbs === 'number',
      style: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-400 font-medium',
    },
    {
      key: 'fat',
      label: `${Math.round(n.fat ?? 0)}F`,
      show: typeof n.fat === 'number',
      style: 'bg-teal-100 text-teal-800 dark:bg-teal-400/10 dark:text-teal-400 font-medium',
    },
  ].filter((p) => p.show)
})
</script>

<template>
  <div v-if="hasData" class="flex flex-wrap items-center gap-1">
    <span
      v-for="pill in pills"
      :key="pill.key"
      :class="['inline-flex items-center rounded-full tabular-nums', sizeStyle, pill.style]"
    >
      {{ pill.label }}
    </span>
  </div>
</template>
