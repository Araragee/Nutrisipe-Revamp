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
  { food_item: 'Rice, glutinous, raw', alt_name: 'Malagkit', category: 'Grain', edible_portion: 100, energy: 360, protein: 6.7, fat: 0.9, carb: 79.0, calcium: 6, phos: 98, iron: 0.5, vit_a: 0, thia: 0.07, ribo: 0.02, nia: 1.6, vit_c: 0 },
  { food_item: 'Bread, white, loaf', category: 'Grain', edible_portion: 100, energy: 265, protein: 9.0, fat: 3.2, carb: 49.0, calcium: 144, phos: 99, iron: 3.6, vit_a: 0, thia: 0.45, ribo: 0.26, nia: 4.4, vit_c: 0 },
  { food_item: 'Oats, rolled, dry', category: 'Grain', edible_portion: 100, energy: 379, protein: 13.2, fat: 6.5, carb: 67.7, calcium: 52, phos: 410, iron: 4.3, vit_a: 0, thia: 0.46, ribo: 0.16, nia: 1.5, vit_c: 0 },
  { food_item: 'Pasta, spaghetti, cooked', category: 'Grain', edible_portion: 100, energy: 158, protein: 5.8, fat: 0.9, carb: 30.9, calcium: 7, phos: 58, iron: 1.3, vit_a: 0, thia: 0.21, ribo: 0.11, nia: 1.7, vit_c: 0 },
  { food_item: 'Rice noodles, dry', alt_name: 'Bihon', category: 'Grain', edible_portion: 100, energy: 364, protein: 0.9, fat: 0.6, carb: 87.0, calcium: 4, phos: 3, iron: 0.7, vit_a: 0, thia: 0.0, ribo: 0.0, nia: 0.2, vit_c: 0 },
  { food_item: 'Corn, yellow, fresh, raw', alt_name: 'Mais', category: 'Grain', edible_portion: 100, energy: 86, protein: 3.2, fat: 1.2, carb: 19.0, calcium: 2, phos: 89, iron: 0.5, vit_a: 187, thia: 0.16, ribo: 0.06, nia: 1.8, vit_c: 7 },
  { food_item: 'Sweet potato, raw', alt_name: 'Kamote', category: 'Grain', edible_portion: 100, energy: 86, protein: 1.6, fat: 0.1, carb: 20.1, calcium: 30, phos: 47, iron: 0.6, vit_a: 14187, thia: 0.08, ribo: 0.06, nia: 0.6, vit_c: 2.4 },
  { food_item: 'Taro root, raw', alt_name: 'Gabi root', category: 'Grain', edible_portion: 100, energy: 112, protein: 1.5, fat: 0.2, carb: 26.5, calcium: 43, phos: 84, iron: 0.6, vit_a: 0, thia: 0.09, ribo: 0.04, nia: 0.6, vit_c: 9 },
  { food_item: 'Purple yam, raw', alt_name: 'Ube', category: 'Grain', edible_portion: 100, energy: 118, protein: 1.5, fat: 0.1, carb: 27.9, calcium: 17, phos: 55, iron: 0.5, vit_a: 5, thia: 0.09, ribo: 0.03, nia: 0.6, vit_c: 12 },
  { food_item: 'Cassava, raw', alt_name: 'Kamoteng kahoy', category: 'Grain', edible_portion: 100, energy: 160, protein: 1.4, fat: 0.3, carb: 38.1, calcium: 16, phos: 27, iron: 0.3, vit_a: 13, thia: 0.09, ribo: 0.05, nia: 0.9, vit_c: 21 },
  { food_item: 'Potato, raw', alt_name: 'Patatas', category: 'Grain', edible_portion: 81, energy: 77, protein: 2.0, fat: 0.1, carb: 17.5, calcium: 12, phos: 57, iron: 0.8, vit_a: 0, thia: 0.08, ribo: 0.03, nia: 1.1, vit_c: 20 },
  { food_item: 'Jicama, raw', alt_name: 'Singkamas', category: 'Grain', edible_portion: 100, energy: 38, protein: 0.7, fat: 0.1, carb: 8.8, calcium: 12, phos: 18, iron: 0.6, vit_a: 0, thia: 0.02, ribo: 0.03, nia: 0.2, vit_c: 20 },

  // ── Proteins (animal) ────────────────────────────────────
  { food_item: 'Chicken breast, skinless, raw', alt_name: 'Manok dibdib', category: 'Protein', edible_portion: 100, energy: 165, protein: 31.0, fat: 3.6, carb: 0, calcium: 15, phos: 220, iron: 1.0, vit_a: 13, thia: 0.07, ribo: 0.11, nia: 13.7, vit_c: 0 },
  { food_item: 'Chicken thigh, bone-in, raw', alt_name: 'Hita ng manok', category: 'Protein', edible_portion: 67, energy: 209, protein: 15.0, fat: 16.3, carb: 0, calcium: 10, phos: 142, iron: 1.1, vit_a: 43, thia: 0.06, ribo: 0.16, nia: 5.2, vit_c: 0 },
  { food_item: 'Chicken liver, raw', alt_name: 'Atay ng manok', category: 'Protein', edible_portion: 100, energy: 119, protein: 16.9, fat: 4.8, carb: 0.7, calcium: 8, phos: 297, iron: 8.9, vit_a: 11000, thia: 0.29, ribo: 1.76, nia: 9.7, vit_c: 17 },
  { food_item: 'Pork, lean, raw', alt_name: 'Baboy', category: 'Protein', edible_portion: 100, energy: 143, protein: 20.7, fat: 6.2, carb: 0, calcium: 14, phos: 200, iron: 1.0, vit_a: 7, thia: 0.86, ribo: 0.25, nia: 4.8, vit_c: 0 },
  { food_item: 'Pork belly, raw', alt_name: 'Liempo', category: 'Protein', edible_portion: 100, energy: 518, protein: 9.3, fat: 53.0, carb: 0, calcium: 8, phos: 90, iron: 0.5, vit_a: 0, thia: 0.38, ribo: 0.10, nia: 2.4, vit_c: 0 },
  { food_item: 'Pork liver, raw', alt_name: 'Atay ng baboy', category: 'Protein', edible_portion: 100, energy: 130, protein: 20.4, fat: 3.7, carb: 2.5, calcium: 7, phos: 241, iron: 17.6, vit_a: 7000, thia: 0.30, ribo: 2.98, nia: 15.0, vit_c: 23 },
  { food_item: 'Beef, lean, raw', alt_name: 'Baka', category: 'Protein', edible_portion: 100, energy: 158, protein: 21.8, fat: 7.0, carb: 0, calcium: 12, phos: 200, iron: 2.6, vit_a: 0, thia: 0.07, ribo: 0.17, nia: 4.8, vit_c: 0 },
  { food_item: 'Beef liver, raw', alt_name: 'Atay ng baka', category: 'Protein', edible_portion: 100, energy: 135, protein: 20.4, fat: 3.6, carb: 3.9, calcium: 5, phos: 387, iron: 6.5, vit_a: 4916, thia: 0.19, ribo: 2.76, nia: 17.5, vit_c: 1 },
  { food_item: 'Egg, chicken, whole, raw', alt_name: 'Itlog', category: 'Protein', edible_portion: 88, energy: 143, protein: 12.6, fat: 9.5, carb: 0.7, calcium: 50, phos: 198, iron: 1.8, vit_a: 160, thia: 0.07, ribo: 0.48, nia: 0.1, vit_c: 0 },
  { food_item: 'Egg, duck, whole, raw', alt_name: 'Itlog ng pato', category: 'Protein', edible_portion: 88, energy: 185, protein: 12.8, fat: 13.8, carb: 1.1, calcium: 64, phos: 220, iron: 3.8, vit_a: 674, thia: 0.16, ribo: 0.40, nia: 0.2, vit_c: 0 },
  { food_item: 'Salted egg, raw', alt_name: 'Itlog na maalat', category: 'Protein', edible_portion: 88, energy: 185, protein: 14.0, fat: 13.8, carb: 1.4, calcium: 88, phos: 242, iron: 3.5, vit_a: 540, thia: 0.10, ribo: 0.42, nia: 0.2, vit_c: 0 },
  { food_item: 'Tilapia, raw', alt_name: 'Tilapia', category: 'Protein', edible_portion: 60, energy: 96, protein: 20.1, fat: 1.7, carb: 0, calcium: 10, phos: 170, iron: 0.7, vit_a: 0, thia: 0.04, ribo: 0.06, nia: 3.9, vit_c: 0 },
  { food_item: 'Bangus, milkfish, raw', alt_name: 'Bangus', category: 'Protein', edible_portion: 60, energy: 148, protein: 20.5, fat: 6.7, carb: 0, calcium: 51, phos: 162, iron: 0.3, vit_a: 30, thia: 0.01, ribo: 0.07, nia: 6.4, vit_c: 0 },
  { food_item: 'Grouper, raw', alt_name: 'Lapu-lapu', category: 'Protein', edible_portion: 60, energy: 92, protein: 19.4, fat: 1.0, carb: 0, calcium: 20, phos: 200, iron: 0.5, vit_a: 15, thia: 0.03, ribo: 0.05, nia: 3.2, vit_c: 0 },
  { food_item: 'Red snapper, raw', alt_name: 'Maya-maya', category: 'Protein', edible_portion: 60, energy: 100, protein: 20.5, fat: 1.3, carb: 0, calcium: 15, phos: 170, iron: 0.4, vit_a: 30, thia: 0.04, ribo: 0.07, nia: 3.5, vit_c: 0 },
  { food_item: 'Catfish, freshwater, raw', alt_name: 'Hito', category: 'Protein', edible_portion: 60, energy: 116, protein: 18.5, fat: 4.3, carb: 0, calcium: 14, phos: 210, iron: 0.9, vit_a: 30, thia: 0.04, ribo: 0.08, nia: 3.0, vit_c: 0 },
  { food_item: 'Mudfish, raw', alt_name: 'Dalag', category: 'Protein', edible_portion: 60, energy: 97, protein: 20.9, fat: 1.3, carb: 0, calcium: 32, phos: 184, iron: 1.1, vit_a: 12, thia: 0.05, ribo: 0.07, nia: 3.4, vit_c: 0 },
  { food_item: 'Shrimp, raw', alt_name: 'Hipon', category: 'Protein', edible_portion: 65, energy: 71, protein: 13.6, fat: 1.0, carb: 0.9, calcium: 54, phos: 244, iron: 2.4, vit_a: 0, thia: 0.02, ribo: 0.03, nia: 2.6, vit_c: 0 },
  { food_item: 'Green mussel, raw', alt_name: 'Tahong', category: 'Protein', edible_portion: 55, energy: 86, protein: 11.9, fat: 2.2, carb: 3.7, calcium: 38, phos: 197, iron: 3.9, vit_a: 96, thia: 0.16, ribo: 0.21, nia: 1.6, vit_c: 8 },
  { food_item: 'Oyster, raw', alt_name: 'Talaba', category: 'Protein', edible_portion: 65, energy: 81, protein: 9.5, fat: 2.5, carb: 4.9, calcium: 59, phos: 135, iron: 5.1, vit_a: 20, thia: 0.15, ribo: 0.23, nia: 1.6, vit_c: 4 },
  { food_item: 'Clam, raw', alt_name: 'Halaan', category: 'Protein', edible_portion: 55, energy: 74, protein: 12.8, fat: 1.0, carb: 2.6, calcium: 59, phos: 170, iron: 14.0, vit_a: 36, thia: 0.08, ribo: 0.18, nia: 1.5, vit_c: 13 },
  { food_item: 'Round scad, raw', alt_name: 'Galunggong', category: 'Protein', edible_portion: 100, energy: 110, protein: 18.9, fat: 3.8, carb: 0, calcium: 32, phos: 191, iron: 1.8, vit_a: 20, thia: 0.05, ribo: 0.12, nia: 5.6, vit_c: 0 },
  { food_item: 'Anchovy, dried', alt_name: 'Dilis tuyo', category: 'Protein', edible_portion: 100, energy: 290, protein: 55.4, fat: 6.8, carb: 0, calcium: 2240, phos: 1540, iron: 9.5, vit_a: 50, thia: 0.08, ribo: 0.25, nia: 8.4, vit_c: 0 },
  { food_item: 'Herring, dried salted', alt_name: 'Tuyo', category: 'Protein', edible_portion: 100, energy: 283, protein: 45.7, fat: 11.0, carb: 0, calcium: 210, phos: 500, iron: 2.8, vit_a: 40, thia: 0.03, ribo: 0.18, nia: 6.5, vit_c: 0 },
  { food_item: 'Mackerel, spanish, raw', alt_name: 'Tanigue', category: 'Protein', edible_portion: 100, energy: 139, protein: 19.3, fat: 6.3, carb: 0, calcium: 15, phos: 205, iron: 1.2, vit_a: 45, thia: 0.12, ribo: 0.15, nia: 8.2, vit_c: 0 },
  { food_item: 'Sardines, canned in oil', alt_name: 'Sardinas', category: 'Protein', edible_portion: 100, energy: 208, protein: 24.6, fat: 11.5, carb: 0, calcium: 382, phos: 490, iron: 2.9, vit_a: 47, thia: 0.02, ribo: 0.25, nia: 5.3, vit_c: 0 },
  { food_item: 'Smoked fish', alt_name: 'Tinapa', category: 'Protein', edible_portion: 100, energy: 214, protein: 28.0, fat: 11.2, carb: 0, calcium: 65, phos: 312, iron: 1.5, vit_a: 50, thia: 0.04, ribo: 0.20, nia: 7.0, vit_c: 0 },
  { food_item: 'Squid, raw', alt_name: 'Pusit', category: 'Protein', edible_portion: 100, energy: 92, protein: 15.6, fat: 1.4, carb: 3.1, calcium: 32, phos: 221, iron: 0.7, vit_a: 10, thia: 0.06, ribo: 0.22, nia: 2.2, vit_c: 4 },
  { food_item: 'Crab, mud, raw', alt_name: 'Alimango', category: 'Protein', edible_portion: 100, energy: 87, protein: 17.2, fat: 1.1, carb: 0.5, calcium: 89, phos: 190, iron: 1.5, vit_a: 25, thia: 0.08, ribo: 0.15, nia: 3.1, vit_c: 3 },
  { food_item: 'Crab, blue swimming, raw', alt_name: 'Alimasag', category: 'Protein', edible_portion: 40, energy: 83, protein: 17.4, fat: 0.9, carb: 0, calcium: 84, phos: 188, iron: 1.0, vit_a: 16, thia: 0.06, ribo: 0.12, nia: 2.7, vit_c: 2 },

  // ── Proteins (plant) ─────────────────────────────────────
  { food_item: 'Tofu, firm', alt_name: 'Tokwa', category: 'Protein', edible_portion: 100, energy: 144, protein: 17.3, fat: 8.7, carb: 2.8, calcium: 350, phos: 190, iron: 2.7, vit_a: 0, thia: 0.16, ribo: 0.10, nia: 0.4, vit_c: 0 },
  { food_item: 'Mungbean, dry', alt_name: 'Mongo', category: 'Protein', edible_portion: 100, energy: 347, protein: 23.9, fat: 1.2, carb: 62.6, calcium: 132, phos: 367, iron: 6.7, vit_a: 6, thia: 0.62, ribo: 0.23, nia: 2.3, vit_c: 5 },
  { food_item: 'Soybean, dry', alt_name: 'Utaw', category: 'Protein', edible_portion: 100, energy: 446, protein: 36.5, fat: 19.9, carb: 30.2, calcium: 277, phos: 704, iron: 15.7, vit_a: 22, thia: 0.87, ribo: 0.87, nia: 1.6, vit_c: 6 },
  { food_item: 'Chickpeas, dry', alt_name: 'Garbanzos', category: 'Protein', edible_portion: 100, energy: 364, protein: 19.3, fat: 6.0, carb: 60.7, calcium: 105, phos: 366, iron: 6.2, vit_a: 67, thia: 0.48, ribo: 0.21, nia: 1.5, vit_c: 4 },
  { food_item: 'Red kidney beans, dry', alt_name: 'Habichuelas', category: 'Protein', edible_portion: 100, energy: 337, protein: 22.5, fat: 1.4, carb: 61.3, calcium: 83, phos: 406, iron: 6.7, vit_a: 0, thia: 0.53, ribo: 0.22, nia: 2.1, vit_c: 5 },
  { food_item: 'Peanut, raw', alt_name: 'Mani', category: 'Protein', edible_portion: 100, energy: 567, protein: 25.8, fat: 49.2, carb: 16.1, calcium: 92, phos: 376, iron: 4.6, vit_a: 0, thia: 0.64, ribo: 0.13, nia: 12.1, vit_c: 0 },

  // ── Vegetables & Greens ──────────────────────────────────
  { food_item: 'Kangkong, raw', alt_name: 'Water spinach', category: 'Vegetable', edible_portion: 70, energy: 19, protein: 2.6, fat: 0.2, carb: 3.1, calcium: 77, phos: 39, iron: 1.7, vit_a: 6300, thia: 0.03, ribo: 0.10, nia: 0.9, vit_c: 55 },
  { food_item: 'Malunggay leaves, raw', alt_name: 'Moringa', category: 'Vegetable', edible_portion: 50, energy: 64, protein: 9.4, fat: 1.4, carb: 8.3, calcium: 185, phos: 112, iron: 4.0, vit_a: 7560, thia: 0.26, ribo: 0.66, nia: 2.2, vit_c: 220 },
  { food_item: 'Saluyot, raw', alt_name: 'Jute leaves', category: 'Vegetable', edible_portion: 100, energy: 43, protein: 4.6, fat: 0.6, carb: 6.0, calcium: 266, phos: 97, iron: 7.2, vit_a: 8260, thia: 0.11, ribo: 0.35, nia: 1.2, vit_c: 36 },
  { food_item: 'Alugbati, raw', alt_name: 'Malabar spinach', category: 'Vegetable', edible_portion: 100, energy: 19, protein: 1.8, fat: 0.3, carb: 3.4, calcium: 109, phos: 52, iron: 1.2, vit_a: 2395, thia: 0.05, ribo: 0.16, nia: 0.5, vit_c: 102 },
  { food_item: 'Kulitis, raw', alt_name: 'Amaranth leaves', category: 'Vegetable', edible_portion: 100, energy: 23, protein: 2.5, fat: 0.3, carb: 3.5, calcium: 215, phos: 50, iron: 2.3, vit_a: 6090, thia: 0.04, ribo: 0.16, nia: 0.7, vit_c: 43 },
  { food_item: 'Mustasa, raw', alt_name: 'Mustard leaves', category: 'Vegetable', edible_portion: 100, energy: 27, protein: 2.9, fat: 0.4, carb: 4.4, calcium: 115, phos: 58, iron: 1.5, vit_a: 3620, thia: 0.08, ribo: 0.11, nia: 0.8, vit_c: 70 },
  { food_item: 'Pako, raw', alt_name: 'Fern fronds', category: 'Vegetable', edible_portion: 100, energy: 34, protein: 3.5, fat: 0.4, carb: 5.4, calcium: 68, phos: 55, iron: 1.7, vit_a: 2500, thia: 0.06, ribo: 0.18, nia: 0.8, vit_c: 25 },
  { food_item: 'Petsay, raw', alt_name: 'Chinese cabbage', category: 'Vegetable', edible_portion: 100, energy: 16, protein: 1.5, fat: 0.2, carb: 2.2, calcium: 77, phos: 37, iron: 0.8, vit_a: 1198, thia: 0.04, ribo: 0.07, nia: 0.5, vit_c: 45 },
  { food_item: 'Pechay Baguio, raw', alt_name: 'Bok choy', category: 'Vegetable', edible_portion: 100, energy: 13, protein: 1.5, fat: 0.2, carb: 2.2, calcium: 105, phos: 37, iron: 0.8, vit_a: 4468, thia: 0.04, ribo: 0.07, nia: 0.5, vit_c: 45 },
  { food_item: 'Tomato, raw', alt_name: 'Kamatis', category: 'Vegetable', edible_portion: 99, energy: 18, protein: 0.9, fat: 0.2, carb: 3.9, calcium: 10, phos: 24, iron: 0.3, vit_a: 833, thia: 0.04, ribo: 0.02, nia: 0.6, vit_c: 14 },
  { food_item: 'Onion, red, raw', alt_name: 'Sibuyas', category: 'Vegetable', edible_portion: 90, energy: 40, protein: 1.1, fat: 0.1, carb: 9.3, calcium: 23, phos: 29, iron: 0.2, vit_a: 0, thia: 0.05, ribo: 0.03, nia: 0.1, vit_c: 7 },
  { food_item: 'Garlic, raw', alt_name: 'Bawang', category: 'Vegetable', edible_portion: 87, energy: 149, protein: 6.4, fat: 0.5, carb: 33.1, calcium: 181, phos: 153, iron: 1.7, vit_a: 0, thia: 0.20, ribo: 0.11, nia: 0.7, vit_c: 31 },
  { food_item: 'Carrot, raw', alt_name: 'Karot', category: 'Vegetable', edible_portion: 90, energy: 41, protein: 0.9, fat: 0.2, carb: 9.6, calcium: 33, phos: 35, iron: 0.3, vit_a: 16700, thia: 0.07, ribo: 0.06, nia: 1.0, vit_c: 6 },
  { food_item: 'Eggplant, raw', alt_name: 'Talong', category: 'Vegetable', edible_portion: 85, energy: 25, protein: 1.0, fat: 0.2, carb: 5.9, calcium: 9, phos: 24, iron: 0.2, vit_a: 23, thia: 0.04, ribo: 0.04, nia: 0.6, vit_c: 2 },
  { food_item: 'Squash, raw', alt_name: 'Kalabasa', category: 'Vegetable', edible_portion: 76, energy: 26, protein: 1.0, fat: 0.1, carb: 6.5, calcium: 21, phos: 44, iron: 0.8, vit_a: 8500, thia: 0.05, ribo: 0.11, nia: 0.6, vit_c: 9 },
  { food_item: 'Cabbage, raw', alt_name: 'Repolyo', category: 'Vegetable', edible_portion: 80, energy: 25, protein: 1.3, fat: 0.1, carb: 5.8, calcium: 40, phos: 26, iron: 0.5, vit_a: 98, thia: 0.06, ribo: 0.04, nia: 0.2, vit_c: 36 },
  { food_item: 'Chili leaves, raw', alt_name: 'Dahon ng sili', category: 'Vegetable', edible_portion: 100, energy: 46, protein: 4.2, fat: 0.6, carb: 6.0, calcium: 350, phos: 75, iron: 6.0, vit_a: 11000, thia: 0.15, ribo: 0.40, nia: 1.4, vit_c: 125 },
  { food_item: 'Siling labuyo, raw', alt_name: 'Bird\'s eye chili', category: 'Vegetable', edible_portion: 100, energy: 40, protein: 1.9, fat: 0.4, carb: 8.8, calcium: 14, phos: 43, iron: 1.2, vit_a: 952, thia: 0.09, ribo: 0.09, nia: 0.9, vit_c: 144 },
  { food_item: 'Taro leaves, raw', alt_name: 'Dahon ng gabi', category: 'Vegetable', edible_portion: 100, energy: 42, protein: 5.0, fat: 0.8, carb: 6.7, calcium: 107, phos: 60, iron: 1.2, vit_a: 4800, thia: 0.08, ribo: 0.40, nia: 1.2, vit_c: 52 },
  { food_item: 'Yardlong bean, raw', alt_name: 'Sitaw', category: 'Vegetable', edible_portion: 100, energy: 47, protein: 2.8, fat: 0.4, carb: 8.0, calcium: 50, phos: 59, iron: 1.0, vit_a: 860, thia: 0.13, ribo: 0.11, nia: 1.0, vit_c: 18 },
  { food_item: 'Winged bean, raw', alt_name: 'Sigarilyas', category: 'Vegetable', edible_portion: 100, energy: 49, protein: 6.3, fat: 0.4, carb: 8.9, calcium: 50, phos: 100, iron: 2.2, vit_a: 260, thia: 0.23, ribo: 0.26, nia: 0.9, vit_c: 18 },
  { food_item: 'Chayote, raw', alt_name: 'Sayote', category: 'Vegetable', edible_portion: 100, energy: 19, protein: 0.8, fat: 0.1, carb: 4.5, calcium: 17, phos: 18, iron: 0.3, vit_a: 10, thia: 0.03, ribo: 0.03, nia: 0.5, vit_c: 8 },
  { food_item: 'Bitter melon, raw', alt_name: 'Ampalaya', category: 'Vegetable', edible_portion: 100, energy: 17, protein: 1.0, fat: 0.2, carb: 3.7, calcium: 19, phos: 31, iron: 0.4, vit_a: 470, thia: 0.04, ribo: 0.04, nia: 0.4, vit_c: 84 },
  { food_item: 'Bitter melon leaves, raw', alt_name: 'Dahon ng ampalaya', category: 'Vegetable', edible_portion: 100, energy: 44, protein: 5.2, fat: 0.5, carb: 7.2, calcium: 240, phos: 83, iron: 4.8, vit_a: 7800, thia: 0.12, ribo: 0.32, nia: 1.1, vit_c: 170 },
  { food_item: 'Okra, raw', alt_name: 'Okra', category: 'Vegetable', edible_portion: 100, energy: 33, protein: 1.9, fat: 0.2, carb: 7.5, calcium: 82, phos: 61, iron: 0.6, vit_a: 375, thia: 0.20, ribo: 0.06, nia: 1.0, vit_c: 21 },
  { food_item: 'White radish, raw', alt_name: 'Labanos', category: 'Vegetable', edible_portion: 100, energy: 18, protein: 0.7, fat: 0.1, carb: 4.1, calcium: 23, phos: 20, iron: 0.4, vit_a: 0, thia: 0.02, ribo: 0.02, nia: 0.3, vit_c: 15 },
  { food_item: 'Bamboo shoots, fresh', alt_name: 'Labong', category: 'Vegetable', edible_portion: 100, energy: 27, protein: 2.6, fat: 0.3, carb: 5.2, calcium: 13, phos: 59, iron: 0.5, vit_a: 0, thia: 0.15, ribo: 0.07, nia: 0.6, vit_c: 4 },
  { food_item: 'Bottle gourd, raw', alt_name: 'Upo', category: 'Vegetable', edible_portion: 100, energy: 14, protein: 0.6, fat: 0.1, carb: 3.4, calcium: 26, phos: 13, iron: 0.2, vit_a: 0, thia: 0.03, ribo: 0.02, nia: 0.2, vit_c: 10 },
  { food_item: 'Sponge gourd, raw', alt_name: 'Patola', category: 'Vegetable', edible_portion: 100, energy: 20, protein: 0.7, fat: 0.2, carb: 4.3, calcium: 20, phos: 32, iron: 0.4, vit_a: 410, thia: 0.04, ribo: 0.04, nia: 0.4, vit_c: 12 },
  { food_item: 'Banana heart, raw', alt_name: 'Puso ng saging', category: 'Vegetable', edible_portion: 100, energy: 51, protein: 1.6, fat: 0.6, carb: 9.9, calcium: 56, phos: 73, iron: 1.7, vit_a: 50, thia: 0.05, ribo: 0.06, nia: 0.7, vit_c: 10 },
  { food_item: 'Young jackfruit, raw', alt_name: 'Batang langka', category: 'Vegetable', edible_portion: 100, energy: 40, protein: 1.5, fat: 0.3, carb: 9.4, calcium: 24, phos: 27, iron: 0.4, vit_a: 23, thia: 0.03, ribo: 0.04, nia: 0.5, vit_c: 6 },
  { food_item: 'Sweet potato leaves, raw', alt_name: 'Talbos ng kamote', category: 'Vegetable', edible_portion: 100, energy: 35, protein: 2.8, fat: 0.4, carb: 6.2, calcium: 120, phos: 50, iron: 2.5, vit_a: 6200, thia: 0.10, ribo: 0.25, nia: 1.0, vit_c: 45 },
  { food_item: 'Lemongrass, raw', alt_name: 'Tanglad', category: 'Vegetable', edible_portion: 100, energy: 99, protein: 1.8, fat: 0.5, carb: 25.3, calcium: 65, phos: 101, iron: 8.2, vit_a: 6, thia: 0.07, ribo: 0.14, nia: 1.1, vit_c: 2.6 },
  { food_item: 'Pandan leaves, raw', alt_name: 'Dahon ng pandan', category: 'Vegetable', edible_portion: 100, energy: 44, protein: 1.2, fat: 0.2, carb: 9.3, calcium: 50, phos: 30, iron: 0.8, vit_a: 120, thia: 0.03, ribo: 0.04, nia: 0.5, vit_c: 5 },

  // ── Fruits ────────────────────────────────────────────────
  { food_item: 'Mango, ripe, raw', alt_name: 'Mangga', category: 'Fruit', edible_portion: 67, energy: 60, protein: 0.8, fat: 0.4, carb: 15.0, calcium: 11, phos: 14, iron: 0.2, vit_a: 1262, thia: 0.03, ribo: 0.04, nia: 0.7, vit_c: 36 },
  { food_item: 'Mango, green, raw', alt_name: 'Manggang hilaw', category: 'Fruit', edible_portion: 100, energy: 44, protein: 0.7, fat: 0.2, carb: 10.3, calcium: 12, phos: 11, iron: 0.3, vit_a: 150, thia: 0.04, ribo: 0.04, nia: 0.5, vit_c: 65 },
  { food_item: 'Banana, ripe, raw', alt_name: 'Saging', category: 'Fruit', edible_portion: 65, energy: 89, protein: 1.1, fat: 0.3, carb: 22.8, calcium: 5, phos: 22, iron: 0.3, vit_a: 64, thia: 0.03, ribo: 0.07, nia: 0.7, vit_c: 9 },
  { food_item: 'Banana, saba, ripe', alt_name: 'Saging na saba', category: 'Fruit', edible_portion: 65, energy: 97, protein: 1.2, fat: 0.2, carb: 24.1, calcium: 10, phos: 28, iron: 0.4, vit_a: 45, thia: 0.04, ribo: 0.05, nia: 0.6, vit_c: 8 },
  { food_item: 'Papaya, ripe, raw', alt_name: 'Papaya', category: 'Fruit', edible_portion: 75, energy: 43, protein: 0.5, fat: 0.3, carb: 10.8, calcium: 20, phos: 10, iron: 0.3, vit_a: 950, thia: 0.02, ribo: 0.03, nia: 0.4, vit_c: 60 },
  { food_item: 'Papaya, green, raw', alt_name: 'Hilaw na papaya', category: 'Fruit', edible_portion: 75, energy: 39, protein: 0.6, fat: 0.1, carb: 9.8, calcium: 24, phos: 10, iron: 0.3, vit_a: 90, thia: 0.02, ribo: 0.03, nia: 0.4, vit_c: 48 },
  { food_item: 'Calamansi, raw', alt_name: 'Calamansi', category: 'Fruit', edible_portion: 60, energy: 37, protein: 0.9, fat: 0.4, carb: 9.3, calcium: 40, phos: 27, iron: 0.4, vit_a: 26, thia: 0.04, ribo: 0.02, nia: 0.2, vit_c: 53 },
  { food_item: 'Pineapple, raw', alt_name: 'Pinya', category: 'Fruit', edible_portion: 100, energy: 50, protein: 0.5, fat: 0.1, carb: 13.1, calcium: 13, phos: 8, iron: 0.3, vit_a: 58, thia: 0.08, ribo: 0.03, nia: 0.5, vit_c: 48 },
  { food_item: 'Guava, raw', alt_name: 'Bayabas', category: 'Fruit', edible_portion: 100, energy: 68, protein: 2.6, fat: 1.0, carb: 14.3, calcium: 18, phos: 40, iron: 0.3, vit_a: 624, thia: 0.07, ribo: 0.04, nia: 1.1, vit_c: 228 },
  { food_item: 'Soursop, raw', alt_name: 'Guyabano', category: 'Fruit', edible_portion: 100, energy: 66, protein: 1.0, fat: 0.3, carb: 16.8, calcium: 14, phos: 27, iron: 0.6, vit_a: 0, thia: 0.07, ribo: 0.05, nia: 0.9, vit_c: 21 },
  { food_item: 'Sugar apple, raw', alt_name: 'Atis', category: 'Fruit', edible_portion: 73, energy: 94, protein: 2.1, fat: 0.3, carb: 23.6, calcium: 24, phos: 32, iron: 0.7, vit_a: 6, thia: 0.11, ribo: 0.11, nia: 0.9, vit_c: 37 },
  { food_item: 'Avocado, raw', alt_name: 'Abukado', category: 'Fruit', edible_portion: 73, energy: 160, protein: 2.0, fat: 14.7, carb: 8.5, calcium: 12, phos: 52, iron: 0.6, vit_a: 147, thia: 0.07, ribo: 0.13, nia: 1.7, vit_c: 10 },
  { food_item: 'Dragon fruit, raw', alt_name: 'Pitaya', category: 'Fruit', edible_portion: 100, energy: 60, protein: 1.2, fat: 0.4, carb: 12.9, calcium: 8, phos: 22, iron: 1.9, vit_a: 0, thia: 0.04, ribo: 0.05, nia: 0.4, vit_c: 9 },
  { food_item: 'Lanzones, raw', alt_name: 'Lanzones', category: 'Fruit', edible_portion: 65, energy: 66, protein: 1.0, fat: 0.2, carb: 16.3, calcium: 19, phos: 31, iron: 0.9, vit_a: 0, thia: 0.09, ribo: 0.12, nia: 0.8, vit_c: 14 },
  { food_item: 'Santol, raw', alt_name: 'Santol', category: 'Fruit', edible_portion: 55, energy: 43, protein: 0.6, fat: 0.1, carb: 10.6, calcium: 22, phos: 15, iron: 0.6, vit_a: 0, thia: 0.03, ribo: 0.04, nia: 0.4, vit_c: 5 },
  { food_item: 'Rambutan, raw', alt_name: 'Rambutan', category: 'Fruit', edible_portion: 40, energy: 75, protein: 0.9, fat: 0.2, carb: 18.1, calcium: 22, phos: 9, iron: 0.4, vit_a: 0, thia: 0.01, ribo: 0.02, nia: 1.4, vit_c: 5 },
  { food_item: 'Star apple, raw', alt_name: 'Kaimito', category: 'Fruit', edible_portion: 72, energy: 67, protein: 1.5, fat: 0.6, carb: 14.7, calcium: 17, phos: 25, iron: 0.7, vit_a: 0, thia: 0.08, ribo: 0.04, nia: 0.5, vit_c: 3 },
  { food_item: 'Watermelon, raw', alt_name: 'Pakwan', category: 'Fruit', edible_portion: 68, energy: 30, protein: 0.6, fat: 0.2, carb: 7.6, calcium: 7, phos: 11, iron: 0.2, vit_a: 569, thia: 0.03, ribo: 0.02, nia: 0.2, vit_c: 8 },
  { food_item: 'Philippine orange, raw', alt_name: 'Dalandan', category: 'Fruit', edible_portion: 72, energy: 36, protein: 0.8, fat: 0.1, carb: 8.9, calcium: 34, phos: 23, iron: 0.2, vit_a: 150, thia: 0.05, ribo: 0.04, nia: 0.3, vit_c: 40 },
  { food_item: 'Jackfruit, ripe, raw', alt_name: 'Hinog na langka', category: 'Fruit', edible_portion: 72, energy: 95, protein: 1.7, fat: 0.6, carb: 23.2, calcium: 24, phos: 36, iron: 0.2, vit_a: 110, thia: 0.10, ribo: 0.06, nia: 1.5, vit_c: 13 },
  { food_item: 'Tamarind, raw', alt_name: 'Sampalok', category: 'Fruit', edible_portion: 100, energy: 239, protein: 2.8, fat: 0.6, carb: 62.5, calcium: 74, phos: 113, iron: 2.8, vit_a: 30, thia: 0.43, ribo: 0.14, nia: 1.9, vit_c: 3 },
  { food_item: 'Coconut meat, mature', alt_name: 'Niyog', category: 'Fruit', edible_portion: 100, energy: 354, protein: 3.3, fat: 33.5, carb: 15.2, calcium: 14, phos: 113, iron: 2.4, vit_a: 0, thia: 0.06, ribo: 0.02, nia: 0.5, vit_c: 3 },
  { food_item: 'Coconut water', alt_name: 'Sabaw ng buko', category: 'Fruit', edible_portion: 100, energy: 19, protein: 0.7, fat: 0.2, carb: 3.7, calcium: 24, phos: 20, iron: 0.3, vit_a: 0, thia: 0.03, ribo: 0.06, nia: 0.1, vit_c: 2.4 },
  { food_item: 'Java plum, raw', alt_name: 'Duhat', category: 'Fruit', edible_portion: 72, energy: 60, protein: 0.7, fat: 0.2, carb: 14.5, calcium: 19, phos: 17, iron: 0.2, vit_a: 26, thia: 0.02, ribo: 0.01, nia: 0.3, vit_c: 14 },

  // ── Dairy & Eggs ──────────────────────────────────────────
  { food_item: 'Milk, cow, whole, fluid', alt_name: 'Gatas', category: 'Dairy', edible_portion: 100, energy: 61, protein: 3.2, fat: 3.3, carb: 4.8, calcium: 113, phos: 84, iron: 0.0, vit_a: 162, thia: 0.04, ribo: 0.18, nia: 0.1, vit_c: 0 },
  { food_item: 'Milk, evaporated, full cream', alt_name: 'Milik evaporada', category: 'Dairy', edible_portion: 100, energy: 134, protein: 6.8, fat: 7.6, carb: 10.0, calcium: 261, phos: 191, iron: 0.2, vit_a: 189, thia: 0.05, ribo: 0.32, nia: 0.2, vit_c: 1 },
  { food_item: 'Milk, condensed, sweetened', alt_name: 'Kondensadang gatas', category: 'Dairy', edible_portion: 100, energy: 321, protein: 7.9, fat: 8.7, carb: 54.4, calcium: 284, phos: 220, iron: 0.2, vit_a: 243, thia: 0.07, ribo: 0.42, nia: 0.2, vit_c: 2 },
  { food_item: 'Cheese, cheddar', alt_name: 'Keso', category: 'Dairy', edible_portion: 100, energy: 403, protein: 24.9, fat: 33.1, carb: 1.3, calcium: 721, phos: 512, iron: 0.7, vit_a: 1002, thia: 0.03, ribo: 0.38, nia: 0.1, vit_c: 0 },
  { food_item: 'Kesong puti', alt_name: 'White soft cheese', category: 'Dairy', edible_portion: 100, energy: 300, protein: 22.0, fat: 21.0, carb: 2.0, calcium: 520, phos: 380, iron: 0.5, vit_a: 700, thia: 0.02, ribo: 0.30, nia: 0.1, vit_c: 0 },
  { food_item: 'Butter, salted', alt_name: 'Mantikilya', category: 'Dairy', edible_portion: 100, energy: 717, protein: 0.9, fat: 81.1, carb: 0.1, calcium: 24, phos: 24, iron: 0.0, vit_a: 2499, thia: 0.01, ribo: 0.03, nia: 0.0, vit_c: 0 },

  // ── Fats & Oils ───────────────────────────────────────────
  { food_item: 'Coconut oil', alt_name: 'Mantika ng niyog', category: 'Fat', edible_portion: 100, energy: 862, protein: 0, fat: 100, carb: 0, calcium: 0, phos: 0, iron: 0, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Vegetable oil, palm', alt_name: 'Mantika', category: 'Fat', edible_portion: 100, energy: 884, protein: 0, fat: 100, carb: 0, calcium: 0, phos: 0, iron: 0.1, vit_a: 54, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Olive oil', category: 'Fat', edible_portion: 100, energy: 884, protein: 0, fat: 100, carb: 0, calcium: 1, phos: 0, iron: 0.6, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Margarine', category: 'Fat', edible_portion: 100, energy: 717, protein: 0.2, fat: 80.7, carb: 0.7, calcium: 3, phos: 3, iron: 0.0, vit_a: 3000, thia: 0.0, ribo: 0.0, nia: 0.0, vit_c: 0 },
  { food_item: 'Lard', alt_name: 'Taba ng baboy', category: 'Fat', edible_portion: 100, energy: 902, protein: 0, fat: 100, carb: 0, calcium: 0, phos: 0, iron: 0, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },

  // ── Spices, Condiments & Seasonings ──────────────────────
  { food_item: 'Salt, iodized', alt_name: 'Asin', category: 'Spice', edible_portion: 100, energy: 0, protein: 0, fat: 0, carb: 0, calcium: 24, phos: 0, iron: 0.3, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Soy sauce', alt_name: 'Toyo', category: 'Spice', edible_portion: 100, energy: 53, protein: 8.1, fat: 0.6, carb: 4.9, calcium: 17, phos: 130, iron: 1.4, vit_a: 0, thia: 0.06, ribo: 0.15, nia: 4.0, vit_c: 0 },
  { food_item: 'Vinegar, white', alt_name: 'Suka', category: 'Spice', edible_portion: 100, energy: 18, protein: 0, fat: 0, carb: 0.9, calcium: 6, phos: 4, iron: 0.0, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Palm vinegar', alt_name: 'Sukang tuba', category: 'Spice', edible_portion: 100, energy: 12, protein: 0.1, fat: 0, carb: 0.5, calcium: 8, phos: 5, iron: 0.1, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Ginger, raw', alt_name: 'Luya', category: 'Spice', edible_portion: 90, energy: 80, protein: 1.8, fat: 0.8, carb: 17.8, calcium: 16, phos: 34, iron: 0.6, vit_a: 0, thia: 0.03, ribo: 0.03, nia: 0.8, vit_c: 5 },
  { food_item: 'Turmeric, raw', alt_name: 'Dilaw', category: 'Spice', edible_portion: 90, energy: 99, protein: 3.1, fat: 1.8, carb: 21.7, calcium: 25, phos: 79, iron: 3.5, vit_a: 0, thia: 0.06, ribo: 0.14, nia: 1.4, vit_c: 26 },
  { food_item: 'Black pepper, ground', alt_name: 'Paminta', category: 'Spice', edible_portion: 100, energy: 251, protein: 10.4, fat: 3.3, carb: 63.9, calcium: 443, phos: 173, iron: 9.7, vit_a: 547, thia: 0.11, ribo: 0.24, nia: 1.1, vit_c: 21 },
  { food_item: 'Bay leaf, dried', alt_name: 'Laurel', category: 'Spice', edible_portion: 100, energy: 313, protein: 7.6, fat: 8.4, carb: 74.9, calcium: 834, phos: 113, iron: 43.0, vit_a: 6185, thia: 0.01, ribo: 0.42, nia: 2.0, vit_c: 47 },
  { food_item: 'Annatto seeds', alt_name: 'Atsuete', category: 'Spice', edible_portion: 100, energy: 306, protein: 13.5, fat: 10.0, carb: 49.8, calcium: 175, phos: 272, iron: 13.1, vit_a: 0, thia: 0.05, ribo: 0.07, nia: 0.6, vit_c: 0 },
  { food_item: 'Coconut milk, thick', alt_name: 'Kakang gata', category: 'Spice', edible_portion: 100, energy: 230, protein: 2.3, fat: 23.8, carb: 5.5, calcium: 16, phos: 100, iron: 1.6, vit_a: 0, thia: 0.03, ribo: 0.02, nia: 0.8, vit_c: 1 },
  { food_item: 'Fish sauce', alt_name: 'Patis', category: 'Spice', edible_portion: 100, energy: 35, protein: 5.0, fat: 0.1, carb: 3.6, calcium: 43, phos: 36, iron: 1.2, vit_a: 0, thia: 0.01, ribo: 0.02, nia: 0.5, vit_c: 0 },
  { food_item: 'Shrimp paste', alt_name: 'Bagoong alamang', category: 'Spice', edible_portion: 100, energy: 85, protein: 11.2, fat: 1.5, carb: 6.8, calcium: 1120, phos: 780, iron: 5.4, vit_a: 30, thia: 0.02, ribo: 0.12, nia: 1.5, vit_c: 0 },
  { food_item: 'Oyster sauce', category: 'Spice', edible_portion: 100, energy: 51, protein: 1.6, fat: 0.1, carb: 11.5, calcium: 18, phos: 34, iron: 0.7, vit_a: 0, thia: 0.02, ribo: 0.05, nia: 0.5, vit_c: 0 },
  { food_item: 'Banana ketchup', alt_name: 'Banana catsup', category: 'Spice', edible_portion: 100, energy: 75, protein: 0.5, fat: 0.1, carb: 19.0, calcium: 4, phos: 12, iron: 0.3, vit_a: 20, thia: 0.01, ribo: 0.02, nia: 0.2, vit_c: 3 },
  { food_item: 'White sugar', alt_name: 'Asukal na puti', category: 'Spice', edible_portion: 100, energy: 387, protein: 0, fat: 0, carb: 100, calcium: 1, phos: 0, iron: 0.1, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Brown sugar', alt_name: 'Asukal na pula', category: 'Spice', edible_portion: 100, energy: 380, protein: 0.1, fat: 0, carb: 98.1, calcium: 85, phos: 22, iron: 1.9, vit_a: 0, thia: 0.01, ribo: 0.01, nia: 0.1, vit_c: 0 },
  { food_item: 'Coconut vinegar', alt_name: 'Sukang buko', category: 'Spice', edible_portion: 100, energy: 14, protein: 0.1, fat: 0, carb: 0.6, calcium: 10, phos: 6, iron: 0.1, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
]

async function main() {
  console.log(`🌱 Seeding ${FCT.length} ingredients from Philippine FCT…`)

  let created = 0
  let updated = 0

  for (const item of FCT) {
    const existing = await prisma.ingredient.findFirst({
      where: { food_item: item.food_item },
    })
    if (existing) {
      await prisma.ingredient.update({
        where: { id: existing.id },
        data: { ...item, source: 'FNRI FCT' },
      })
      updated++
    } else {
      await prisma.ingredient.create({
        data: { ...item, source: 'FNRI FCT' },
      })
      created++
    }
  }

  const total = await prisma.ingredient.count()
  console.log(`✅ Done. Created: ${created}, Updated: ${updated}. Total in DB: ${total}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
