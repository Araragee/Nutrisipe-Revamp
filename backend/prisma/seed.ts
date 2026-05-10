import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const POST_CATEGORIES = {
  RECIPE: 'recipe',
  MEAL_PHOTO: 'meal_photo',
  NUTRITION_TIP: 'nutrition_tip',
  COOKING_TECHNIQUE: 'cooking_technique',
}

const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
  'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
  'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Jackson', 'Avery', 'Sebastian',
  'Ella', 'Aiden', 'Scarlett', 'David', 'Grace', 'Joseph', 'Chloe', 'Samuel', 'Victoria', 'Carter',
  'Riley', 'Owen', 'Aria', 'Wyatt', 'Lily', 'John', 'Aubrey', 'Jack', 'Zoey', 'Luke'
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
]

const CATEGORY_POSTS: Record<string, { titles: string[]; tags: string[]; descriptions: string[] }> = {
  recipe: {
    titles: [
      'Spicy Thai Green Curry', 'Lemon Herb Grilled Chicken', 'Vegan Buddha Bowl',
      'Classic Italian Carbonara', 'Mediterranean Quinoa Salad', 'Honey Garlic Salmon',
      'Mexican Street Tacos', 'Creamy Mushroom Risotto', 'Korean Bibimbap',
      'Japanese Teriyaki Bowl', 'Greek Chicken Souvlaki', 'Indian Butter Chicken',
      'Vietnamese Pho', 'Spanish Paella', 'French Ratatouille',
    ],
    tags: ['healthy', 'dinner', 'high-protein', 'meal-prep', 'gluten-free', 'easy'],
    descriptions: [
      'Restaurant-quality dish you can make at home in under an hour.',
      'Family-favorite comfort food with a healthy twist.',
      'Bold flavors, simple ingredients, weeknight-friendly.',
    ],
  },
  meal_photo: {
    titles: [
      'Sunrise Breakfast Bowl', 'Avocado Toast Stack', 'Rainbow Smoothie Bowl',
      'Charcuterie Board Spread', 'Pasta Night Plating', 'Fresh Garden Salad',
      'Berry Yogurt Parfait', 'Steak & Roasted Veggies', 'Brunch Pancake Tower',
      'Sushi Platter', 'Espresso & Croissant', 'Poke Bowl Assembly',
      'Roast Chicken Dinner', 'Taco Tuesday Spread', 'Holiday Feast Plate',
    ],
    tags: ['plating', 'foodie', 'photography', 'aesthetic', 'lifestyle'],
    descriptions: [
      'My latest plate — proud of how this turned out.',
      'Caught the lighting just right today.',
      'When a meal looks too good to eat. Almost.',
    ],
  },
  nutrition_tip: {
    titles: [
      'Why Protein Timing Actually Matters', 'Reading Nutrition Labels Like a Pro',
      'Hidden Sugars in "Healthy" Foods', 'Macros Demystified for Beginners',
      'Hydration Beyond Just Water', 'Fiber: The Forgotten Macronutrient',
      'Pre-Workout Fuel That Actually Works', 'Post-Workout Recovery Plate',
      'Iron Sources for Plant-Based Eaters', 'Calcium Without Dairy',
      'Omega-3s: Why They Matter', 'Sodium Limits & Smart Swaps',
      'Healthy Fats Worth Eating', 'Glycemic Index in Plain English',
      'Meal Timing for Better Sleep',
    ],
    tags: ['nutrition', 'education', 'wellness', 'science', 'health'],
    descriptions: [
      'Quick breakdown of what the research actually says.',
      'Learned this the hard way — sharing so you don\'t have to.',
      'Bookmark this — comes up every week.',
    ],
  },
  cooking_technique: {
    titles: [
      'Mastering the Maillard Reaction', 'How to Properly Sear a Steak',
      'Knife Skills: Julienne in 60 Seconds', 'Emulsifying a Perfect Vinaigrette',
      'Resting Meat: Why It Matters', 'Blooming Spices for Maximum Flavor',
      'Tempering Eggs Without Curdling', 'Deglazing for Pan Sauces',
      'Sous Vide for Beginners', 'Bread Scoring Basics',
      'Reverse-Sear Method Explained', 'Caramelizing Onions Properly',
      'Brining 101: Wet vs Dry', 'Tempering Chocolate at Home',
      'Stir-Fry Wok Hei Technique',
    ],
    tags: ['technique', 'skills', 'tutorial', 'fundamentals', 'pro-tips'],
    descriptions: [
      'Game-changing technique once you nail the timing.',
      'Pro chef move that elevates home cooking.',
      'Took me years to learn — here\'s the shortcut.',
    ],
  },
}

