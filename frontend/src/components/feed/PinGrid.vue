<script setup lang="ts">
import PinCard from './PinCard.vue'
import type { Post } from '@/typescript/interface/Post'

interface Props {
  posts: Post[]
}

defineProps<Props>()

const emit = defineEmits<{
  postClick: [postId: string]
}>()
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    <PinCard
      v-for="post in posts"
      :key="post.id"
      :post="post"
      @click="(postId) => emit('postClick', postId)"
    />
  </div>
</template>
