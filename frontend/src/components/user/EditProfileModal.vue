<script setup lang="ts">
import { ref, watch } from 'vue'
import { updateProfile, type UpdateProfileData } from '@/http/users'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const authStore = useAuthStore()

const displayName = ref(authStore.user?.displayName || '')
const bio = ref(authStore.user?.bio || '')
const avatarUrl = ref(authStore.user?.avatarUrl || '')
const isSubmitting = ref(false)
const error = ref<string | null>(null)

watch(() => props.show, (show) => {
  if (show) {
    displayName.value = authStore.user?.displayName || ''
    bio.value = authStore.user?.bio || ''
    avatarUrl.value = authStore.user?.avatarUrl || ''
    error.value = null
  }
})

async function handleSubmit() {
  isSubmitting.value = true
  error.value = null

  try {
    const data: UpdateProfileData = {
      displayName: displayName.value.trim(),
      bio: bio.value.trim() || undefined,
      avatarUrl: avatarUrl.value.trim() || undefined,
    }

    const updatedUser = await updateProfile(data)

    // Update auth store
    authStore.setUser(updatedUser)

    emit('updated')
    emit('close')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update profile'
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('close')
  }
}
</script>

<template>
  <BaseModal :show="show" title="Edit Profile" @close="handleClose">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
        {{ error }}
      </div>

      <!-- Display Name -->
      <div>
        <label for="displayName" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Display Name *
        </label>
        <input
          id="displayName"
          v-model="displayName"
          type="text"
          required
          placeholder="Your display name"
          class="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all dark:bg-zinc-700 dark:text-white"
        />
      </div>

      <!-- Avatar URL -->
      <div>
        <label for="avatarUrl" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          v-model="avatarUrl"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          class="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all dark:bg-zinc-700 dark:text-white"
        />
      </div>

      <!-- Avatar Preview -->
      <div v-if="avatarUrl" class="flex items-center justify-center">
        <img
          :src="avatarUrl"
          alt="Avatar Preview"
          class="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-zinc-600"
          @error="() => {}"
        />
      </div>

      <!-- Bio -->
      <div>
        <label for="bio" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          v-model="bio"
          rows="4"
          placeholder="Tell us about yourself..."
          class="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all dark:bg-zinc-700 dark:text-white resize-none"
        />
      </div>
    </form>

    <template #footer>
      <div class="flex gap-3">
        <BaseButton
          type="button"
          variant="secondary"
          @click="handleClose"
          :disabled="isSubmitting"
          class="flex-1"
        >
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
          :loading="isSubmitting"
          class="flex-1"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
