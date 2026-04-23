<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { recipesApi, ingredientsApi } from "@/api";
import type {
  Ingredient,
  RecipeCategory,
  RecipeIngredientInput,
} from "@/types";

const router = useRouter();

const title = ref("");
const description = ref("");
const category = ref<RecipeCategory>("Breakfast");
const yieldAmount = ref("1");
const image = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const procedure = ref<string[]>([""]);
const ingredients = ref<RecipeIngredientInput[]>([]);

const categories: RecipeCategory[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
  "Beverage",
];

const searchQuery = ref("");
const searchResults = ref<Ingredient[]>([]);
const searching = ref(false);
const submitting = ref(false);
const error = ref("");

const searchIngredients = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  searching.value = true;
  try {
    const response = await ingredientsApi.getIngredients({
      search: searchQuery.value,
      all: true,
    });
    searchResults.value = Array.isArray(response.data)
      ? response.data
      : response.data.data;
  } catch (err) {
    console.error("Failed to search ingredients:", err);
  } finally {
    searching.value = false;
  }
};

const addIngredient = (ingredient: Ingredient) => {
  ingredients.value.push({
    ingredient_id: ingredient.id,
    name: ingredient.food_item,
    amount: 100,
    is_custom: false,
  });
  searchQuery.value = "";
  searchResults.value = [];
};

const addCustomIngredient = () => {
  if (!searchQuery.value.trim()) return;

  ingredients.value.push({
    ingredient_id: null,
    name: searchQuery.value,
    amount: 100,
    is_custom: true,
  });
  searchQuery.value = "";
  searchResults.value = [];
};

const removeIngredient = (index: number) => {
  ingredients.value.splice(index, 1);
};

const addProcedureStep = () => {
  procedure.value.push("");
};

const removeProcedureStep = (index: number) => {
  procedure.value.splice(index, 1);
};

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    image.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const validateForm = (): boolean => {
  if (!title.value.trim()) {
    error.value = "Please enter a recipe title";
    return false;
  }
  if (!description.value.trim()) {
    error.value = "Please enter a description";
    return false;
  }
  if (!image.value) {
    error.value = "Please upload an image";
    return false;
  }
  if (ingredients.value.length === 0) {
    error.value = "Please add at least one ingredient";
    return false;
  }
  if (procedure.value.filter((step) => step.trim()).length === 0) {
    error.value = "Please add at least one instruction step";
    return false;
  }
  if (!yieldAmount.value || Number(yieldAmount.value) < 1) {
    error.value = "Please enter a valid serving size";
    return false;
  }

  return true;
};

const submitRecipe = async () => {
  error.value = "";

  if (!validateForm()) return;

  submitting.value = true;
  try {
    const response = await recipesApi.createRecipe({
      title: title.value,
      description: description.value,
      category: category.value,
      image: image.value!,
      procedure: procedure.value.filter((step) => step.trim()),
      ingredients: ingredients.value,
      yield_amount: yieldAmount.value,
    });

    router.push(`/recipes/${response.data.data.id}`);
  } catch (err: any) {
    error.value = err.response?.data?.message || "Failed to create recipe";
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 z-[99999]">
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h1 class="text-heading-2 font-bold text-gray-900 mb-6">
        Create New Recipe
      </h1>

      <div
        v-if="error"
        class="mb-6 p-4 bg-error-100 border border-error-base rounded-lg"
      >
        <p class="text-error-base">{{ error }}</p>
      </div>

      <form @submit.prevent="submitRecipe" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Title</label
          >
          <input
            v-model="title"
            type="text"
            placeholder="Enter recipe title"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Description</label
          >
          <textarea
            v-model="description"
            rows="3"
            placeholder="Describe your recipe"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Category</label
            >
            <select
              v-model="category"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Servings</label
            >
            <input
              v-model="yieldAmount"
              type="number"
              min="1"
              placeholder="Number of servings"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Recipe Image</label
          >
          <div v-if="imagePreview" class="mb-4">
            <img
              :src="imagePreview"
              alt="Preview"
              class="w-full max-w-md h-64 object-cover rounded-lg"
            />
          </div>
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Ingredients</label
          >
          <div class="mb-4">
            <div class="flex gap-2">
              <input
                v-model="searchQuery"
                @input="searchIngredients"
                type="text"
                placeholder="Search ingredients from database..."
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent"
              />
              <button
                type="button"
                @click="addCustomIngredient"
                class="px-4 py-2 border border-primary-base text-primary-base rounded-lg hover:bg-primary-50 transition-colors"
              >
                Add Custom
              </button>
            </div>

            <div
              v-if="searchResults.length > 0"
              class="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto"
            >
              <button
                v-for="ingredient in searchResults"
                :key="ingredient.id"
                type="button"
                @click="addIngredient(ingredient)"
                class="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors border-b last:border-0"
              >
                <span class="font-medium">{{ ingredient.food_item }}</span>
                <span
                  v-if="ingredient.alt_name"
                  class="text-sm text-gray-500 ml-2"
                  >({{ ingredient.alt_name }})</span
                >
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="(ingredient, index) in ingredients"
              :key="index"
              class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex-1">
                <span class="font-medium">{{ ingredient.name }}</span>
                <span
                  v-if="ingredient.is_custom"
                  class="text-xs text-gray-500 ml-2"
                  >(custom - no nutrition data)</span
                >
              </div>
              <input
                v-model.number="ingredient.amount"
                type="number"
                min="1"
                class="w-24 px-2 py-1 border border-gray-300 rounded"
              />
              <span class="text-sm text-gray-600">grams</span>
              <button
                type="button"
                @click="removeIngredient(index)"
                class="text-error-base hover:text-error-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Instructions</label
          >
          <div class="space-y-3">
            <div
              v-for="(step, index) in procedure"
              :key="index"
              class="flex gap-2"
            >
              <span
                class="flex-shrink-0 w-8 h-8 bg-primary-base text-white rounded-full flex items-center justify-center font-semibold text-sm"
              >
                {{ index + 1 }}
              </span>
              <textarea
                v-model="procedure[index]"
                rows="2"
                placeholder="Enter instruction step"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-base focus:border-transparent resize-none"
              ></textarea>
              <button
                v-if="procedure.length > 1"
                type="button"
                @click="removeProcedureStep(index)"
                class="text-error-base hover:text-error-700"
              >
                Remove
              </button>
            </div>
          </div>
          <button
            type="button"
            @click="addProcedureStep"
            class="mt-3 px-4 py-2 border border-primary-base text-primary-base rounded-lg hover:bg-primary-50 transition-colors"
          >
            Add Step
          </button>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            :disabled="submitting"
            class="flex-1 px-6 py-3 bg-primary-base text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {{ submitting ? "Creating Recipe..." : "Create Recipe" }}
          </button>
          <button
            type="button"
            @click="router.push('/')"
            class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
