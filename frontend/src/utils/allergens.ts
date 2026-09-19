// NUTRITIONIST REVIEW: keyword lists are a first pass (English + common Filipino terms).
// Keys must match ALLERGENS in SettingsView.vue. Matching is whole-word, case-insensitive.
// ponytail: keyword match only, misses brand names / hidden sources — upgrade to per-ingredient allergen tags in the DB.
export const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  Gluten: ['wheat', 'flour', 'harina', 'bread', 'breadcrumbs', 'panko', 'pasta', 'spaghetti', 'noodles', 'pancit', 'miki', 'canton', 'bihon', 'barley', 'rye', 'soy sauce', 'toyo', 'pandesal', 'lumpia wrapper', 'wonton'],
  Dairy: ['milk', 'gatas', 'cheese', 'keso', 'butter', 'mantikilya', 'cream', 'yogurt', 'evaporated', 'condensed', 'kesong puti', 'ghee', 'whey'],
  Egg: ['egg', 'eggs', 'itlog', 'mayonnaise', 'mayo', 'balut', 'penoy', 'salted egg', 'itlog na maalat'],
  Soy: ['soy', 'soya', 'soy sauce', 'toyo', 'tofu', 'tokwa', 'taho', 'miso', 'edamame', 'tausi', 'taosi'],
  Sesame: ['sesame', 'linga', 'tahini'],
  'Tree nuts': ['almond', 'almonds', 'cashew', 'kasoy', 'walnut', 'walnuts', 'pili', 'pecan', 'pistachio', 'hazelnut', 'macadamia'],
  Peanut: ['peanut', 'peanuts', 'mani', 'peanut butter', 'kare-kare sauce'],
  Fish: ['fish', 'isda', 'patis', 'fish sauce', 'bagoong isda', 'tuyo', 'daing', 'tinapa', 'bangus', 'tilapia', 'galunggong', 'tuna', 'sardines', 'salmon', 'dilis', 'anchovy', 'anchovies'],
  Shellfish: ['shrimp', 'hipon', 'prawn', 'prawns', 'sugpo', 'crab', 'alimango', 'alimasag', 'lobster', 'squid', 'pusit', 'clam', 'clams', 'halaan', 'tahong', 'mussels', 'oyster', 'talaba', 'scallop', 'bagoong alamang', 'alamang', 'shrimp paste'],
}

export interface AllergenHit {
  allergen: string
  ingredients: string[]
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function detectAllergens(ingredientNames: string[], allergies: string[]): AllergenHit[] {
  return allergies.flatMap((allergen) => {
    const words = ALLERGEN_KEYWORDS[allergen]
    if (!words) return []
    const re = new RegExp(`\\b(${words.map(escape).join('|')})\\b`, 'i')
    const hits = ingredientNames.filter((n) => re.test(n))
    return hits.length ? [{ allergen, ingredients: hits }] : []
  })
}
