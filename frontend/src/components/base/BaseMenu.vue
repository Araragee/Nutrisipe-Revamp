<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'

interface Option {
  label: string
  value: any
  icon?: any
  disabled?: boolean
  danger?: boolean
}

interface Props {
  label?: string
  options: Option[]
  align?: 'left' | 'right'
  width?: string
}

withDefaults(defineProps<Props>(), {
  align: 'right',
  width: 'w-56',
})

const emit = defineEmits(['select'])
</script>

<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <slot name="trigger">
        <MenuButton
          class="inline-flex w-full justify-center gap-x-1.5 rounded-3xl bg-background px-4 py-2.5 text-sm font-bold text-text shadow-sm border border-glass-border hover:bg-background-secondary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {{ label }}
          <ChevronDownIcon
            class="-mr-1 h-5 w-5 text-text-dim"
            aria-hidden="true"
          />
        </MenuButton>
      </slot>
    </div>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems
        :class="[
          'absolute z-50 mt-2 origin-top-right rounded-[20px] bg-background border border-glass-border shadow-modal focus:outline-none overflow-hidden p-1',
          align === 'right' ? 'right-0' : 'left-0',
          width,
        ]"
      >
        <div class="py-1">
          <MenuItem
            v-for="option in options"
            :key="option.value"
            v-slot="{ active }"
            :disabled="option.disabled"
          >
            <button
              :disabled="option.disabled"
              :class="[
                active ? 'bg-orange/10 text-orange' : 'text-text',
                option.danger ? 'hover:bg-red-500/10 hover:text-red-500' : '',
                option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                'group flex w-full items-center rounded-[12px] px-3 py-2.5 text-sm font-semibold transition-colors',
              ]"
              @click="!option.disabled && emit('select', option.value)"
            >
              <component
                :is="option.icon"
                v-if="option.icon"
                class="mr-3 h-5 w-5 shrink-0"
                :class="active ? 'text-orange' : 'text-text-dim'"
                aria-hidden="true"
              />
              {{ option.label }}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
