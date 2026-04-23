<script setup lang="ts">
import { ref } from 'vue'
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

async function toggleFollow() {
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
  } catch (error) {
    uiStore.showToast('Failed to update follow status', 'error')
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
