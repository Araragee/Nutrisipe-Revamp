<template>
  <div class="mention-input-wrapper" ref="wrapperRef">
    <textarea
      ref="textareaRef"
      v-model="localValue"
      @input="handleInput"
      @keydown="handleKeyDown"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxLength"
      class="mention-textarea"
    ></textarea>

    <!-- Mention Suggestions Dropdown -->
    <div
      v-if="showSuggestions && searchResults.length > 0"
      class="mention-suggestions"
      :style="suggestionsStyle"
    >
      <div
        v-for="(user, index) in searchResults"
        :key="user.id"
        class="mention-suggestion-item"
        :class="{ selected: index === selectedIndex }"
        @mousedown.prevent="selectUser(user)"
        @mouseenter="selectedIndex = index"
      >
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          :alt="user.username"
          class="suggestion-avatar"
        />
        <div v-else class="suggestion-avatar-placeholder">
          {{ user.username[0].toUpperCase() }}
        </div>
        <div class="suggestion-info">
          <div class="suggestion-username">@{{ user.username }}</div>
          <div class="suggestion-display-name">{{ user.displayName }}</div>
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
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Write a comment...',
  rows: 3,
  maxLength: 2000
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

<style scoped>
.mention-input-wrapper {
  position: relative;
  width: 100%;
}

.mention-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.mention-textarea:focus {
  outline: none;
  border-color: #4caf50;
}

.mention-suggestions {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  min-width: 250px;
}

.mention-suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.mention-suggestion-item:hover,
.mention-suggestion-item.selected {
  background-color: #f5f5f5;
}

.suggestion-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.suggestion-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-username {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.suggestion-display-name {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Scrollbar styling */
.mention-suggestions::-webkit-scrollbar {
  width: 6px;
}

.mention-suggestions::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.mention-suggestions::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 8px;
}

.mention-suggestions::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
