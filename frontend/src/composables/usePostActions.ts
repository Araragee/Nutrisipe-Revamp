import { ref } from 'vue'
import type { Ref } from 'vue'
import { socialApi } from '@/http/endpoints/social'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { ogShareUrl } from '@/utils/imageUrl'
import type { Post } from '@/typescript/interface/Post'

export function usePostActions(post: Ref<Post | null>) {
  const authStore = useAuthStore()
  const toast = useToast()
  const showCopyToast = ref(false)

  async function toggleLike() {
    if (!post.value) return
    if (!authStore.isAuthenticated) {
      toast.info('Please sign in to like')
      return
    }
    const currentPost = post.value
    const wasLiked = currentPost.isLiked
    
    // Optimistic update
    currentPost.isLiked = !wasLiked
    currentPost.likeCount += wasLiked ? -1 : 1
    
    try {
      if (wasLiked) {
        await socialApi.unlikePost(currentPost.id)
      } else {
        await socialApi.likePost(currentPost.id)
      }
    } catch (error) {
      // Revert on error
      currentPost.isLiked = wasLiked
      currentPost.likeCount += wasLiked ? 1 : -1
    }
  }

  async function toggleSave() {
    if (!post.value) return
    if (!authStore.isAuthenticated) {
      toast.info('Please sign in to save')
      return
    }
    const currentPost = post.value
    const wasSaved = currentPost.isSaved
    
    // Optimistic update
    currentPost.isSaved = !wasSaved
    currentPost.saveCount += wasSaved ? -1 : 1
    
    try {
      if (wasSaved) {
        await socialApi.unsavePost(currentPost.id)
      } else {
        await socialApi.savePost(currentPost.id)
      }
    } catch (error) {
      // Revert on error
      currentPost.isSaved = wasSaved
      currentPost.saveCount += wasSaved ? 1 : -1
    }
  }

  async function sharePost() {
    if (!post.value) return
    const url = ogShareUrl(post.value.id)
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.value.title,
          text: post.value.description || '',
          url: url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
        showCopyToast.value = true
        setTimeout(() => {
          showCopyToast.value = false
        }, 2200)
      }
    } catch (error) {
      // ignore
    }
  }

  return {
    toggleLike,
    toggleSave,
    sharePost,
    showCopyToast,
  }
}
