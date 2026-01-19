<script setup lang="ts">
import { ref, watch } from 'vue'
import { updateProfile, type UpdateProfileData } from '@/http/users'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/base/BaseButton.vue'

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
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
        <h2 class="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <button
          @click="handleClose"
          :disabled="isSubmitting"
          class="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <!-- Display Name -->
        <div>
          <label for="displayName" class="block text-sm font-semibold text-gray-700 mb-2">
            Display Name *
          </label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            required
            placeholder="Your display name"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <!-- Avatar URL -->
        <div>
          <label for="avatarUrl" class="block text-sm font-semibold text-gray-700 mb-2">
            Avatar URL
          </label>
          <input
            id="avatarUrl"
            v-model="avatarUrl"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <!-- Avatar Preview -->
        <div v-if="avatarUrl" class="flex items-center justify-center">
          <img
            :src="avatarUrl"
            alt="Avatar Preview"
            class="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            @error="() => {}"
          />
        </div>

        <!-- Bio -->
        <div>
          <label for="bio" class="block text-sm font-semibold text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            v-model="bio"
            rows="4"
            placeholder="Tell us about yourself..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-200">
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
          >
            {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
