<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { usersApi } from '@/http/endpoints/users'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'

const showImageUpload = ref(false)

const authStore = useAuthStore()
const uiStore = useUiStore()

const displayName = ref('')
const bio = ref('')
const avatarUrl = ref('')

const isLoading = ref(false)
const isSaving = ref(false)

onMounted(() => {
  if (authStore.user) {
    displayName.value = authStore.user.displayName || ''
    bio.value = authStore.user.bio || ''
    avatarUrl.value = authStore.user.avatarUrl || ''
  }
})

async function handleSave() {
  if (!displayName.value.trim()) {
    uiStore.showToast('Display name is required', 'error')
    return
  }

  isSaving.value = true

  try {
    const response = await usersApi.updateProfile({
      displayName: displayName.value.trim(),
      bio: bio.value.trim() || undefined,
      avatarUrl: avatarUrl.value.trim() || undefined,
    })

    // Update auth store with new user data
    authStore.setUser(response.data.data)

    uiStore.showToast('Profile updated successfully', 'success')
  } catch (error: any) {
    uiStore.showToast(error.response?.data?.message || 'Failed to update profile', 'error')
  } finally {
    isSaving.value = false
  }
}

function handleCancel() {
  if (authStore.user) {
    displayName.value = authStore.user.displayName || ''
    bio.value = authStore.user.bio || ''
    avatarUrl.value = authStore.user.avatarUrl || ''
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p class="text-gray-600 dark:text-gray-400">Manage your profile and preferences</p>
      </div>

      <LoadingSpinner v-if="isLoading" class="mt-8" />

      <!-- Settings Card -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <!-- Profile Section -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Profile Information
          </h2>

          <div class="space-y-6">
            <!-- Avatar Section -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Profile Picture
              </label>

              <div class="flex items-center gap-4">
                <div
                  class="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0"
                >
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    :alt="displayName"
                    class="w-full h-full object-cover"
                  />
                  <span v-else>{{ displayName.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900 dark:text-white mb-1">
                    {{ authStore.user?.username }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {{ authStore.user?.email }}
                  </p>
                  <button
                    @click="showImageUpload = !showImageUpload"
                    class="text-sm text-orange-500 hover:text-orange-600 font-medium"
                  >
                    {{ showImageUpload ? 'Hide upload' : 'Upload new picture' }}
                  </button>
                </div>
              </div>

              <!-- Image Upload Component -->
              <div v-if="showImageUpload" class="mt-4">
                <ImageUpload
                  v-model="avatarUrl"
                  :max-size="2"
                  @error="(msg) => uiStore.showToast(msg, 'error')"
                />
              </div>
            </div>

            <!-- Display Name -->
            <div>
              <label
                for="displayName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Display Name *
              </label>
              <input
                id="displayName"
                v-model="displayName"
                type="text"
                required
                maxlength="100"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your display name"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ displayName.length }}/100 characters
              </p>
            </div>

            <!-- Bio -->
            <div>
              <label
                for="bio"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                v-model="bio"
                rows="4"
                maxlength="500"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Tell us about yourself..."
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ bio.length }}/500 characters
              </p>
            </div>

            <!-- Avatar URL -->
            <div>
              <label
                for="avatarUrl"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Avatar URL
              </label>
              <input
                id="avatarUrl"
                v-model="avatarUrl"
                type="url"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://example.com/avatar.jpg"
              />
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Image URL for your profile picture
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="handleSave"
            :disabled="isSaving"
            class="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button
            @click="handleCancel"
            :disabled="isSaving"
            class="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Account Info -->
      <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Account Information
        </h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Username:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              @{{ authStore.user?.username }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Email:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ authStore.user?.email }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Followers:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ authStore.user?.followerCount || 0 }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Following:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ authStore.user?.followingCount || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