const CATEGORY_IMAGES: Record<string, string[]> = {
  recipe: [
    'photo-1546069901-ba9599a7e63c', 'photo-1565299624946-b28f40a0ae38',
    'photo-1567620905732-2d1ec7ab7445', 'photo-1559847844-5315695dadae',
    'photo-1540420773420-3366772f4999', 'photo-1551183053-bf91a1d81141',
    'photo-1473093295043-cdd812d0e601', 'photo-1490645935967-10de6ba17061',
    'photo-1504674900247-0877df9cc836', 'photo-1512621776951-a57141f2eefd',
    'photo-1546554137-f86b9593a222', 'photo-1565958011703-44f9829ba187',
    'photo-1604908176997-125f25cc6f3d', 'photo-1547592180-85f173990554',
    'photo-1495521821757-a1efb6729352',
  ],
  meal_photo: [
    'photo-1484723091739-30a097e8f929', 'photo-1525351484163-7529414344d8',
    'photo-1482049016688-2d3e1b311543', 'photo-1493770348161-369560ae357d',
    'photo-1551782450-a2132b4ba21d', 'photo-1540189549336-e6e99c3679fe',
    'photo-1470337458703-46ad1756a187', 'photo-1606756790138-261d2b21cd75',
    'photo-1528207776546-365bb710ee93', 'photo-1579584425555-c3ce17fd4351',
    'photo-1495474472287-4d71bcdd2085', 'photo-1546069901-d5bfd2cbfb1f',
    'photo-1467003909585-2f8a72700288', 'photo-1565895405229-71bfa49b46d7',
    'photo-1551404973-761c83cd8339',
  ],
  nutrition_tip: [
    'photo-1490818387583-1baba5e638af', 'photo-1505253758473-96b7015fcd40',
    'photo-1498837167922-ddd27525d352', 'photo-1512621776951-a57141f2eefd',
    'photo-1543362906-acfc16c67564', 'photo-1610348725531-843dff563e2c',
    'photo-1576045057995-568f588f82fb', 'photo-1457301547464-91995555cd25',
    'photo-1484980972926-edee96e0960d', 'photo-1564834744159-ff0ea41ba4b9',
    'photo-1488477181946-6428a0291777', 'photo-1471193945509-9ad0617afabf',
    'photo-1502741338009-cac2772e18bc', 'photo-1542838132-92c53300491e',
    'photo-1573246123716-6b1782bfc499',
  ],
  cooking_technique: [
    'photo-1556909114-f6e7ad7d3136', 'photo-1556909172-54557c7e4fb7',
    'photo-1551218372-a8789b81b253', 'photo-1607330289024-1535c6b4e1c1',
    'photo-1574484284002-952d92456975', 'photo-1466637574441-749b8f19452f',
    'photo-1556910103-1c02745aae4d', 'photo-1606755962773-d324e0a13086',
    'photo-1493711662062-fa541adb3fc8', 'photo-1556910096-6f5e72db6803',
    'photo-1555939594-58d7cb561ad1', 'photo-1543339494-b4cd4f7ba686',
    'photo-1572441713132-c542fc4fe282', 'photo-1495195134817-aeb325a55b65',
    'photo-1485963631004-f2f00b1d6606',
  ],
}

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  console.log('🌱 Starting optimized seed...')

  console.log('🧹 Cleaning database...')
  await prisma.recipeVariation.deleteMany()
  await prisma.rating.deleteMany()
  await prisma.mention.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.collectionPost.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.report.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.save.deleteMany()
  await prisma.like.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.recipe.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  console.log('👥 Preparing users...')
  const usersData = []
  
  // Fixed Admin
  const adminId = randomUUID()
  await prisma.user.create({
    data: {
      id: adminId,
      username: 'admin',
      email: 'admin@nutrisipe.com',
      passwordHash,
      displayName: 'Nutrisipe Admin',
      avatarUrl: 'https://i.pravatar.cc/150?u=admin',
      bio: 'Nutrisipe System Administrator',
      role: 'ADMIN',
      preferences: {
        create: {
          cuisines: JSON.stringify(['Italian', 'Mediterranean']),
          dietary: JSON.stringify(['Gluten-Free']),
          allergies: JSON.stringify([]),
        }
      }
    }
  })
  usersData.push({ id: adminId, username: 'admin' })

  for (let i = 0; i < 49; i++) {
    const firstName = randomElement(FIRST_NAMES)
    const lastName = randomElement(LAST_NAMES)
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i + 1}`
    const userId = randomUUID()
    await prisma.user.create({
      data: {
        id: userId,
        username,
        email: `${username}@nutrisipe.com`,
        passwordHash,
        displayName: `${firstName} ${lastName}`,
        avatarUrl: `https://i.pravatar.cc/150?u=${username}`,
        bio: i % 3 === 0 ? 'Food enthusiast and home cook.' : null,
        role: 'USER',
        preferences: {
          create: {
            cuisines: JSON.stringify(randomElements(['Italian', 'Mexican', 'Asian', 'Mediterranean', 'American'], randomInt(1, 3))),
            dietary: JSON.stringify(randomElements(['Vegan', 'Keto', 'Gluten-Free', 'Low-Carb'], randomInt(0, 2))),
            allergies: JSON.stringify(randomElements(['Nuts', 'Dairy', 'Soy', 'Shellfish'], randomInt(0, 1))),
          }
        }
      }
    })
    usersData.push({ id: userId, username })
  }

  console.log(`✅ Created ${usersData.length} users`)

  const categoryKeys = Object.keys(CATEGORY_POSTS) as Array<keyof typeof CATEGORY_POSTS>
  const POSTS_PER_CATEGORY = 15
  const totalPosts = categoryKeys.length * POSTS_PER_CATEGORY
  console.log(`📝 Preparing ${totalPosts} posts (${POSTS_PER_CATEGORY} per category)...`)

  let postIndex = 0
  for (const categoryKey of categoryKeys) {
    const cfg = CATEGORY_POSTS[categoryKey]
    const images = CATEGORY_IMAGES[categoryKey]

    for (let i = 0; i < POSTS_PER_CATEGORY; i++) {
      const postId = randomUUID()
      const user = randomElement(usersData)
      const title = cfg.titles[i % cfg.titles.length]
      const photoId = images[i % images.length]
      const width = 800
      const heights = [1000, 1100, 1200, 900, 1050]
      const height = heights[postIndex % heights.length]
      const imageUrl = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=80&sig=${postIndex}`
      const isRecipeCategory = categoryKey === 'recipe'

      await prisma.post.create({
        data: {
          id: postId,
          userId: user.id,
          title,
          description: randomElement(cfg.descriptions),
          imageUrl,
          category: categoryKey,
          tags: JSON.stringify(randomElements(cfg.tags, randomInt(2, 4))),
          createdAt: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000),
          recipe: isRecipeCategory ? {
            create: {
              servings: randomInt(2, 6),
              prepTime: randomInt(5, 25),
              cookTime: randomInt(10, 60),
              difficulty: randomElement(DIFFICULTIES),
              ingredients: JSON.stringify([
                { name: 'Olive oil', qty: '2 tbsp' },
                { name: 'Garlic', qty: '3 cloves, minced' },
                { name: 'Onion', qty: '1 medium, diced' },
                { name: 'Fresh herbs', qty: 'to taste' },
                { name: 'Sea salt', qty: '1 tsp' },
              ]),
              instructions: JSON.stringify([
                { step: 1, text: 'Mise en place — prep and measure all ingredients.' },
                { step: 2, text: 'Heat oil in pan over medium-high heat.' },
                { step: 3, text: 'Add aromatics, cook until fragrant (~2 min).' },
                { step: 4, text: 'Add main ingredients, cook through.' },
                { step: 5, text: 'Season, plate, and serve immediately.' },
              ]),
              nutrition: JSON.stringify({
                calories: randomInt(280, 720).toString(),
                protein: randomInt(15, 45).toString(),
                carbs: randomInt(20, 70).toString(),
                fat: randomInt(8, 30).toString(),
                fiber: randomInt(2, 12).toString(),
              }),
            },
          } : undefined,
        },
      })
      postIndex++
    }
  }

  console.log(`✅ Created ${totalPosts} posts across ${categoryKeys.length} categories`)

  console.log('🤝 Creating follows...')
  for (const user of usersData) {
    const targets = randomElements(usersData.filter(u => u.id !== user.id), randomInt(3, 8))
    for (const target of targets) {
      try {
        await prisma.follow.create({
          data: { followerId: user.id, followingId: target.id }
        })
      } catch (e) {
        // Skip duplicates
      }
    }
  }

  console.log('❤️ Creating engagement...')
  const allPosts = await prisma.post.findMany({ select: { id: true } })
  for (const user of usersData) {
      const randomPosts = randomElements(allPosts, randomInt(5, 15))
      for (const post of randomPosts) {
          try {
              await prisma.like.create({
                  data: { userId: user.id, postId: post.id }
              })
          } catch (e) {
              // Skip duplicates
          }
      }
  }

  console.log('\n🎉 Seed completed successfully!')
  console.log(`\n🔑 Login with: admin@nutrisipe.com / password123`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
