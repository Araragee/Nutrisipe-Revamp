import { prisma } from '../lib/prisma'
import { transformPost } from '../utils/modelTransformer'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface CreateInput {
  postId: string
  date: Date
  slot: MealSlot
  servings?: number
  notes?: string
}

interface UpdateInput {
  date?: Date
  slot?: MealSlot
  servings?: number
  notes?: string
}

const POST_INCLUDE = {
  post: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      recipe: true,
    },
  },
}

function shapePlan(plan: any) {
  const post = plan.post ? transformPost(plan.post) : null
  return {
    id: plan.id,
    userId: plan.userId,
    postId: plan.postId,
    date: plan.date,
    slot: plan.slot,
    servings: plan.servings,
    notes: plan.notes,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    post,
  }
}

export async function listPlans(userId: string, from: Date, to: Date) {
  const plans = await prisma.mealPlan.findMany({
    where: { userId, date: { gte: from, lte: to } },
    orderBy: [{ date: 'asc' }, { slot: 'asc' }],
    include: POST_INCLUDE,
  })
  return plans.map(shapePlan)
}

export async function createPlan(userId: string, data: CreateInput) {
  const plan = await prisma.mealPlan.create({
    data: {
      userId,
      postId: data.postId,
      date: data.date,
      slot: data.slot,
      servings: data.servings ?? 2,
      notes: data.notes,
    },
    include: POST_INCLUDE,
  })
  return shapePlan(plan)
}

export async function updatePlan(userId: string, id: string, data: UpdateInput) {
  const existing = await prisma.mealPlan.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    throw new Error('Plan not found')
  }
  const plan = await prisma.mealPlan.update({
    where: { id },
    data,
    include: POST_INCLUDE,
  })
  return shapePlan(plan)
}

export async function deletePlan(userId: string, id: string) {
  const existing = await prisma.mealPlan.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    throw new Error('Plan not found')
  }
  await prisma.mealPlan.delete({ where: { id } })
  return { success: true }
}

interface AggregatedItem {
  name: string
  quantities: string[]
  fromPosts: { postId: string; title: string; servings: number; baseServings: number | null }[]
}

interface ParsedQty {
  value: number | null
  unit: string
}

const FRACTION_MAP: Record<string, number> = {
  '1/2': 0.5,
  '1/3': 1 / 3,
  '2/3': 2 / 3,
  '1/4': 0.25,
  '3/4': 0.75,
  '1/8': 0.125,
}

function parseQuantity(raw: string): ParsedQty {
  if (!raw) return { value: null, unit: '' }
  const trimmed = raw.trim()
  const m = trimmed.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.\d+|\d+)\s*(.*)$/)
  if (!m) return { value: null, unit: trimmed }
  const numPart = m[1]
  const unit = (m[2] || '').trim()
  let value: number
  if (/^\d+\s+\d+\/\d+$/.test(numPart)) {
    const [whole, frac] = numPart.split(/\s+/)
    value = parseInt(whole, 10) + (FRACTION_MAP[frac] ?? evalFrac(frac))
  } else if (/^\d+\/\d+$/.test(numPart)) {
    value = FRACTION_MAP[numPart] ?? evalFrac(numPart)
  } else {
    value = parseFloat(numPart)
  }
  if (isNaN(value)) return { value: null, unit: trimmed }
  return { value, unit }
}

function evalFrac(s: string): number {
  const [n, d] = s.split('/').map(Number)
  return d ? n / d : NaN
}

function formatNumber(v: number): string {
  if (Math.abs(v - Math.round(v)) < 0.01) return String(Math.round(v))
  return (Math.round(v * 100) / 100).toString()
}

type Category =
  | 'produce'
  | 'protein'
  | 'dairy'
  | 'grain'
  | 'pantry'
  | 'frozen'
  | 'beverage'
  | 'spice'
  | 'other'

