<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
  mobileMenuOpen.value = false
}
</script>

<template>
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 bg-primary-base rounded-lg">
              <span class="text-white font-bold text-xl">N</span>
            </div>
            <span class="text-xl font-bold text-gray-900 hidden sm:block">Nutrisipe</span>
          </router-link>

          <div class="hidden md:flex items-center ml-10 space-x-4">
            <router-link
              to="/"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-base transition-colors"
            >
              Home
            </router-link>
            <router-link
              to="/recipes"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-base transition-colors"
            >
              Recipes
            </router-link>
            <router-link
              v-if="authStore.isAuthenticated"
              to="/following"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-base transition-colors"
            >
              Following
            </router-link>
            <router-link
              v-if="authStore.isAuthenticated"
              to="/saved"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-base transition-colors"
            >
              Saved
            </router-link>
            <router-link
              v-if="authStore.isAdmin"
              to="/ingredients"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-base transition-colors"
            >
              Ingredients
            </router-link>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="authStore.isAuthenticated">
            <router-link
              to="/recipes/create"
              class="hidden md:block px-4 py-2 bg-primary-base text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Recipe
            </router-link>

            <div class="hidden md:flex items-center gap-3">
              <router-link
                v-if="authStore.user"
                :to="`/users/${authStore.user.id}`"
                class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img
                  v-if="authStore.user.avatarUrl"
                  :src="authStore.user.avatarUrl"
                  :alt="authStore.user.displayName"
                  class="w-8 h-8 rounded-full object-cover"
                />
                <div v-else class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span class="text-sm font-bold text-primary-700">{{ authStore.user.displayName.charAt(0) }}</span>
                </div>
                <span class="text-sm font-medium text-gray-700">{{ authStore.user.displayName }}</span>
              </router-link>

              <button
                @click="handleLogout"
                class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </template>

          <router-link
            v-else
            to="/login"
            class="hidden md:block px-4 py-2 bg-primary-base text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign In
          </router-link>

          <button
            @click="toggleMobileMenu"
            class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-200">
      <div class="px-4 py-3 space-y-2">
        <router-link
          to="/"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
        >
          Home
        </router-link>
        <router-link
          to="/recipes"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
        >
          Recipes
        </router-link>

        <template v-if="authStore.isAuthenticated">
          <router-link
            to="/following"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            Following
          </router-link>
          <router-link
            to="/saved"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            Saved
          </router-link>
          <router-link
            v-if="authStore.isAdmin"
            to="/ingredients"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            Ingredients
          </router-link>
          <router-link
            to="/recipes/create"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            Create Recipe
          </router-link>
          <router-link
            v-if="authStore.user"
            :to="`/users/${authStore.user.id}`"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            Profile
          </router-link>
          <button
            @click="handleLogout"
            class="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </template>

        <router-link
          v-else
          to="/login"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
        >
          Sign In
        </router-link>
      </div>
    </div>
  </nav>
</template>
