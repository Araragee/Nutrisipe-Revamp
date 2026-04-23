<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ingredientsApi } from '@/api'
import type { Ingredient } from '@/types'

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
    const response = await ingredientsApi.getIngredients(params)
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
  }
  showModal.value = true
}

const openEditModal = (ingredient: Ingredient) => {
  editingIngredient.value = ingredient
  formData.value = { ...ingredient, alt_name: ingredient.alt_name || '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingIngredient.value = null
}

const saveIngredient = async () => {
  try {
    if (editingIngredient.value) {
      await ingredientsApi.updateIngredient(editingIngredient.value.id, formData.value)
    } else {
      await ingredientsApi.createIngredient(formData.value as Omit<Ingredient, 'id'>)
    }
    closeModal()
    await loadIngredients()
  } catch (error) {
    console.error('Failed to save ingredient:', error)
    alert('Failed to save ingredient')
  }
}

const deleteIngredient = async (id: number) => {
  if (!confirm('Are you sure you want to delete this ingredient?')) return

  try {
    await ingredientsApi.deleteIngredient(id)
    await loadIngredients()
  } catch (error) {
    console.error('Failed to delete ingredient:', error)
    alert('Failed to delete ingredient')
  }
}

onMounted(() => {
  loadIngredients()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-heading-2 font-bold text-gray-900 mb-2">Ingredients Management</h1>
        <p class="text-gray-600">Manage Philippine Food Composition Table data</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-6 py-2 bg-primary-base text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Add Ingredient
      </button>
    </div>

    <div class="mb-6">
      <input
        v-model="searchQuery"
        @input="loadIngredients"
        type="text"
        placeholder="Search ingredients..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
      />
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-base"></div>
      <p class="text-gray-600 mt-4">Loading ingredients...</p>
    </div>

    <div v-else class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Food Item</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Alt Name</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Edible %</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Energy</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Protein</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="ingredient in ingredients" :key="ingredient.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900">{{ ingredient.food_item }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ ingredient.alt_name || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ ingredient.edible_portion }}%</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ ingredient.energy }} kcal</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ ingredient.protein }}g</td>
              <td class="px-4 py-3 text-sm">
                <div class="flex gap-2">
                  <button
                    @click="openEditModal(ingredient)"
                    class="text-primary-base hover:text-primary-700"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteIngredient(ingredient.id)"
                    class="text-error-base hover:text-error-700"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h2 class="text-heading-3 font-bold text-gray-900 mb-4">
            {{ editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient' }}
          </h2>

          <form @submit.prevent="saveIngredient" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Food Item</label>
                <input
                  v-model="formData.food_item"
                  required
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Alternative Name</label>
                <input
                  v-model="formData.alt_name"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Edible Portion (%)</label>
              <input
                v-model.number="formData.edible_portion"
                required
                type="number"
                min="0"
                max="100"
                step="0.1"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
              />
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Energy (kcal)</label>
                <input
                  v-model.number="formData.energy"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                <input
                  v-model.number="formData.protein"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                <input
                  v-model.number="formData.fat"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                <input
                  v-model.number="formData.carb"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Calcium (mg)</label>
                <input
                  v-model.number="formData.calcium"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phosphorus (mg)</label>
                <input
                  v-model.number="formData.phos"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Iron (mg)</label>
                <input
                  v-model.number="formData.iron"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Vitamin A (μg)</label>
                <input
                  v-model.number="formData.vit_a"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Thiamin (mg)</label>
                <input
                  v-model.number="formData.thia"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Riboflavin (mg)</label>
                <input
                  v-model.number="formData.ribo"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Niacin (mg)</label>
                <input
                  v-model.number="formData.nia"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Vitamin C (mg)</label>
                <input
                  v-model.number="formData.vit_c"
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                class="flex-1 px-6 py-2 bg-primary-base text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {{ editingIngredient ? 'Update' : 'Create' }}
              </button>
              <button
                type="button"
                @click="closeModal"
                class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