const CATEGORY_KEYWORDS: Array<{ category: Category; words: string[] }> = [
  {
    category: 'produce',
    words: [
      'tomato', 'kamatis', 'onion', 'sibuyas', 'garlic', 'bawang', 'lettuce', 'spinach', 'kale',
      'kangkong', 'malunggay', 'carrot', 'karot', 'celery', 'bell pepper', 'green pepper',
      'red pepper', 'capsicum', 'sili', 'cucumber',
      'pipino', 'eggplant', 'talong', 'squash', 'kalabasa', 'broccoli', 'cauliflower', 'cabbage',
      'repolyo', 'mushroom', 'avocado', 'ginger', 'luya', 'lemon', 'lime', 'calamansi', 'lemongrass',
      'banana', 'saging', 'apple', 'mango', 'mangga', 'orange', 'berry', 'papaya', 'pineapple',
      'pinya', 'corn', 'mais', 'potato', 'patatas', 'sweet potato', 'kamote', 'radish',
      'labanos', 'okra', 'sayote', 'bean sprout', 'togue', 'cilantro', 'parsley', 'basil',
      'mint', 'dahon',
    ],
  },
  {
    category: 'protein',
    words: [
      'chicken', 'manok', 'beef', 'baka', 'pork', 'baboy', 'lamb', 'fish', 'isda', 'tilapia',
      'bangus', 'salmon', 'tuna', 'shrimp', 'hipon', 'crab', 'alimango', 'squid', 'pusit',
      'tofu', 'tokwa', 'egg', 'itlog', 'sausage', 'longganisa', 'bacon', 'ham', 'mongo',
      'mung bean', 'lentil', 'chickpea', 'tempeh', 'peanut', 'mani',
    ],
  },
  {
    category: 'dairy',
    words: [
      'milk', 'gatas', 'cheese', 'keso', 'butter', 'mantikilya', 'yogurt', 'cream', 'condensed',
      'evaporated', 'mozzarella', 'parmesan', 'cheddar', 'ricotta', 'kesong puti',
    ],
  },
  {
    category: 'grain',
    words: [
      'rice', 'bigas', 'kanin', 'flour', 'harina', 'bread', 'tinapay', 'pasta', 'noodle',
      'pancit', 'oat', 'quinoa', 'tortilla', 'crouton', 'cereal', 'cornstarch', 'gawgaw',
    ],
  },
  {
    category: 'pantry',
    words: [
      'sugar', 'asukal', 'salt', 'asin', 'oil', 'mantika', 'vinegar', 'suka', 'soy sauce',
      'toyo', 'fish sauce', 'patis', 'oyster sauce', 'sesame oil', 'olive', 'honey', 'pulut-pukyutan',
      'syrup', 'baking', 'yeast', 'stock', 'broth', 'sabaw', 'tomato sauce', 'tomato paste',
      'ketchup', 'mayonnaise', 'mustard', 'sriracha', 'gata', 'coconut milk', 'condensed milk',
    ],
  },
  {
    category: 'frozen',
    words: ['frozen', 'ice cream', 'sorbet', 'gelato'],
  },
  {
    category: 'beverage',
    words: ['water', 'tubig', 'juice', 'soda', 'coffee', 'kape', 'tea', 'tsaa', 'wine', 'beer'],
  },
  {
    category: 'spice',
    words: [
      'black pepper', 'white pepper', 'peppercorn', 'pepper flake', 'paminta', 'cumin',
      'paprika', 'turmeric', 'luyang dilaw', 'cinnamon', 'cloves', 'nutmeg', 'oregano',
      'basil', 'thyme', 'rosemary', 'sage', 'bay leaf', 'laurel', 'chili', 'curry', 'msg', 'vetsin',
    ],
  },
]

const CATEGORY_LABEL: Record<Category, string> = {
  produce: 'Produce',
  protein: 'Protein',
  dairy: 'Dairy',
  grain: 'Grains',
  pantry: 'Pantry',
  frozen: 'Frozen',
  beverage: 'Beverages',
  spice: 'Spices',
  other: 'Other',
}

const CATEGORY_ORDER: Category[] = [
  'produce',
  'protein',
  'dairy',
  'grain',
  'pantry',
  'frozen',
  'beverage',
  'spice',
  'other',
]

export function classify(name: string): Category {
  const haystack = name.toLowerCase()
  // Longest-match wins — prevents short keywords (e.g. 'corn') from
  // shadowing more-specific ones (e.g. 'peppercorn', 'cornstarch').
  let best: { category: Category; len: number } | null = null
  for (const { category, words } of CATEGORY_KEYWORDS) {
    for (const word of words) {
      if (haystack.includes(word) && word.length > (best?.len ?? 0)) {
        best = { category, len: word.length }
      }
    }
  }
  return best?.category ?? 'other'
}

export async function getGroceryList(userId: string, from: Date, to: Date) {
  const plans = await prisma.mealPlan.findMany({
    where: { userId, date: { gte: from, lte: to } },
    include: {
      post: { include: { recipe: true } },
    },
  })

  type Bucket = Record<string, AggregatedItem>
  const buckets: Bucket = {}

  for (const plan of plans) {
    const recipe = plan.post?.recipe
    if (!recipe) continue
    let ingredients: any[] = []
    try {
      const raw = JSON.parse(recipe.ingredients)
      if (Array.isArray(raw)) ingredients = raw
    } catch {
      continue
    }
    const baseServings = recipe.servings
    const factor = baseServings && baseServings > 0 ? plan.servings / baseServings : 1

    for (const ing of ingredients) {
      const name = (ing.name ?? '').trim()
      if (!name) continue
      const qtyStr = (ing.quantity ?? '').trim()
      const parsed = parseQuantity(qtyStr)
      const key = `${name.toLowerCase()}|${parsed.unit.toLowerCase()}`

      if (!buckets[key]) {
        buckets[key] = {
          name,
          quantities: [],
          fromPosts: [],
        }
      }

      if (parsed.value != null) {
        const scaled = parsed.value * factor
        buckets[key].quantities.push(
          parsed.unit ? `${formatNumber(scaled)} ${parsed.unit}` : formatNumber(scaled),
        )
      } else if (qtyStr) {
        buckets[key].quantities.push(qtyStr)
      }

      buckets[key].fromPosts.push({
        postId: plan.postId,
        title: plan.post?.title ?? '',
        servings: plan.servings,
        baseServings: recipe.servings,
      })
    }
  }

  // Sum numeric quantities per (name, unit) + classify
  const items = Object.entries(buckets).map(([key, item]) => {
    const [, unit] = key.split('|')
    let total = 0
    let allNumeric = true
    for (const q of item.quantities) {
      const parsed = parseQuantity(q)
      if (parsed.value == null) {
        allNumeric = false
        break
      }
      total += parsed.value
    }

    const category = classify(item.name)

    return {
      name: item.name,
      unit,
      total: allNumeric ? formatNumber(total) : null,
      raw: item.quantities,
      sources: item.fromPosts,
      category,
      categoryLabel: CATEGORY_LABEL[category],
    }
  })

  items.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category)
    const bi = CATEGORY_ORDER.indexOf(b.category)
    if (ai !== bi) return ai - bi
    return a.name.localeCompare(b.name)
  })

  return {
    range: { from, to },
    items,
    planCount: plans.length,
    categoriesOrder: CATEGORY_ORDER,
    categoryLabels: CATEGORY_LABEL,
  }
}
