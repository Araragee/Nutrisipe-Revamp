<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api'
import type { User, Recipe } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const user = ref<User | null>(null)
const recipes = ref<Recipe[]>([])
const savedRecipes = ref<Recipe[]>([])
const followers = ref<User[]>([])
const following = ref<User[]>([])
const activeTab = ref<'recipes' | 'saved' | 'followers' | 'following'>('recipes')
const isFollowing = ref(false)
const loading = ref(true)

const userId = computed(() => Number(route.params.id))
const isOwnProfile = computed(() => authStore.user?.id === userId.value)

const loadProfile = async () => {
  loading.value = true
  try {
    const [userRes, recipesRes] = await Promise.all([
      usersApi.getUser(userId.value),
      usersApi.getUserRecipes(userId.value),
    ])

    user.value = userRes.data.data
    recipes.value = recipesRes.data.data

    if (authStore.isAuthenticated && !isOwnProfile.value) {
      const followStatus = await usersApi.isFollowing(userId.value)
      isFollowing.value = followStatus.data.is_following
    }
  } catch (error) {
    console.error('Failed to load profile:', error)
  } finally {
    loading.value = false
  }
}

const loadSavedRecipes = async () => {
  try {
    const response = await usersApi.getUserSavedRecipes(userId.value)
    savedRecipes.value = response.data.data
  } catch (error) {
    console.error('Failed to load saved recipes:', error)
  }
}

const loadFollowers = async () => {
  try {
    const response = await usersApi.getFollowers(userId.value)
    followers.value = response.data.data
  } catch (error) {
    console.error('Failed to load followers:', error)
  }
}

const loadFollowing = async () => {
  try {
    const response = await usersApi.getFollowing(userId.value)
    following.value = response.data.data
  } catch (error) {
    console.error('Failed to load following:', error)
  }
}

const toggleFollow = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    if (isFollowing.value) {
      await usersApi.unfollowUser(userId.value)
    } else {
      await usersApi.followUser(userId.value)
    }
    isFollowing.value = !isFollowing.value
    await loadProfile()
  } catch (error) {
    console.error('Failed to toggle follow:', error)
  }
}

