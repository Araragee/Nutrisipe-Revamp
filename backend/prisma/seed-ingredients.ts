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
  // ── Grains ────────────────────────────────────────────────
  { food_item: 'Rice, white, cooked', alt_name: 'Kanin', category: 'Grain', edible_portion: 100, energy: 130, protein: 2.7, fat: 0.3, carb: 28.2, calcium: 10, phos: 43, iron: 0.2, vit_a: 0, thia: 0.02, ribo: 0.01, nia: 0.4, vit_c: 0 },
  { food_item: 'Rice, brown, cooked', alt_name: 'Brown rice', category: 'Grain', edible_portion: 100, energy: 123, protein: 2.7, fat: 1.0, carb: 25.6, calcium: 10, phos: 83, iron: 0.5, vit_a: 0, thia: 0.18, ribo: 0.04, nia: 1.5, vit_c: 0 },
  { food_item: 'Bread, white, loaf', category: 'Grain', edible_portion: 100, energy: 265, protein: 9.0, fat: 3.2, carb: 49.0, calcium: 144, phos: 99, iron: 3.6, vit_a: 0, thia: 0.45, ribo: 0.26, nia: 4.4, vit_c: 0 },
  { food_item: 'Oats, rolled, dry', category: 'Grain', edible_portion: 100, energy: 379, protein: 13.2, fat: 6.5, carb: 67.7, calcium: 52, phos: 410, iron: 4.3, vit_a: 0, thia: 0.46, ribo: 0.16, nia: 1.5, vit_c: 0 },
  { food_item: 'Pasta, spaghetti, cooked', category: 'Grain', edible_portion: 100, energy: 158, protein: 5.8, fat: 0.9, carb: 30.9, calcium: 7, phos: 58, iron: 1.3, vit_a: 0, thia: 0.21, ribo: 0.11, nia: 1.7, vit_c: 0 },

  // ── Proteins (animal) ────────────────────────────────────
  { food_item: 'Chicken breast, skinless, raw', alt_name: 'Manok dibdib', category: 'Protein', edible_portion: 100, energy: 165, protein: 31.0, fat: 3.6, carb: 0, calcium: 15, phos: 220, iron: 1.0, vit_a: 13, thia: 0.07, ribo: 0.11, nia: 13.7, vit_c: 0 },
  { food_item: 'Pork, lean, raw', alt_name: 'Baboy', category: 'Protein', edible_portion: 100, energy: 143, protein: 20.7, fat: 6.2, carb: 0, calcium: 14, phos: 200, iron: 1.0, vit_a: 7, thia: 0.86, ribo: 0.25, nia: 4.8, vit_c: 0 },
  { food_item: 'Beef, lean, raw', alt_name: 'Baka', category: 'Protein', edible_portion: 100, energy: 158, protein: 21.8, fat: 7.0, carb: 0, calcium: 12, phos: 200, iron: 2.6, vit_a: 0, thia: 0.07, ribo: 0.17, nia: 4.8, vit_c: 0 },
  { food_item: 'Egg, chicken, whole, raw', alt_name: 'Itlog', category: 'Protein', edible_portion: 88, energy: 143, protein: 12.6, fat: 9.5, carb: 0.7, calcium: 50, phos: 198, iron: 1.8, vit_a: 160, thia: 0.07, ribo: 0.48, nia: 0.1, vit_c: 0 },
  { food_item: 'Tilapia, raw', alt_name: 'Tilapia', category: 'Protein', edible_portion: 60, energy: 96, protein: 20.1, fat: 1.7, carb: 0, calcium: 10, phos: 170, iron: 0.7, vit_a: 0, thia: 0.04, ribo: 0.06, nia: 3.9, vit_c: 0 },
  { food_item: 'Bangus, milkfish, raw', alt_name: 'Bangus', category: 'Protein', edible_portion: 60, energy: 148, protein: 20.5, fat: 6.7, carb: 0, calcium: 51, phos: 162, iron: 0.3, vit_a: 30, thia: 0.01, ribo: 0.07, nia: 6.4, vit_c: 0 },
  { food_item: 'Shrimp, raw', alt_name: 'Hipon', category: 'Protein', edible_portion: 65, energy: 71, protein: 13.6, fat: 1.0, carb: 0.9, calcium: 54, phos: 244, iron: 2.4, vit_a: 0, thia: 0.02, ribo: 0.03, nia: 2.6, vit_c: 0 },

  // ── Proteins (plant) ─────────────────────────────────────
  { food_item: 'Tofu, firm', alt_name: 'Tokwa', category: 'Protein', edible_portion: 100, energy: 144, protein: 17.3, fat: 8.7, carb: 2.8, calcium: 350, phos: 190, iron: 2.7, vit_a: 0, thia: 0.16, ribo: 0.10, nia: 0.4, vit_c: 0 },
  { food_item: 'Mungbean, dry', alt_name: 'Mongo', category: 'Protein', edible_portion: 100, energy: 347, protein: 23.9, fat: 1.2, carb: 62.6, calcium: 132, phos: 367, iron: 6.7, vit_a: 6, thia: 0.62, ribo: 0.23, nia: 2.3, vit_c: 5 },
  { food_item: 'Peanut, raw', alt_name: 'Mani', category: 'Protein', edible_portion: 100, energy: 567, protein: 25.8, fat: 49.2, carb: 16.1, calcium: 92, phos: 376, iron: 4.6, vit_a: 0, thia: 0.64, ribo: 0.13, nia: 12.1, vit_c: 0 },

  // ── Vegetables ────────────────────────────────────────────
  { food_item: 'Kangkong, raw', alt_name: 'Water spinach', category: 'Vegetable', edible_portion: 70, energy: 19, protein: 2.6, fat: 0.2, carb: 3.1, calcium: 77, phos: 39, iron: 1.7, vit_a: 6300, thia: 0.03, ribo: 0.10, nia: 0.9, vit_c: 55 },
  { food_item: 'Malunggay leaves, raw', alt_name: 'Moringa', category: 'Vegetable', edible_portion: 50, energy: 64, protein: 9.4, fat: 1.4, carb: 8.3, calcium: 185, phos: 112, iron: 4.0, vit_a: 7560, thia: 0.26, ribo: 0.66, nia: 2.2, vit_c: 220 },
  { food_item: 'Tomato, raw', alt_name: 'Kamatis', category: 'Vegetable', edible_portion: 99, energy: 18, protein: 0.9, fat: 0.2, carb: 3.9, calcium: 10, phos: 24, iron: 0.3, vit_a: 833, thia: 0.04, ribo: 0.02, nia: 0.6, vit_c: 14 },
  { food_item: 'Onion, red, raw', alt_name: 'Sibuyas', category: 'Vegetable', edible_portion: 90, energy: 40, protein: 1.1, fat: 0.1, carb: 9.3, calcium: 23, phos: 29, iron: 0.2, vit_a: 0, thia: 0.05, ribo: 0.03, nia: 0.1, vit_c: 7 },
  { food_item: 'Garlic, raw', alt_name: 'Bawang', category: 'Vegetable', edible_portion: 87, energy: 149, protein: 6.4, fat: 0.5, carb: 33.1, calcium: 181, phos: 153, iron: 1.7, vit_a: 0, thia: 0.20, ribo: 0.11, nia: 0.7, vit_c: 31 },
  { food_item: 'Carrot, raw', alt_name: 'Karot', category: 'Vegetable', edible_portion: 90, energy: 41, protein: 0.9, fat: 0.2, carb: 9.6, calcium: 33, phos: 35, iron: 0.3, vit_a: 16700, thia: 0.07, ribo: 0.06, nia: 1.0, vit_c: 6 },
  { food_item: 'Eggplant, raw', alt_name: 'Talong', category: 'Vegetable', edible_portion: 85, energy: 25, protein: 1.0, fat: 0.2, carb: 5.9, calcium: 9, phos: 24, iron: 0.2, vit_a: 23, thia: 0.04, ribo: 0.04, nia: 0.6, vit_c: 2 },
  { food_item: 'Squash, raw', alt_name: 'Kalabasa', category: 'Vegetable', edible_portion: 76, energy: 26, protein: 1.0, fat: 0.1, carb: 6.5, calcium: 21, phos: 44, iron: 0.8, vit_a: 8500, thia: 0.05, ribo: 0.11, nia: 0.6, vit_c: 9 },
  { food_item: 'Cabbage, raw', alt_name: 'Repolyo', category: 'Vegetable', edible_portion: 80, energy: 25, protein: 1.3, fat: 0.1, carb: 5.8, calcium: 40, phos: 26, iron: 0.5, vit_a: 98, thia: 0.06, ribo: 0.04, nia: 0.2, vit_c: 36 },

  // ── Fruits ────────────────────────────────────────────────
  { food_item: 'Mango, ripe, raw', alt_name: 'Mangga', category: 'Fruit', edible_portion: 67, energy: 60, protein: 0.8, fat: 0.4, carb: 15.0, calcium: 11, phos: 14, iron: 0.2, vit_a: 1262, thia: 0.03, ribo: 0.04, nia: 0.7, vit_c: 36 },
  { food_item: 'Banana, ripe, raw', alt_name: 'Saging', category: 'Fruit', edible_portion: 65, energy: 89, protein: 1.1, fat: 0.3, carb: 22.8, calcium: 5, phos: 22, iron: 0.3, vit_a: 64, thia: 0.03, ribo: 0.07, nia: 0.7, vit_c: 9 },
  { food_item: 'Papaya, ripe, raw', alt_name: 'Papaya', category: 'Fruit', edible_portion: 75, energy: 43, protein: 0.5, fat: 0.3, carb: 10.8, calcium: 20, phos: 10, iron: 0.3, vit_a: 950, thia: 0.02, ribo: 0.03, nia: 0.4, vit_c: 60 },
  { food_item: 'Calamansi, raw', alt_name: 'Calamansi', category: 'Fruit', edible_portion: 60, energy: 37, protein: 0.9, fat: 0.4, carb: 9.3, calcium: 40, phos: 27, iron: 0.4, vit_a: 26, thia: 0.04, ribo: 0.02, nia: 0.2, vit_c: 53 },

  // ── Dairy ─────────────────────────────────────────────────
  { food_item: 'Milk, cow, whole, fluid', alt_name: 'Gatas', category: 'Dairy', edible_portion: 100, energy: 61, protein: 3.2, fat: 3.3, carb: 4.8, calcium: 113, phos: 84, iron: 0.0, vit_a: 162, thia: 0.04, ribo: 0.18, nia: 0.1, vit_c: 0 },
  { food_item: 'Cheese, cheddar', alt_name: 'Keso', category: 'Dairy', edible_portion: 100, energy: 403, protein: 24.9, fat: 33.1, carb: 1.3, calcium: 721, phos: 512, iron: 0.7, vit_a: 1002, thia: 0.03, ribo: 0.38, nia: 0.1, vit_c: 0 },

  // ── Fats / Oils ───────────────────────────────────────────
  { food_item: 'Coconut oil', alt_name: 'Mantika ng niyog', category: 'Fat', edible_portion: 100, energy: 862, protein: 0, fat: 100, carb: 0, calcium: 0, phos: 0, iron: 0, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Olive oil', category: 'Fat', edible_portion: 100, energy: 884, protein: 0, fat: 100, carb: 0, calcium: 1, phos: 0, iron: 0.6, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Butter, salted', alt_name: 'Mantikilya', category: 'Dairy', edible_portion: 100, energy: 717, protein: 0.9, fat: 81.1, carb: 0.1, calcium: 24, phos: 24, iron: 0.0, vit_a: 2499, thia: 0.01, ribo: 0.03, nia: 0.0, vit_c: 0 },

  // ── Spices / Condiments ───────────────────────────────────
  { food_item: 'Salt, iodized', alt_name: 'Asin', category: 'Spice', edible_portion: 100, energy: 0, protein: 0, fat: 0, carb: 0, calcium: 24, phos: 0, iron: 0.3, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Soy sauce', alt_name: 'Toyo', category: 'Spice', edible_portion: 100, energy: 53, protein: 8.1, fat: 0.6, carb: 4.9, calcium: 17, phos: 130, iron: 1.4, vit_a: 0, thia: 0.06, ribo: 0.15, nia: 4.0, vit_c: 0 },
  { food_item: 'Vinegar, white', alt_name: 'Suka', category: 'Spice', edible_portion: 100, energy: 18, protein: 0, fat: 0, carb: 0.9, calcium: 6, phos: 4, iron: 0.0, vit_a: 0, thia: 0, ribo: 0, nia: 0, vit_c: 0 },
  { food_item: 'Ginger, raw', alt_name: 'Luya', category: 'Spice', edible_portion: 90, energy: 80, protein: 1.8, fat: 0.8, carb: 17.8, calcium: 16, phos: 34, iron: 0.6, vit_a: 0, thia: 0.03, ribo: 0.03, nia: 0.8, vit_c: 5 },
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
