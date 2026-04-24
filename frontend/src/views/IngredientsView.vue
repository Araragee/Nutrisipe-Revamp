<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ingredientsApi } from '@/http/endpoints/ingredients'
import { useUiStore } from '@/stores/ui'
import type { Ingredient } from '@/typescript/interface/Ingredient'

const uiStore = useUiStore()
const ingredients = ref<Ingredient[]>([])
const loading = ref(true)
const searchQuery = ref('')
const showModal = ref(false)
const editingIngredient = ref<Ingredient | null>(null)

const formData = ref({
  food_item: '',
  alt_name: '',
  edible_portion: 100,
  energy: 0,
  protein: 0,
  fat: 0,
  carb: 0,
  calcium: 0,
  phos: 0,
  iron: 0,
  vit_a: 0,
  thia: 0,
  ribo: 0,
  nia: 0,
  vit_c: 0,
})

const loadIngredients = async () => {
  loading.value = true
  try {
    const params = searchQuery.value ? { search: searchQuery.value } : {}
    const response = await ingredientsApi.getAll(params)
    ingredients.value = response.data.data
  } catch (error) {
    console.error('Failed to load ingredients:', error)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingIngredient.value = null
  formData.value = {
    food_item: '', alt_name: '', edible_portion: 100,
    energy: 0, protein: 0, fat: 0, carb: 0, calcium: 0,
    phos: 0, iron: 0, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0,
  }
  showModal.value = true
}

const openEditModal = (ingredient: Ingredient) => {
  editingIngredient.value = ingredient
  formData.value = { ...ingredient, alt_name: ingredient.alt_name || '' }
  showModal.value = true
}

const saveIngredient = async () => {
  try {
    if (editingIngredient.value) {
      await ingredientsApi.update(editingIngredient.value.id, formData.value)
      uiStore.showToast('Ingredient updated', 'success')
    } else {
      await ingredientsApi.create(formData.value)
      uiStore.showToast('Ingredient created', 'success')
    }
    showModal.value = false
    await loadIngredients()
  } catch (error) {
    uiStore.showToast('Failed to save ingredient', 'error')
  }
}

const deleteIngredient = async (id: string) => {
  if (!confirm('Are you sure?')) return
  try {
    await ingredientsApi.delete(id)
    uiStore.showToast('Ingredient deleted', 'success')
    await loadIngredients()
  } catch (error) {
    uiStore.showToast('Failed to delete ingredient', 'error')
  }
}

onMounted(loadIngredients)
</script>

<template>
  <div class="ingredients-view min-h-screen bg-background py-16 px-6 md:px-12">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 class="font-montserrat font-extrabold text-4xl tracking-tight mb-2">Food Database</h1>
          <p class="text-text-dim font-bold uppercase tracking-widest text-xs">Manage Philippine Food Composition</p>
        </div>
        <button @click="openCreateModal" class="btn-primary py-4 px-8 self-start">
          Add New Item
        </button>
      </div>

      <div class="relative mb-10">
        <span class="absolute left-6 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        <input
          v-model="searchQuery"
          @input="loadIngredients"
          type="text"
          placeholder="Search items by name or category..."
          class="w-full bg-background-secondary border border-glass-border rounded-3xl py-5 pl-16 pr-6 focus:border-orange outline-none transition-all font-medium text-lg"
        />
      </div>

      <div v-if="loading" class="flex justify-center py-20">
         <div class="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else class="bg-background-secondary rounded-[40px] border border-glass-border overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-black/20 text-text-dim text-[10px] font-bold uppercase tracking-[0.2em]">
                <th class="px-8 py-6 text-left">Food Item</th>
                <th class="px-6 py-6 text-left">Edible %</th>
                <th class="px-6 py-6 text-left">Energy</th>
                <th class="px-6 py-6 text-left">Protein</th>
                <th class="px-6 py-6 text-left">Fat</th>
                <th class="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-glass-border">
              <tr v-for="item in ingredients" :key="item.id" class="hover:bg-white/5 transition-colors group">
                <td class="px-8 py-6">
                   <div class="font-bold text-base">{{ item.food_item }}</div>
                   <div class="text-xs text-text-muted">{{ item.alt_name || '-' }}</div>
                </td>
                <td class="px-6 py-6 font-mono text-sm">{{ item.edible_portion }}%</td>
                <td class="px-6 py-6">
                   <span class="px-3 py-1 rounded-full bg-orange/10 text-orange font-bold text-xs">{{ item.energy }} kcal</span>
                </td>
                <td class="px-6 py-6 text-sm font-medium">{{ item.protein }}g</td>
                <td class="px-6 py-6 text-sm font-medium">{{ item.fat }}g</td>
                <td class="px-8 py-6 text-right">
                  <div class="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="openEditModal(item)" class="p-2 hover:text-orange">✏️</button>
                    <button @click="deleteIngredient(item.id)" class="p-2 hover:text-red-500">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="ingredients.length === 0" class="py-20 text-center">
           <p class="text-text-dim font-bold uppercase tracking-widest">No items found</p>
        </div>
      </div>
    </div>

    <!-- Modal (Simple version for now) -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
       <div class="absolute inset-0 bg-background/80 backdrop-blur-md" @click="showModal = false"></div>
       <div class="relative w-full max-w-2xl bg-background-secondary border border-glass-border rounded-[40px] p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-y-auto">
          <h2 class="font-montserrat font-extrabold text-2xl mb-8">{{ editingIngredient ? 'Edit' : 'Add' }} Food Item</h2>

          <form @submit.prevent="saveIngredient" class="space-y-6">
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                   <label class="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-2">Name</label>
                   <input v-model="formData.food_item" type="text" class="w-full bg-background border border-glass-border rounded-2xl px-5 py-3 outline-none focus:border-orange" />
                </div>
                <div class="space-y-1">
                   <label class="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-2">Alt Name</label>
                   <input v-model="formData.alt_name" type="text" class="w-full bg-background border border-glass-border rounded-2xl px-5 py-3 outline-none focus:border-orange" />
                </div>
             </div>

             <div class="grid grid-cols-3 gap-6">
                <div v-for="field in ['energy', 'protein', 'fat', 'carb', 'calcium', 'iron']" :key="field" class="space-y-1">
                   <label class="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-2">{{ field }}</label>
                   <input v-model.number="(formData as any)[field]" type="number" step="0.1" class="w-full bg-background border border-glass-border rounded-2xl px-5 py-3 outline-none focus:border-orange" />
                </div>
             </div>

             <div class="pt-6 flex gap-4">
                <button type="submit" class="flex-1 btn-primary py-4">Save Item</button>
                <button type="button" @click="showModal = false" class="btn-secondary px-8">Cancel</button>
             </div>
          </form>
       </div>
    </div>
  </div>
</template>
