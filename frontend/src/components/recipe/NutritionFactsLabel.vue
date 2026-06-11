<script setup lang="ts">
import { computed } from 'vue'
import type { NutritionTotals } from '@/composables/useNutritionCalc'

const props = withDefaults(defineProps<{
  data: NutritionTotals
  yieldAmount?: number | string
  showAttribution?: boolean
  compact?: boolean
}>(), {
  yieldAmount: 1,
  showAttribution: true,
  compact: false,
})

const rows = computed(() => [
  { label: 'Energy', value: props.data.energy, unit: 'kcal', digits: 0, bold: true },
  { label: 'Protein', value: props.data.protein, unit: 'g', digits: 1, bold: true },
  { label: 'Fat', value: props.data.fat, unit: 'g', digits: 1, bold: true },
  { label: 'Carbohydrate', value: props.data.carb, unit: 'g', digits: 1, bold: true },
  { label: 'Calcium', value: props.data.calcium, unit: 'mg', digits: 1, bold: false },
  { label: 'Phosphorus', value: props.data.phos, unit: 'mg', digits: 1, bold: false },
  { label: 'Iron', value: props.data.iron, unit: 'mg', digits: 1, bold: false },
  { label: 'Vitamin A', value: props.data.vit_a, unit: 'mcg', digits: 1, bold: false },
  { label: 'Thiamin', value: props.data.thia, unit: 'mg', digits: 1, bold: false },
  { label: 'Riboflavin', value: props.data.ribo, unit: 'mg', digits: 1, bold: false },
  { label: 'Niacin', value: props.data.nia, unit: 'mg NE', digits: 1, bold: false },
  { label: 'Vitamin C', value: props.data.vit_c, unit: 'mg', digits: 1, bold: false },
])

const fmt = (n: number, d: number) => (Number.isFinite(n) ? n.toFixed(d) : '0')
</script>

<template>
  <div
    class="nutrition-label bg-background-secondary border-1.5 border-border rounded-2xl"
    :class="compact ? 'p-4' : 'p-6'"
  >
    <h3
      class="font-montserrat font-extrabold tracking-tight"
      :class="compact ? 'text-lg mb-3' : 'text-2xl mb-4'"
    >
      Nutrition Facts
    </h3>

    <div class="border-t-2 border-border pt-3 space-y-2">
      <div class="flex justify-between text-xs text-text-dim">
        <span>Edible portion weight</span>
        <span class="font-bold text-text">{{ fmt(data.ediblePortionWeight, 0) }} g</span>
      </div>
      <div class="flex justify-between text-xs text-text-dim">
        <span>Per serving</span>
        <span class="font-bold text-text">{{ yieldAmount }}</span>
      </div>
    </div>

    <table class="w-full mt-3 border-t-2 border-border">
      <tbody>
        <tr
          v-for="r in rows"
          :key="r.label"
          class="border-b border-border"
        >
          <td
            class="py-2 text-sm"
            :class="r.bold ? 'font-extrabold text-text' : 'text-text-muted'"
          >
            {{ r.label }}
          </td>
          <td
            class="py-2 text-sm text-right tabular-nums"
            :class="r.bold ? 'font-extrabold text-text' : 'text-text-muted'"
          >
            {{ fmt(r.value, r.digits) }} {{ r.unit }}
          </td>
        </tr>
      </tbody>
    </table>

    <p
      v-if="showAttribution"
      class="text-[10px] text-text-dim mt-4 leading-relaxed"
    >
      Estimated using Food and Nutrition Research Institute's Food Composition Table (PhilFCT).
    </p>
  </div>
</template>
