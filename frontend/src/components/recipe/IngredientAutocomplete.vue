<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ingredientsApi } from '@/http/endpoints/ingredients'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const allIngredientNames = ref<string[]>([])
const showSuggestions = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const filteredSuggestions = computed(() => {
  if (!props.modelValue) return []
  const query = props.modelValue.toLowerCase()
  return allIngredientNames.value
    .filter(name => name.includes(query) && name !== query)
    .slice(0, 5)
})

async function fetchNames() {
  try {
    const response = await ingredientsApi.getNames()
    allIngredientNames.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch ingredient names:', error)
  }
}

function selectSuggestion(name: string) {
  emit('update:modelValue', name)
  showSuggestions.value = false
}

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
  showSuggestions.value = true
}

function handleBlur() {
  // Delay to allow clicking on suggestion
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

onMounted(fetchNames)
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
      class="w-full bg-background border border-glass-border rounded-xl p-3.5 text-sm outline-none focus:border-orange transition-all font-medium"
      :placeholder="placeholder"
    />
    
    <div
      v-if="showSuggestions && filteredSuggestions.length > 0"
      class="absolute left-0 right-0 top-full mt-1 bg-background-secondary border border-glass-border rounded-xl shadow-xl z-50 overflow-hidden"
    >
      <button
        v-for="name in filteredSuggestions"
        :key="name"
        @click="selectSuggestion(name)"
        type="button"
        class="w-full text-left px-4 py-2 text-sm hover:bg-orange hover:text-white transition-colors"
      >
        {{ name }}
      </button>
    </div>
  </div>
</template>
