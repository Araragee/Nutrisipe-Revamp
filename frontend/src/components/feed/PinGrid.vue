<script setup lang="ts">
import { MasonryWall } from '@yeger/vue-masonry-wall'
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
  <MasonryWall
    :items="posts"
    :column-width="240"
    :gap="16"
    :ssr-columns="4"
    :rtl="false"
  >
    <template #default="{ item }">
      <PinCard
        :post="(item as Post)"
        @click="(postId) => emit('postClick', postId)"
      />
    </template>
  </MasonryWall>
</template>