const changeTab = async (tab: typeof activeTab.value) => {
  activeTab.value = tab

  if (tab === 'saved' && savedRecipes.value.length === 0) {
    await loadSavedRecipes()
  } else if (tab === 'followers' && followers.value.length === 0) {
    await loadFollowers()
  } else if (tab === 'following' && following.value.length === 0) {
    await loadFollowing()
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-base"></div>
      <p class="text-gray-600 mt-4">Loading profile...</p>
    </div>

    <div v-else-if="user">
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div class="flex items-start gap-6">
          <div class="flex-shrink-0">
            <img
              v-if="user.image"
              :src="user.image"
              :alt="user.name"
              class="w-24 h-24 rounded-full object-cover"
            />
            <div v-else class="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-3xl font-bold text-primary-700">{{ user.name.charAt(0) }}</span>
            </div>
          </div>

          <div class="flex-1">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h1 class="text-heading-2 font-bold text-gray-900">{{ user.name }}</h1>
                <p class="text-gray-600">{{ user.email }}</p>
                <span v-if="user.is_admin" class="inline-block px-3 py-1 bg-secondary-100 text-secondary-700 text-sm font-medium rounded-full mt-2">
                  Admin
                </span>
              </div>

              <button
                v-if="!isOwnProfile && authStore.isAuthenticated"
                @click="toggleFollow"
                :class="[
                  'px-6 py-2 rounded-lg font-medium transition-colors',
                  isFollowing
                    ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'bg-primary-base text-white hover:bg-primary-700'
                ]"
              >
                {{ isFollowing ? 'Following' : 'Follow' }}
              </button>
            </div>

            <div class="flex gap-6 text-sm">
              <div>
                <span class="font-semibold text-gray-900">{{ user.recipes_count || 0 }}</span>
                <span class="text-gray-600"> recipes</span>
              </div>
              <div>
                <span class="font-semibold text-gray-900">{{ user.followers_count || 0 }}</span>
                <span class="text-gray-600"> followers</span>
              </div>
              <div>
                <span class="font-semibold text-gray-900">{{ user.following_count || 0 }}</span>
                <span class="text-gray-600"> following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="border-b border-gray-200">
          <div class="flex">
            <button
              @click="changeTab('recipes')"
              :class="[
                'flex-1 px-6 py-4 font-medium transition-colors',
                activeTab === 'recipes'
                  ? 'border-b-2 border-primary-base text-primary-base'
                  : 'text-gray-600 hover:text-gray-900'
              ]"
            >
              Recipes
            </button>
            <button
              v-if="isOwnProfile"
              @click="changeTab('saved')"
              :class="[
                'flex-1 px-6 py-4 font-medium transition-colors',
                activeTab === 'saved'
                  ? 'border-b-2 border-primary-base text-primary-base'
                  : 'text-gray-600 hover:text-gray-900'
              ]"
            >
              Saved
            </button>
            <button
              @click="changeTab('followers')"
              :class="[
                'flex-1 px-6 py-4 font-medium transition-colors',
                activeTab === 'followers'
                  ? 'border-b-2 border-primary-base text-primary-base'
                  : 'text-gray-600 hover:text-gray-900'
              ]"
            >
              Followers
            </button>
            <button
              @click="changeTab('following')"
              :class="[
                'flex-1 px-6 py-4 font-medium transition-colors',
                activeTab === 'following'
                  ? 'border-b-2 border-primary-base text-primary-base'
                  : 'text-gray-600 hover:text-gray-900'
              ]"
            >
              Following
            </button>
          </div>
        </div>

        <div class="p-6">
          <div v-if="activeTab === 'recipes'">
            <div v-if="recipes.length === 0" class="text-center py-12">
              <p class="text-gray-600">No recipes yet</p>
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="recipe in recipes"
                :key="recipe.id"
                @click="router.push(`/recipes/${recipe.id}`)"
                class="cursor-pointer hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-200"
              >
                <div class="aspect-video bg-gray-200">
                  <img
                    v-if="recipe.image"
                    :src="`http://localhost:8000/storage/${recipe.image}`"
                    :alt="recipe.title"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="p-4">
                  <h3 class="font-semibold text-gray-900 line-clamp-1">{{ recipe.title }}</h3>
                  <p class="text-sm text-gray-600 line-clamp-1 mt-1">{{ recipe.description }}</p>
                  <div class="flex items-center justify-between text-sm text-gray-500 mt-2">
                    <span>{{ recipe.category }}</span>
                    <div class="flex gap-2">
                      <span>❤️ {{ recipe.saved_by_count }}</span>
                      <span>💬 {{ recipe.comments_count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'saved'">
            <div v-if="savedRecipes.length === 0" class="text-center py-12">
              <p class="text-gray-600">No saved recipes yet</p>
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="recipe in savedRecipes"
                :key="recipe.id"
                @click="router.push(`/recipes/${recipe.id}`)"
                class="cursor-pointer hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-200"
              >
                <div class="aspect-video bg-gray-200">
                  <img
                    v-if="recipe.image"
                    :src="`http://localhost:8000/storage/${recipe.image}`"
                    :alt="recipe.title"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="p-4">
                  <h3 class="font-semibold text-gray-900 line-clamp-1">{{ recipe.title }}</h3>
                  <p class="text-sm text-gray-600 line-clamp-1 mt-1">{{ recipe.user.name }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'followers'">
            <div v-if="followers.length === 0" class="text-center py-12">
              <p class="text-gray-600">No followers yet</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="follower in followers"
                :key="follower.id"
                @click="router.push(`/users/${follower.id}`)"
                class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <img
                  v-if="follower.image"
                  :src="follower.image"
                  :alt="follower.name"
                  class="w-12 h-12 rounded-full object-cover"
                />
                <div v-else class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span class="text-lg font-bold text-primary-700">{{ follower.name.charAt(0) }}</span>
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ follower.name }}</p>
                  <p class="text-sm text-gray-600">{{ follower.email }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'following'">
            <div v-if="following.length === 0" class="text-center py-12">
              <p class="text-gray-600">Not following anyone yet</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="user in following"
                :key="user.id"
                @click="router.push(`/users/${user.id}`)"
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
                <div>
                  <p class="font-medium text-gray-900">{{ user.name }}</p>
                  <p class="text-sm text-gray-600">{{ user.email }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
