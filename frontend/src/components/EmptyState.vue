<script setup lang="ts">
interface Props {
  title: string
  message?: string
  actionText?: string
  actionRoute?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  actionText: '',
  actionRoute: '',
})
</script>

<template>
  <div class="text-center py-12 bg-white rounded-xl shadow-sm">
    <p class="text-gray-600 text-lg">{{ title }}</p>
    <p v-if="message" class="text-gray-500 mt-2">{{ message }}</p>
    <router-link
      v-if="actionText && actionRoute"
      :to="actionRoute"
      class="inline-block mt-4 px-6 py-2 bg-primary-base text-white rounded-lg hover:bg-primary-700 transition-colors"
    >
      {{ actionText }}
    </router-link>
  </div>
</template>
