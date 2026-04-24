<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postsApi } from '@/http/endpoints/posts'
import { PostCategory } from '@/typescript/types/enums'
import { useUiStore } from '@/stores/ui'
import type { Post } from '@/typescript/interface/Post'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const post = ref<Post | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)

const formData = ref({
  title: '',
  description: '',
  category: '',
  imageUrl: ''
})

async function loadPost() {
  const id = route.params.id as string
  try {
    const response = await postsApi.getById(id)
    post.value = response.data.data
    formData.value = {
      title: post.value.title,
      description: post.value.description || '',
      category: post.value.category,
      imageUrl: post.value.imageUrl || ''
    }
  } catch (error) {
    uiStore.showToast('Failed to load recipe', 'error')
    router.push('/')
  } finally {
    isLoading.value = false
  }
}

async function handleUpdate() {
  if (!post.value) return
  isSaving.value = true
  try {
    const updateData = {
      ...formData.value,
      category: PostCategory.Recipe
    }
    await postsApi.update(post.value.id, updateData as any)
    uiStore.showToast('Recipe updated successfully', 'success')
    router.push(`/recipes/${post.value.id}`)
  } catch (error) {
    uiStore.showToast('Failed to update recipe', 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(loadPost)

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage']
</script>

<template>
  <div class="recipe-edit-view min-h-screen bg-background py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <button @click="router.back()" class="mb-8 flex items-center gap-2 text-text-dim font-bold hover:text-orange transition-colors">
        <span>←</span> BACK TO RECIPE
      </button>

      <div v-if="isLoading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="post" class="bg-background-secondary rounded-[40px] border border-glass-border p-8 md:p-12 shadow-2xl">
         <h1 class="font-montserrat font-extrabold text-3xl mb-10">Edit Recipe</h1>

         <form @submit.prevent="handleUpdate" class="space-y-8">
            <div class="space-y-2">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Recipe Title</label>
               <input
                 v-model="formData.title"
                 type="text"
                 class="w-full bg-background border border-glass-border rounded-2xl px-6 py-4 focus:border-orange outline-none transition-all font-bold"
                 placeholder="Give your recipe a name"
               />
            </div>

            <div class="space-y-2">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Category</label>
               <select
                 v-model="formData.category"
                 class="w-full bg-background border border-glass-border rounded-2xl px-6 py-4 focus:border-orange outline-none transition-all font-bold appearance-none"
               >
                 <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
               </select>
            </div>

            <div class="space-y-2">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Description</label>
               <textarea
                 v-model="formData.description"
                 rows="4"
                 class="w-full bg-background border border-glass-border rounded-2xl px-6 py-4 focus:border-orange outline-none transition-all leading-relaxed"
                 placeholder="Share the story behind this dish..."
               ></textarea>
            </div>

            <div class="space-y-2">
               <label class="text-xs font-bold uppercase tracking-widest text-text-dim ml-4">Cover Image URL</label>
               <input
                 v-model="formData.imageUrl"
                 type="text"
                 class="w-full bg-background border border-glass-border rounded-2xl px-6 py-4 focus:border-orange outline-none transition-all"
                 placeholder="https://..."
               />
            </div>

            <div class="pt-6 flex gap-4">
               <button
                 type="submit"
                 :disabled="isSaving"
                 class="flex-1 btn-primary h-14 flex items-center justify-center gap-2"
               >
                 <span v-if="isSaving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                 {{ isSaving ? 'Updating...' : 'Save Changes' }}
               </button>
               <button
                 type="button"
                 @click="router.back()"
                 class="btn-secondary px-10 h-14"
               >
                 Cancel
               </button>
            </div>
         </form>
      </div>
    </div>
  </div>
</template>
