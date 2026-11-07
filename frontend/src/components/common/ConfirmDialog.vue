<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { useConfirm, type ConfirmOptions } from '@/composables/useConfirm'

const { options, settle } = useConfirm()

// keeps text on screen during the leave transition after options reset to null
const shown = shallowRef<Readonly<ConfirmOptions> | null>(null)

const isOpen = computed(() => options.value !== null)

watch(options, (next) => {
  if (next) shown.value = next
})
</script>

<template>
  <BaseModal :show="isOpen" :title="shown?.title" size="sm" :close-button="false" @close="settle(false)">
    <p v-if="shown?.message" class="text-sm leading-relaxed text-text-muted">{{ shown.message }}</p>
    <template #footer>
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <BaseButton variant="secondary" @click="settle(false)">
          {{ shown?.cancelLabel ?? 'Cancel' }}
        </BaseButton>
        <BaseButton :variant="shown?.danger ? 'danger' : 'primary'" @click="settle(true)">
          {{ shown?.confirmLabel ?? 'Confirm' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
