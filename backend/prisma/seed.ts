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

const RECIPE_TITLES = [
  'Spicy Thai Green Curry', 'Lemon Herb Grilled Chicken', 'Vegan Buddha Bowl', 'Classic Italian Carbonara',
  'Mediterranean Quinoa Salad', 'Honey Garlic Salmon', 'Mexican Street Tacos', 'Creamy Mushroom Risotto',
  'Korean Bibimbap', 'Japanese Teriyaki Bowl', 'Greek Chicken Souvlaki', 'Indian Butter Chicken',
  'Vietnamese Pho', 'Spanish Paella', 'French Ratatouille', 'American BBQ Ribs', 'Thai Pad Thai',
  'Italian Caprese Salad', 'Middle Eastern Falafel', 'Chinese Kung Pao Chicken'
]

const TAGS = [
  'healthy', 'quick', 'easy', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'high-protein', 'low-carb', 'keto', 'paleo', 'meal-prep', 'dinner'
]

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
      }
    })
    usersData.push({ id: userId, username })
  }

  console.log(`✅ Created ${usersData.length} users`)

  console.log('📝 Preparing 150 posts and recipes...')
  
  for (let i = 0; i < 150; i++) {
    const postId = randomUUID()
    const user = randomElement(usersData)
    const isRecipe = Math.random() > 0.3
    const category = isRecipe ? POST_CATEGORIES.RECIPE : POST_CATEGORIES.MEAL_PHOTO
    const title = isRecipe ? randomElement(RECIPE_TITLES) : 'Delicious Meal'

    await prisma.post.create({
      data: {
        id: postId,
        userId: user.id,
        title,
        description: 'A wonderful meal shared on Nutrisipe.',
        imageUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80&sig=${i}`,
        category,
        tags: JSON.stringify(randomElements(TAGS, randomInt(2, 4))),
        createdAt: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000),
        recipe: isRecipe ? {
          create: {
            servings: randomInt(1, 4),
            prepTime: randomInt(5, 20),
            cookTime: randomInt(10, 45),
            difficulty: randomElement(['Easy', 'Medium']),
            ingredients: JSON.stringify([
              { name: 'Fresh Ingredients', qty: 'as needed' },
              { name: 'Olive Oil', qty: '2 tbsp' }
            ]),
            instructions: JSON.stringify([
              { step: 1, text: 'Clean and prep all ingredients.' },
              { step: 2, text: 'Cook thoroughly and enjoy!' }
            ]),
            nutrition: JSON.stringify({
              calories: randomInt(300, 600).toString(),
              protein: randomInt(15, 30).toString(),
              carbs: randomInt(30, 60).toString(),
              fat: randomInt(10, 25).toString()
            })
          }
        } : undefined
      }
    })
  }
  
  console.log(`✅ Created 150 posts and recipes`)

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
