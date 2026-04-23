<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  maxLength?: number
  minHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Write something...',
  maxLength: 5000,
  minHeight: '120px',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = ref<HTMLDivElement | null>(null)
const isFocused = ref(false)

// Sync content with v-model
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && editor.value.innerHTML !== newValue) {
      editor.value.innerHTML = newValue
    }
  }
)

function handleInput() {
  if (editor.value) {
    emit('update:modelValue', editor.value.innerHTML)
  }
}

function execCommand(command: string, value?: string) {
  document.execCommand(command, false, value)
  editor.value?.focus()
}

function insertLink() {
  const url = prompt('Enter URL:')
  if (url) {
    execCommand('createLink', url)
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain')
  if (text) {
    document.execCommand('insertText', false, text)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  // Prevent exceeding max length
  if (editor.value && editor.value.textContent) {
    if (editor.value.textContent.length >= props.maxLength && event.key !== 'Backspace' && event.key !== 'Delete') {
      event.preventDefault()
    }
  }
}
</script>

<template>
  <div
    :class="[
      'border rounded-lg overflow-hidden transition-colors',
      isFocused
        ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-800'
        : 'border-gray-300 dark:border-gray-600',
    ]"
  >
    <!-- Toolbar -->
    <div class="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-wrap">
      <!-- Bold -->
      <button
        type="button"
        @click="execCommand('bold')"
        class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Bold (Ctrl+B)"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11 3H7a1 1 0 00-1 1v12a1 1 0 001 1h4a4 4 0 001.465-7.715A4 4 0 0011 3zm-1 12H8V5h2a2 2 0 110 4H8v2h2a2 2 0 110 4z" />
        </svg>
      </button>

      <!-- Italic -->
      <button
        type="button"
        @click="execCommand('italic')"
        class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Italic (Ctrl+I)"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11 3a1 1 0 10-2 0v4H8a1 1 0 100 2h1v2H8a1 1 0 100 2h1v4a1 1 0 102 0v-4h1a1 1 0 100-2h-1V9h1a1 1 0 100-2h-1V3z" />
        </svg>
      </button>

      <!-- Underline -->
      <button
        type="button"
        @click="execCommand('underline')"
        class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Underline (Ctrl+U)"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 17h12v2H4v-2zm6-14C7.239 3 5 5.239 5 8v5h2V8c0-1.657 1.343-3 3-3s3 1.343 3 3v5h2V8c0-2.761-2.239-5-5-5z" />
        </svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <!-- Unordered List -->
      <button
        type="button"
        @click="execCommand('insertUnorderedList')"
        class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Bullet List"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 100 4 2 2 0 000-4zM4 10a2 2 0 100 4 2 2 0 000-4zM4 16a2 2 0 100 4 2 2 0 000-4zM8 5h10v2H8V5zM8 11h10v2H8v-2zM8 17h10v2H8v-2z" />
        </svg>
      </button>

      <!-- Ordered List -->
      <button
        type="button"
        @click="execCommand('insertOrderedList')"
        class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Numbered List"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4h2v2H3V4zm0 4h2v2H3V8zm0 4h2v2H3v-2zm0 4h2v2H3v-2zm5-13h10v2H8V3zm0 4h10v2H8V7zm0 4h10v2H8v-2zm0 4h10v2H8v-2z" />
        </svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <!-- Link -->
      <button
        type="button"
        @click="insertLink"
        class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Insert Link"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
        </svg>
      </button>

      <!-- Clear Formatting -->
      <button
        type="button"
        @click="execCommand('removeFormat')"
        class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Clear Formatting"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Editor Content -->
    <div
      ref="editor"
      contenteditable="true"
      @input="handleInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @paste="handlePaste"
      @keydown="handleKeyDown"
      :style="{ minHeight: minHeight }"
      class="p-4 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none overflow-auto"
      :data-placeholder="placeholder"
    />

    <!-- Character Count -->
    <div class="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {{ editor?.textContent?.length || 0 }} / {{ maxLength }} characters
    </div>
  </div>
</template>

<style scoped>
[contenteditable]:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

/* Prose styles for rich text */
:deep(strong) {
  font-weight: 600;
}

:deep(em) {
  font-style: italic;
}

:deep(u) {
  text-decoration: underline;
}

:deep(a) {
  color: #f97316;
  text-decoration: underline;
}

:deep(ul), :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

:deep(li) {
  margin: 0.25rem 0;
}

:deep(p) {
  margin: 0.5rem 0;
}
</style>
