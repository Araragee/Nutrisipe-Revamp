<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  show: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  closeable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  size: 'md',
  closeable: true,
})

const emit = defineEmits(['close'])

const close = () => {
  if (props.closeable) {
    emit('close')
  }
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full m-4',
}
</script>

<template>
  <TransitionRoot as="template" :show="show">
    <Dialog as="div" class="relative z-[100]" @close="close">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center sm:p-0"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              :class="[
                'relative transform overflow-hidden rounded-[32px] bg-background border-1.5 border-glass-border text-left shadow-modal transition-all sm:my-8 w-full',
                sizeClasses[size],
              ]"
            >
              <div class="absolute right-4 top-4 z-10">
                <button
                  v-if="closeable"
                  type="button"
                  class="rounded-full bg-background-secondary p-2 text-text-muted hover:text-orange transition-colors focus:outline-none"
                  @click="close"
                >
                  <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div class="px-6 pb-8 pt-10">
                <div v-if="title" class="mb-6">
                  <DialogTitle
                    as="h3"
                    class="font-montserrat text-2xl font-black leading-6 text-text tracking-tight"
                  >
                    {{ title }}
                  </DialogTitle>
                </div>
                <div class="mt-2">
                  <slot />
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
