<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { User } from '@/types'

interface Props {
  user: User
}

const props = defineProps<Props>()
const router = useRouter()

const goToProfile = () => {
  router.push(`/users/${props.user.id}`)
}
</script>

<template>
  <div
    @click="goToProfile"
    class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
  >
    <img
      v-if="user.image"
      :src="user.image"
      :alt="user.name"
      class="w-12 h-12 rounded-full object-cover"
    />
    <div v-else class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
      <span class="text-lg font-bold text-primary-700">{{ user.name.charAt(0) }}</span>
    </div>
    <div class="flex-1">
      <p class="font-medium text-gray-900">{{ user.name }}</p>
      <p class="text-sm text-gray-600">{{ user.email }}</p>
    </div>
    <span v-if="user.is_admin" class="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-full">
      Admin
    </span>
  </div>
</template>
