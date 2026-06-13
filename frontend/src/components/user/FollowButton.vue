<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/ui'
import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  userId: string
  isFollowing?: boolean
}

const props = defineProps<Props>()

const usersStore = useUsersStore()
const uiStore = useUiStore()
const isLoading = ref(false)
const localIsFollowing = ref(props.isFollowing || false)

// Keep local state in sync when the parent re-fetches or the component is
// reused for a different user (e.g. navigating between profiles).
watch(
  () => props.isFollowing,
  (val) => {
    localIsFollowing.value = val || false
  },
)

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
  <BaseButton
    :variant="localIsFollowing ? 'primaryOutlined' : 'primary'"
    size="sm"
    :loading="isLoading"
    @click="toggleFollow"
  >
    {{ localIsFollowing ? 'Following' : 'Follow' }}
  </BaseButton>
</template>
