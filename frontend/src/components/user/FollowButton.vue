<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/ui'
import BaseIcons from '@/components/base/BaseIcons.vue'

interface Props {
  userId: string
  isFollowing?: boolean
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  isFollowing: false,
  iconOnly: false,
  size: 'md',
})

const usersStore = useUsersStore()
const uiStore = useUiStore()
const isLoading = ref(false)
const localIsFollowing = ref(props.isFollowing || false)
const isHovered = ref(false)

// Keep local state in sync when the parent re-fetches or the component is
// reused for a different user (e.g. navigating between profiles).
watch(
  () => props.isFollowing,
  (val) => {
    localIsFollowing.value = val || false
  },
)

const sizeClass = computed(
  () =>
    ({
      sm: 'h-9 px-4 text-[11px]',
      md: 'h-11 px-6 text-xs',
      lg: 'h-12 px-8 text-sm',
    })[props.size],
)

// Label flips to "Unfollow" on hover so the destructive action reads clearly,
// while resting state stays calm ("Following").
const fullLabel = computed(() => {
  if (!localIsFollowing.value) return 'Follow'
  return isHovered.value ? 'Unfollow' : 'Following'
})

// Backend already knows the true state; treat these as a state-sync, not a failure.
function messageSaysAlreadyFollowing(msg: string) {
  return /already following/i.test(msg)
}
function messageSaysNotFollowing(msg: string) {
  return /not following/i.test(msg)
}

async function toggleFollow() {
  if (isLoading.value) return
  isLoading.value = true

  try {
    if (localIsFollowing.value) {
      await usersStore.unfollowUser(props.userId)
      localIsFollowing.value = false
      uiStore.showToast('Unfollowed user', 'success')
    } else {
      await usersStore.followUser(props.userId)
      localIsFollowing.value = true
      uiStore.showToast('Following user', 'success')
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || ''
    // Reconcile UI with the server's actual state instead of showing an error.
    if (messageSaysAlreadyFollowing(msg)) {
      localIsFollowing.value = true
    } else if (messageSaysNotFollowing(msg)) {
      localIsFollowing.value = false
    } else {
      uiStore.showToast('Failed to update follow status', 'error')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- Icon-only pill (compact lists, avatar overlays) -->
  <button
    v-if="iconOnly"
    type="button"
    :disabled="isLoading"
    @click="toggleFollow"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    :class="[
      'relative grid h-10 w-10 place-items-center rounded-full border shrink-0 shadow-card',
      'transition-[transform,background-color,border-color,color] duration-200 ease-revamp',
      'active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      localIsFollowing
        ? 'border-orange/30 bg-orange-soft text-orange dark:bg-orange/10'
        : 'border-orange bg-orange text-white hover:bg-orange-light',
    ]"
    :aria-label="fullLabel"
    :aria-pressed="localIsFollowing"
  >
    <span
      class="absolute inset-0 grid place-items-center transition-[opacity,transform,filter] duration-200 ease-revamp"
      :class="isLoading ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-50 blur-[2px] pointer-events-none'"
    >
      <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
    </span>
    <span
      class="grid place-items-center transition-[opacity,transform,filter] duration-200 ease-revamp"
      :class="isLoading ? 'opacity-0 scale-50 blur-[2px]' : 'opacity-100 scale-100 blur-0'"
    >
      <BaseIcons
        :name="localIsFollowing ? (isHovered ? 'user-minus' : 'check') : 'user-plus'"
        size="sm"
      />
    </span>
  </button>

  <!-- Full pill button -->
  <button
    v-else
    type="button"
    :disabled="isLoading"
    @click="toggleFollow"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    :class="[
      'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border font-montserrat font-bold uppercase tracking-widest',
      'transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-revamp',
      'active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:cursor-not-allowed disabled:opacity-70',
      sizeClass,
      localIsFollowing
        ? 'border-border bg-surface text-text shadow-card hover:border-red-400/60 hover:bg-red-500/5 hover:text-red-500 dark:hover:bg-red-500/10'
        : 'border-orange bg-orange text-white shadow-[0_6px_24px_rgba(255,107,53,0.35)] hover:bg-orange-light hover:shadow-[0_12px_32px_rgba(255,107,53,0.35)]',
    ]"
    :aria-pressed="localIsFollowing"
  >
    <!-- Loading overlay (cross-fades over the label) -->
    <span
      class="absolute inset-0 grid place-items-center transition-[opacity,transform,filter] duration-200 ease-revamp"
      :class="isLoading ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-75 blur-[2px] pointer-events-none'"
    >
      <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
    </span>

    <span
      class="inline-flex items-center gap-2 transition-[opacity,transform,filter] duration-200 ease-revamp"
      :class="isLoading ? 'opacity-0 scale-90 blur-[2px]' : 'opacity-100 scale-100 blur-0'"
    >
      <BaseIcons
        :name="localIsFollowing ? (isHovered ? 'user-minus' : 'check') : 'user-plus'"
        size="sm"
        class="transition-transform duration-200 ease-revamp"
      />
      <span class="tabular-nums">{{ fullLabel }}</span>
    </span>
  </button>
</template>
