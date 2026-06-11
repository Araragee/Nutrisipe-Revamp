<script setup lang="ts">
import { logger } from '@/utils/logger'
import { ref, onMounted, computed } from 'vue'
import { ingredientsApi } from '@/http/endpoints/ingredients'
import type { Ingredient } from '@/typescript/interface/Ingredient'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select-ingredient': [ingredient: Ingredient]
  'clear-ingredient': []
}>()

const allIngredients = ref<Ingredient[]>([])
const showSuggestions = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const filteredSuggestions = computed<Ingredient[]>(() => {
  if (!props.modelValue) return []
  const query = props.modelValue.toLowerCase()
  return allIngredients.value
    .filter(i => {
      const name = i.food_item.toLowerCase()
      const alt = (i.alt_name ?? '').toLowerCase()
      return (name.includes(query) || alt.includes(query)) && name !== query
    })
    .slice(0, 8)
})

async function fetchIngredients() {
  try {
    const response = await ingredientsApi.getAll({ all: 1 })
    const payload = (response.data as any)?.data ?? response.data
    allIngredients.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    logger.error('Failed to fetch ingredients:', error)
  }
}

function selectSuggestion(ing: Ingredient) {
  emit('update:modelValue', ing.food_item)
  emit('select-ingredient', ing)
  showSuggestions.value = false
}

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
  emit('clear-ingredient')
  showSuggestions.value = true
}

function handleBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

onMounted(fetchIngredients)
</script>

<template>
  <div class="relative w-full">
    <input
      ref="inputRef"
      :value="modelValue"
      @input="handleInput"
      @focus="showSuggestions = true"
      @blur="handleBlur"
      type="text"
      class="w-full bg-background border border-border rounded-xl p-3.5 text-sm outline-none focus:border-orange transition-all font-medium"
      :placeholder="placeholder"
    />

    <div
      v-if="showSuggestions && filteredSuggestions.length > 0"
      class="absolute left-0 right-0 top-full mt-1 bg-background-secondary border border-border rounded-xl shadow-xl z-50 overflow-hidden"
    >
      <button
        v-for="ing in filteredSuggestions"
        :key="ing.id"
        @click="selectSuggestion(ing)"
        type="button"
        class="w-full text-left px-4 py-2 text-sm hover:bg-orange hover:text-white transition-colors"
      >
        <span class="font-medium">{{ ing.food_item }}</span>
        <span v-if="ing.alt_name" class="text-text-dim text-xs ml-2">({{ ing.alt_name }})</span>
      </button>
    </div>
  </div>
</template>
