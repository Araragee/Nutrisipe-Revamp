<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseIcons from '@/components/base/BaseIcons.vue'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const props = withDefaults(defineProps<{
  show: boolean
  title?: string
  size?: ModalSize
  closeButton?: boolean
  // bare: slot fills the panel edge to edge; caller owns header, padding and close button
  bare?: boolean
}>(), {
  title: '',
  size: 'md',
  closeButton: true,
  bare: false,
})

const emit = defineEmits<{
  close: []
}>()

const sizeClass = computed(() => ({
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-5xl',
}[props.size]))
</script>

<template>
  <!-- ponytail: Dialog gives Esc, focus trap, scroll lock and portal; @close fires on Esc + backdrop click.
       z-[300] sits above hand-rolled overlays (RecipeModal 100, StoryViewer 200), below toasts (9999).
       Keep comments OUTSIDE TransitionRoot/TransitionChild: as="template" needs a single child node. -->
  <TransitionRoot appear :show="show" as="template">
    <Dialog class="relative z-[300]" @close="emit('close')">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out motion-reduce:duration-0"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in motion-reduce:duration-0"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <TransitionChild
          as="template"
          enter="duration-300 ease-revamp motion-reduce:duration-0"
          enter-from="translate-y-8 opacity-0 sm:translate-y-0 sm:scale-95"
          enter-to="translate-y-0 opacity-100 sm:scale-100"
          leave="duration-150 ease-in motion-reduce:duration-0"
          leave-from="translate-y-0 opacity-100 sm:scale-100"
          leave-to="translate-y-8 opacity-0 sm:translate-y-0 sm:scale-95"
        >
          <DialogPanel
            class="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-card border border-border bg-surface text-text shadow-modal sm:max-h-[90dvh] sm:rounded-card"
            :class="sizeClass"
          >
            <slot v-if="bare" />
            <div
              v-else-if="$slots.header || title || closeButton"
              class="flex items-center gap-3 border-b border-border px-6 py-4"
              :class="{ 'border-b-0 pb-0': !$slots.header && !title }"
            >
              <div class="min-w-0 flex-1">
                <slot name="header">
                  <DialogTitle v-if="title" as="h2" class="font-montserrat text-lg font-bold text-text">
                    {{ title }}
                  </DialogTitle>
                </slot>
              </div>
              <BaseButton
                v-if="closeButton"
                variant="ghost"
                size="sm"
                icon
                aria-label="Close"
                class="-mr-2"
                @click="emit('close')"
              >
                <BaseIcons name="x-mark" size="md" />
              </BaseButton>
            </div>

            <div v-if="!bare" class="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              <slot />
            </div>

            <div
              v-if="!bare && $slots.footer"
              class="border-t border-border bg-surface px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <slot name="footer" />
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
