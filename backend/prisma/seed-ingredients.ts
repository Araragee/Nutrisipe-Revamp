import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface FctEntry {
  food_item: string
  alt_name?: string
  category: string
  edible_portion: number
  energy: number
  protein: number
  fat: number
  carb: number
  calcium: number
  phos: number
  iron: number
  vit_a: number
  thia: number
  ribo: number
  nia: number
  vit_c: number
}

const FCT: FctEntry[] = [
  // ── Grains & Tubers ────────────────────────────────────────
  { food_item: 'Rice, white, cooked', alt_name: 'Kanin', category: 'Grain', edible_portion: 100, energy: 130, protein: 2.7, fat: 0.3, carb: 28.2, calcium: 10, phos: 43, iron: 0.2, vit_a: 0, thia: 0.02, ribo: 0.01, nia: 0.4, vit_c: 0 },
  { food_item: 'Rice, brown, cooked', alt_name: 'Brown rice', category: 'Grain', edible_portion: 100, energy: 123, protein: 2.7, fat: 1.0, carb: 25.6, calcium: 10, phos: 83, iron: 0.5, vit_a: 0, thia: 0.18, ribo: 0.04, nia: 1.5, vit_c: 0 },
  { food_item: 'Bread, white, loaf', category: 'Grain', edible_portion: 100, energy: 265, protein: 9.0, fat: 3.2, carb: 49.0, calcium: 144, phos: 99, iron: 3.6, vit_a: 0, thia: 0.45, ribo: 0.26, nia: 4.4, vit_c: 0 },
  { food_item: 'Oats, rolled, dry', category: 'Grain', edible_portion: 100, energy: 379, protein: 13.2, fat: 6.5, carb: 67.7, calcium: 52, phos: 410, iron: 4.3, vit_a: 0, thia: 0.46, ribo: 0.16, nia: 1.5, vit_c: 0 },
  { food_item: 'Pasta, spaghetti, cooked', category: 'Grain', edible_portion: 100, energy: 158, protein: 5.8, fat: 0.9, carb: 30.9, calcium: 7, phos: 58, iron: 1.3, vit_a: 0, thia: 0.21, ribo: 0.11, nia: 1.7, vit_c: 0 },
  { food_item: 'Sweet potato, raw', alt_name: 'Kamote', category: 'Grain', edible_portion: 100, energy: 86, protein: 1.6, fat: 0.1, carb: 20.1, calcium: 30, phos: 47, iron: 0.6, vit_a: 14187, thia: 0.08, ribo: 0.06, nia: 0.6, vit_c: 2.4 },
  { food_item: 'Taro root, raw', alt_name: 'Gabi root', category: 'Grain', edible_portion: 100, energy: 112, protein: 1.5, fat: 0.2, carb: 26.5, calcium: 43, phos: 84, iron: 0.6, vit_a: 0, thia: 0.09, ribo: 0.04, nia: 0.6, vit_c: 9 },
  { food_item: 'Purple yam, raw', alt_name: 'Ube', category: 'Grain', edible_portion: 100, energy: 118, protein: 1.5, fat: 0.1, carb: 27.9, calcium: 17, phos: 55, iron: 0.5, vit_a: 5, thia: 0.09, ribo: 0.03, nia: 0.6, vit_c: 12 },
  { food_item: 'Jicama, raw', alt_name: 'Singkamas', category: 'Grain', edible_portion: 100, energy: 38, protein: 0.7, fat: 0.1, carb: 8.8, calcium: 12, phos: 18, iron: 0.6, vit_a: 0, thia: 0.02, ribo: 0.03, nia: 0.2, vit_c: 20 },

  // ── Proteins (animal) ────────────────────────────────────
  { food_item: 'Chicken breast, skinless, raw', alt_name: 'Manok dibdib', category: 'Protein', edible_portion: 100, energy: 165, protein: 31.0, fat: 3.6, carb: 0, calcium: 15, phos: 220, iron: 1.0, vit_a: 13, thia: 0.07, ribo: 0.11, nia: 13.7, vit_c: 0 },
  { food_item: 'Pork, lean, raw', alt_name: 'Baboy', category: 'Protein', edible_portion: 100, energy: 143, protein: 20.7, fat: 6.2, carb: 0, calcium: 14, phos: 200, iron: 1.0, vit_a: 7, thia: 0.86, ribo: 0.25, nia: 4.8, vit_c: 0 },
  { food_item: 'Beef, lean, raw', alt_name: 'Baka', category: 'Protein', edible_portion: 100, energy: 158, protein: 21.8, fat: 7.0, carb: 0, calcium: 12, phos: 200, iron: 2.6, vit_a: 0, thia: 0.07, ribo: 0.17, nia: 4.8, vit_c: 0 },
  { food_item: 'Egg, chicken, whole, raw', alt_name: 'Itlog', category: 'Protein', edible_portion: 88, energy: 143, protein: 12.6, fat: 9.5, carb: 0.7, calcium: 50, phos: 198, iron: 1.8, vit_a: 160, thia: 0.07, ribo: 0.48, nia: 0.1, vit_c: 0 },
  { food_item: 'Tilapia, raw', alt_name: 'Tilapia', category: 'Protein', edible_portion: 60, energy: 96, protein: 20.1, fat: 1.7, carb: 0, calcium: 10, phos: 170, iron: 0.7, vit_a: 0, thia: 0.04, ribo: 0.06, nia: 3.9, vit_c: 0 },
  { food_item: 'Bangus, milkfish, raw', alt_name: 'Bangus', category: 'Protein', edible_portion: 60, energy: 148, protein: 20.5, fat: 6.7, carb: 0, calcium: 51, phos: 162, iron: 0.3, vit_a: 30, thia: 0.01, ribo: 0.07, nia: 6.4, vit_c: 0 },
  { food_item: 'Shrimp, raw', alt_name: 'Hipon', category: 'Protein', edible_portion: 65, energy: 71, protein: 13.6, fat: 1.0, carb: 0.9, calcium: 54, phos: 244, iron: 2.4, vit_a: 0, thia: 0.02, ribo: 0.03, nia: 2.6, vit_c: 0 },
  { food_item: 'Round scad, raw', alt_name: 'Galunggong', category: 'Protein', edible_portion: 100, energy: 110, protein: 18.9, fat: 3.8, carb: 0, calcium: 32, phos: 191, iron: 1.8, vit_a: 20, thia: 0.05, ribo: 0.12, nia: 5.6, vit_c: 0 },
  { food_item: 'Anchovy, dried', alt_name: 'Dilis tuyo', category: 'Protein', edible_portion: 100, energy: 290, protein: 55.4, fat: 6.8, carb: 0, calcium: 2240, phos: 1540, iron: 9.5, vit_a: 50, thia: 0.08, ribo: 0.25, nia: 8.4, vit_c: 0 },
  { food_item: 'Mackerel, spanish, raw', alt_name: 'Tanigue', category: 'Protein', edible_portion: 100, energy: 139, protein: 19.3, fat: 6.3, carb: 0, calcium: 15, phos: 205, iron: 1.2, vit_a: 45, thia: 0.12, ribo: 0.15, nia: 8.2, vit_c: 0 },
  { food_item: 'Squid, raw', alt_name: 'Pusit', category: 'Protein', edible_portion: 100, energy: 92, protein: 15.6, fat: 1.4, carb: 3.1, calcium: 32, phos: 221, iron: 0.7, vit_a: 10, thia: 0.06, ribo: 0.22, nia: 2.2, vit_c: 4 },
  { food_item: 'Crab, mud, raw', alt_name: 'Alimango', category: 'Protein', edible_portion: 100, energy: 87, protein: 17.2, fat: 1.1, carb: 0.5, calcium: 89, phos: 190, iron: 1.5, vit_a: 25, thia: 0.08, ribo: 0.15, nia: 3.1, vit_c: 3 },

  // ── Proteins (plant) ─────────────────────────────────────
  { food_item: 'Tofu, firm', alt_name: 'Tokwa', category: 'Protein', edible_portion: 100, energy: 144, protein: 17.3, fat: 8.7, carb: 2.8, calcium: 350, phos: 190, iron: 2.7, vit_a: 0, thia: 0.16, ribo: 0.10, nia: 0.4, vit_c: 0 },
  { food_item: 'Mungbean, dry', alt_name: 'Mongo', category: 'Protein', edible_portion: 100, energy: 347, protein: 23.9, fat: 1.2, carb: 62.6, calcium: 132, phos: 367, iron: 6.7, vit_a: 6, thia: 0.62, ribo: 0.23, nia: 2.3, vit_c: 5 },
  { food_item: 'Peanut, raw', alt_name: 'Mani', category: 'Protein', edible_portion: 100, energy: 567, protein: 25.8, fat: 49.2, carb: 16.1, calcium: 92, phos: 376, iron: 4.6, vit_a: 0, thia: 0.64, ribo: 0.13, nia: 12.1, vit_c: 0 },

  // ── Vegetables & Greens ──────────────────────────────────
  { food_item: 'Kangkong, raw', alt_name: 'Water spinach', category: 'Vegetable', edible_portion: 70, energy: 19, protein: 2.6, fat: 0.2, carb: 3.1, calcium: 77, phos: 39, iron: 1.7, vit_a: 6300, thia: 0.03, ribo: 0.10, nia: 0.9, vit_c: 55 },
  { food_item: 'Malunggay leaves, raw', alt_name: 'Moringa', category: 'Vegetable', edible_portion: 50, energy: 64, protein: 9.4, fat: 1.4, carb: 8.3, calcium: 185, phos: 112, iron: 4.0, vit_a: 7560, thia: 0.26, ribo: 0.66, nia: 2.2, vit_c: 220 },
  { food_item: 'Tomato, raw', alt_name: 'Kamatis', category: 'Vegetable', edible_portion: 99, energy: 18, protein: 0.9, fat: 0.2, carb: 3.9, calcium: 10, phos: 24, iron: 0.3, vit_a: 833, thia: 0.04, ribo: 0.02, nia: 0.6, vit_c: 14 },
  { food_item: 'Onion, red, raw', alt_name: 'Sibuyas', category: 'Vegetable', edible_portion: 90, energy: 40, protein: 1.1, fat: 0.1, carb: 9.3, calcium: 23, phos: 29, iron: 0.2, vit_a: 0, thia: 0.05, ribo: 0.03, nia: 0.1, vit_c: 7 },
  { food_item: 'Garlic, raw', alt_name: 'Bawang', category: 'Vegetable', edible_portion: 87, energy: 149, protein: 6.4, fat: 0.5, carb: 33.1, calcium: 181, phos: 153, iron: 1.7, vit_a: 0, thia: 0.20, ribo: 0.11, nia: 0.7, vit_c: 31 },
  { food_item: 'Carrot, raw', alt_name: 'Karot', category: 'Vegetable', edible_portion: 90, energy: 41, protein: 0.9, fat: 0.2, carb: 9.6, calcium: 33, phos: 35, iron: 0.3, vit_a: 16700, thia: 0.07, ribo: 0.06, nia: 1.0, vit_c: 6 },
  { food_item: 'Eggplant, raw', alt_name: 'Talong', category: 'Vegetable', edible_portion: 85, energy: 25, protein: 1.0, fat: 0.2, carb: 5.9, calcium: 9, phos: 24, iron: 0.2, vit_a: 23, thia: 0.04, ribo: 0.04, nia: 0.6, vit_c: 2 },
  { food_item: 'Squash, raw', alt_name: 'Kalabasa', category: 'Vegetable', edible_portion: 76, energy: 26, protein: 1.0, fat: 0.1, carb: 6.5, calcium: 21, phos: 44, iron: 0.8, vit_a: 8500, thia: 0.05, ribo: 0.11, nia: 0.6, vit_c: 9 },
  { food_item: 'Cabbage, raw', alt_name: 'Repolyo', category: 'Vegetable', edible_portion: 80, energy: 25, protein: 1.3, fat: 0.1, carb: 5.8, calcium: 40, phos: 26, iron: 0.5, vit_a: 98, thia: 0.06, ribo: 0.04, nia: 0.2, vit_c: 36 },
  { food_item: 'Chili leaves, raw', alt_name: 'Dahon ng sili', category: 'Vegetable', edible_portion: 100, energy: 46, protein: 4.2, fat: 0.6, carb: 6.0, calcium: 350, phos: 75, iron: 6.0, vit_a: 11000, thia: 0.15, ribo: 0.40, nia: 1.4, vit_c: 125 },
  { food_item: 'Taro leaves, raw', alt_name: 'Dahon ng gabi', category: 'Vegetable', edible_portion: 100, energy: 42, protein: 5.0, fat: 0.8, carb: 6.7, calcium: 107, phos: 60, iron: 1.2, vit_a: 4800, thia: 0.08, ribo: 0.40, nia: 1.2, vit_c: 52 },
  { food_item: 'Yardlong bean, raw', alt_name: 'Sitaw', category: 'Vegetable', edible_portion: 100, energy: 47, protein: 2.8, fat: 0.4, carb: 8.0, calcium: 50, phos: 59, iron: 1.0, vit_a: 860, thia: 0.13, ribo: 0.11, nia: 1.0, vit_c: 18 },
  { food_item: 'Chayote, raw', alt_name: 'Sayote', category: 'Vegetable', edible_portion: 100, energy: 19, protein: 0.8, fat: 0.1, carb: 4.5, calcium: 17, phos: 18, iron: 0.3, vit_a: 10, thia: 0.03, ribo: 0.03, nia: 0.5, vit_c: 8 },
  { food_item: 'Bitter melon, raw', alt_name: 'Ampalaya', category: 'Vegetable', edible_portion: 100, energy: 17, protein: 1.0, fat: 0.2, carb: 3.7, calcium: 19, phos: 31, iron: 0.4, vit_a: 470, thia: 0.04, ribo: 0.04, nia: 0.4, vit_c: 84 },
  { food_item: 'Bitter melon leaves, raw', alt_name: 'Dahon ng ampalaya', category: 'Vegetable', edible_portion: 100, energy: 44, protein: 5.2, fat: 0.5, carb: 7.2, calcium: 240, phos: 83, iron: 4.8, vit_a: 7800, thia: 0.12, ribo: 0.32, nia: 1.1, vit_c: 170 },
  { food_item: 'Bottle gourd, raw', alt_name: 'Upo', category: 'Vegetable', edible_portion: 100, energy: 14, protein: 0.6, fat: 0.1, carb: 3.4, calcium: 26, phos: 13, iron: 0.2, vit_a: 0, thia: 0.03, ribo: 0.02, nia: 0.2, vit_c: 10 },
  { food_item: 'Sponge gourd, raw', alt_name: 'Patola', category: 'Vegetable', edible_portion: 100, energy: 20, protein: 0.7, fat: 0.2, carb: 4.3, calcium: 20, phos: 32, iron: 0.4, vit_a: 410, thia: 0.04, ribo: 0.04, nia: 0.4, vit_c: 12 },
  { food_item: 'Banana heart, raw', alt_name: 'Puso ng saging', category: 'Vegetable', edible_portion: 100, energy: 51, protein: 1.6, fat: 0.6, carb: 9.9, calcium: 56, phos: 73, iron: 1.7, vit_a: 50, thia: 0.05, ribo: 0.06, nia: 0.7, vit_c: 10 },
  { food_item: 'Sweet potato leaves, raw', alt_name: 'Talbos ng kamote', category: 'Vegetable', edible_portion: 100, energy: 35, protein: 2.8, fat: 0.4, carb: 6.2, calcium: 120, phos: 50, iron: 2.5, vit_a: 6200, thia: 0.10, ribo: 0.25, nia: 1.0, vit_c: 45 },
  { food_item: 'Lemongrass, raw', alt_name: 'Tanglad', category: 'Vegetable', edible_portion: 100, energy: 99, protein: 1.8, fat: 0.5, carb: 25.3, calcium: 65, phos: 101, iron: 8.2, vit_a: 6, thia: 0.07, ribo: 0.14, nia: 1.1, vit_c: 2.6 },
  { food_item: 'Pandan leaves, raw', alt_name: 'Dahon ng pandan', category: 'Vegetable', edible_portion: 100, energy: 44, protein: 1.2, fat: 0.2, carb: 9.3, calcium: 50, phos: 30, iron: 0.8, vit_a: 120, thia: 0.03, ribo: 0.04, nia: 0.5, vit_c: 5 },

  // ── Fruits ────────────────────────────────────────────────
  { food_item: 'Mango, ripe, raw', alt_name: 'Mangga', category: 'Fruit', edible_portion: 67, energy: 60, protein: 0.8, fat: 0.4, carb: 15.0, calcium: 11, phos: 14, iron: 0.2, vit_a: 1262, thia: 0.03, ribo: 0.04, nia: 0.7, vit_c: 36 },
  { food_item: 'Banana, ripe, raw', alt_name: 'Saging', category: 'Fruit', edible_portion: 65, energy: 89, protein: 1.1, fat: 0.3, carb: 22.8, calcium: 5, phos: 22, iron: 0.3, vit_a: 64, thia: 0.03, ribo: 0.07, nia: 0.7, vit_c: 9 },
  { food_item: 'Papaya, ripe, raw', alt_name: 'Papaya', category: 'Fruit', edible_portion: 75, energy: 43, protein: 0.5, fat: 0.3, carb: 10.8, calcium: 20, phos: 10, iron: 0.3, vit_a: 950, thia: 0.02, ribo: 0.03, nia: 0.4, vit_c: 60 },
  { food_item: 'Calamansi, raw', alt_name: 'Calamansi', category: 'Fruit', edible_portion: 60, energy: 37, protein: 0.9, fat: 0.4, carb: 9.3, calcium: 40, phos: 27, iron: 0.4, vit_a: 26, thia: 0.04, ribo: 0.02, nia: 0.2, vit_c: 53 },
  { food_item: 'Mango, green, raw', alt_name: 'Manggang hilaw', category: 'Fruit', edible_portion: 100, energy: 44, protein: 0.7, fat: 0.2, carb: 10.3, calcium: 12, phos: 11, iron: 0.3, vit_a: 150, thia: 0.04, ribo: 0.04, nia: 0.5, vit_c: 65 },
  { food_item: 'Coconut meat, mature', alt_name: 'Niyog', category: 'Fruit', edible_portion: 100, energy: 354, protein: 3.3, fat: 33.5, carb: 15.2, calcium: 14, phos: 113, iron: 2.4, vit_a: 0, thia: 0.06, ribo: 0.02, nia: 0.5, vit_c: 3 },
  { food_item: 'Coconut water', alt_name: 'Sabaw ng buko', category: 'Fruit', edible_portion: 100, energy: 19, protein: 0.7, fat: 0.2, carb: 3.7, calcium: 24, phos: 20, iron: 0.3, vit_a: 0, thia: 0.03, ribo: 0.06, nia: 0.1, vit_c: 2.4 },
  { food_item: 'Pineapple, raw', alt_name: 'Pinya', category: 'Fruit', edible_portion: 100, energy: 50, protein: 0.5, fat: 0.1, carb: 13.1, calcium: 13, phos: 8, iron: 0.3, vit_a: 58, thia: 0.08, ribo: 0.03, nia: 0.5, vit_c: 48 },
  { food_item: 'Tamarind, raw', alt_name: 'Sampalok', category: 'Fruit', edible_portion: 100, energy: 239, protein: 2.8, fat: 0.6, carb: 62.5, calcium: 74, phos: 113, iron: 2.8, vit_a: 30, thia: 0.43, ribo: 0.14, nia: 1.9, vit_c: 3 },

  // ── Dairy ─────────────────────────────────────────────────
  { food_item: 'Milk, cow, whole, fluid', alt_name: 'Gatas', category: 'Dairy', edible_portion: 100, energy: 61, protein: 3.2, fat: 3.3, carb: 4.8, calcium: 113, phos: 84, iron: 0.0, vit_a: 162, thia: 0.04, ribo: 0.18, nia: 0.1, vit_c: 0 },
  { food_item: 'Cheese, cheddar', alt_name: 'Keso', category: 'Dairy', edible_portion: 100, energy: 403, protein: 24.9, fat: 33.1, carb: 1.3, calcium: 721, phos: 512, iron: 0.7, vit_a: 1002, thia: 0.03, ribo: 0.38, nia: 0.1, vit_c: 0 },
  { food_item: 'Butter, salted', alt_name: 'Mantikilya', category: 'Dairy', edible_portion: 100, energy: 717, protein: 0.9, fat: 81.1, carb: 0.1, calcium: 24, phos: 24, iron: 0.0, vit_a: 2499, thia: 0.01, ribo: 0.03, nia: 0.0, vit_c: 0 },

  // ── Fats & Oils ───────────────────────────────────────────
  { food_item: 'Coconut oil', alt_name: 'Mantika ng niyog', category: 'Fat', edible_portion: 100, energy: 862, protein: 0, fat: 100, carb: 0, calcium: 0, phos: 0, iron: 0, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Olive oil', category: 'Fat', edible_portion: 100, energy: 884, protein: 0, fat: 100, carb: 0, calcium: 1, phos: 0, iron: 0.6, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },

  // ── Spices, Condiments & Liquids ──────────────────────────
  { food_item: 'Salt, iodized', alt_name: 'Asin', category: 'Spice', edible_portion: 100, energy: 0, protein: 0, fat: 0, carb: 0, calcium: 24, phos: 0, iron: 0.3, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Soy sauce', alt_name: 'Toyo', category: 'Spice', edible_portion: 100, energy: 53, protein: 8.1, fat: 0.6, carb: 4.9, calcium: 17, phos: 130, iron: 1.4, vit_a: 0, thia: 0.06, ribo: 0.15, nia: 4.0, vit_c: 0 },
  { food_item: 'Vinegar, white', alt_name: 'Suka', category: 'Spice', edible_portion: 100, energy: 18, protein: 0, fat: 0, carb: 0.9, calcium: 6, phos: 4, iron: 0.0, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Ginger, raw', alt_name: 'Luya', category: 'Spice', edible_portion: 90, energy: 80, protein: 1.8, fat: 0.8, carb: 17.8, calcium: 16, phos: 34, iron: 0.6, vit_a: 0, thia: 0.03, ribo: 0.03, nia: 0.8, vit_c: 5 },
  { food_item: 'Coconut milk, thick', alt_name: 'Kakang gata', category: 'Spice', edible_portion: 100, energy: 230, protein: 2.3, fat: 23.8, carb: 5.5, calcium: 16, phos: 100, iron: 1.6, vit_a: 0, thia: 0.03, ribo: 0.02, nia: 0.8, vit_c: 1 },
  { food_item: 'Fish sauce', alt_name: 'Patis', category: 'Spice', edible_portion: 100, energy: 35, protein: 5.0, fat: 0.1, carb: 3.6, calcium: 43, phos: 36, iron: 1.2, vit_a: 0, thia: 0.01, ribo: 0.02, nia: 0.5, vit_c: 0 },
  { food_item: 'Shrimp paste', alt_name: 'Bagoong alamang', category: 'Spice', edible_portion: 100, energy: 85, protein: 11.2, fat: 1.5, carb: 6.8, calcium: 1120, phos: 780, iron: 5.4, vit_a: 30, thia: 0.02, ribo: 0.12, nia: 1.5, vit_c: 0 },
  { food_item: 'Palm vinegar', alt_name: 'Sukang tuba', category: 'Spice', edible_portion: 100, energy: 12, protein: 0.1, fat: 0, carb: 0.5, calcium: 8, phos: 5, iron: 0.1, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
]

async function main() {
  console.log(`🌱 Seeding ${FCT.length} ingredients from Philippine FCT…`)

  for (const item of FCT) {
    const existing = await prisma.ingredient.findFirst({
      where: { food_item: item.food_item },
    })
    if (existing) {
      await prisma.ingredient.update({
        where: { id: existing.id },
        data: { ...item, source: 'FNRI FCT' },
      })
    } else {
      await prisma.ingredient.create({
        data: { ...item, source: 'FNRI FCT' },
      })
    }
  }

  const total = await prisma.ingredient.count()
  console.log(`✅ Done. Ingredients in DB: ${total}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
