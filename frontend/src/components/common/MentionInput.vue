<template>
  <div class="relative w-full" ref="wrapperRef">
    <textarea
      ref="textareaRef"
      v-model="localValue"
      @input="handleInput"
      @keydown="handleKeyDown"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxLength"
      :class="textareaClass"
    ></textarea>

    <!-- Mention Suggestions Dropdown -->
    <div
      v-if="showSuggestions && searchResults.length > 0"
      class="absolute z-50 bg-surface border border-border rounded-lg shadow-modal max-h-[200px] overflow-y-auto min-w-[250px]"
      :style="suggestionsStyle"
    >
      <div
        v-for="(user, index) in searchResults"
        :key="user.id"
        class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
        :class="{ 'bg-orange-soft/40 dark:bg-orange-soft/18': index === selectedIndex }"
        @mousedown.prevent="selectUser(user)"
        @mouseenter="selectedIndex = index"
      >
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          :alt="user.username"
          class="w-9 h-9 rounded-full object-cover"
        />
        <div v-else class="w-9 h-9 rounded-full bg-orange-soft text-orange flex items-center justify-center font-semibold text-base">
          {{ user.username[0].toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm text-text">@{{ user.username }}</div>
          <div class="text-xs text-text-muted truncate">{{ user.displayName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useMentions, type MentionUser } from '@/composables/useMentions'

interface Props {
  modelValue: string
  placeholder?: string
  rows?: number
  maxLength?: number
  textareaClass?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Write a comment...',
  rows: 3,
  maxLength: 2000,
  textareaClass: 'w-full p-3 border border-border bg-background-secondary rounded-lg text-sm text-text font-inherit resize-y transition-colors focus:outline-none focus:border-orange'
})

const emit = defineEmits<Emits>()

const {
  searchResults,
  showSuggestions,
  selectedIndex,
  searchUsers,
  getMentionQuery,
  navigateUp,
  navigateDown,
  closeSuggestions,
  insertMention
} = useMentions()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const localValue = ref(props.modelValue)
const cursorPosition = ref(0)
const suggestionsPosition = ref({ top: 0, left: 0 })

// Update local value when prop changes
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

// Emit changes to parent
watch(localValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// Calculate suggestions dropdown position
const suggestionsStyle = computed(() => ({
  top: `${suggestionsPosition.value.top}px`,
  left: `${suggestionsPosition.value.left}px`
}))

// Handle textarea input
async function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  cursorPosition.value = target.selectionStart

  const query = getMentionQuery(localValue.value, cursorPosition.value)

  if (query !== null) {
    await searchUsers(query)
    calculateSuggestionsPosition()
  } else {
    closeSuggestions()
  }
}

// Calculate position for suggestions dropdown
function calculateSuggestionsPosition() {
  if (!textareaRef.value) return

  const textarea = textareaRef.value
  const textBeforeCursor = localValue.value.substring(0, cursorPosition.value)
  const lines = textBeforeCursor.split('\n')
  const currentLine = lines.length
  const lineHeight = 24 // Approximate line height in pixels

  suggestionsPosition.value = {
    top: currentLine * lineHeight,
    left: 0
  }
}

// Handle keyboard navigation
function handleKeyDown(event: KeyboardEvent) {
  if (!showSuggestions.value) return

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      navigateUp()
      break
    case 'ArrowDown':
      event.preventDefault()
      navigateDown()
      break
    case 'Enter':
    case 'Tab':
      if (searchResults.value.length > 0) {
        event.preventDefault()
        selectUser(searchResults.value[selectedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      closeSuggestions()
      break
  }
}

// Select a user from suggestions
function selectUser(user: MentionUser) {
  if (!textareaRef.value) return

  const { text, newCursorPosition } = insertMention(
    localValue.value,
    cursorPosition.value,
    user
  )

  localValue.value = text
  cursorPosition.value = newCursorPosition

  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.setSelectionRange(newCursorPosition, newCursorPosition)
    }
  })

  closeSuggestions()
}

// Close suggestions when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    closeSuggestions()
  }
}

// Add/remove click outside listener
watch(showSuggestions, (show) => {
  if (show) {
    document.addEventListener('mousedown', handleClickOutside)
  } else {
    document.removeEventListener('mousedown', handleClickOutside)
  }
})

// Expose focus method
defineExpose({
  focus: () => textareaRef.value?.focus()
})
</script>
