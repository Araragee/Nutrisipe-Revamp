import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

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
  'Spicy Thai Green Curry',
  'Lemon Herb Grilled Chicken',
  'Vegan Buddha Bowl',
  'Classic Italian Carbonara',
  'Mediterranean Quinoa Salad',
  'Honey Garlic Salmon',
  'Mexican Street Tacos',
  'Creamy Mushroom Risotto',
  'Korean Bibimbap',
  'Japanese Teriyaki Bowl',
  'Greek Chicken Souvlaki',
  'Indian Butter Chicken',
  'Vietnamese Pho',
  'Spanish Paella',
  'French Ratatouille',
  'American BBQ Ribs',
  'Thai Pad Thai',
  'Italian Caprese Salad',
  'Middle Eastern Falafel',
  'Chinese Kung Pao Chicken',
  'Moroccan Tagine',
  'Brazilian Feijoada',
  'Peruvian Ceviche',
  'Turkish Kebabs',
  'Lebanese Hummus Bowl',
  'Australian Meat Pie',
  'Caribbean Jerk Chicken',
  'Ethiopian Doro Wat',
  'German Schnitzel',
  'Swedish Meatballs',
  'Polish Pierogi',
  'Russian Borscht',
  'Hungarian Goulash',
  'Austrian Wiener Schnitzel',
  'Swiss Fondue',
  'Belgian Waffles',
  'Dutch Stroopwafel',
  'Norwegian Salmon',
  'Danish Smørrebrød',
  'Finnish Salmon Soup',
  'Icelandic Lamb Stew',
  'Portuguese Bacalhau',
  'Irish Stew',
  'Scottish Haggis',
  'English Fish and Chips',
  'Welsh Rarebit',
  'Cuban Sandwich',
  'Argentine Empanadas',
  'Chilean Sea Bass',
  'Uruguayan Asado'
]

const MEAL_PHOTO_TITLES = [
  'Weekend Brunch Spread',
  'Healthy Breakfast Bowl',
  'Sunday Roast Dinner',
  'Colorful Smoothie Bowl',
  'Homemade Pizza Night',
  'Fresh Summer Salad',
  'Cozy Soup and Bread',
  'Asian Fusion Platter',
  'Gourmet Burger Creation',
  'Elegant Dessert Plate',
  'Farm-to-Table Feast',
  'Meal Prep Sunday',
  'Date Night Dinner',
  'Kids Lunch Box Ideas',
  'Picnic Basket Delights'
]

const NUTRITION_TIP_TITLES = [
  'Benefits of Omega-3 Fatty Acids',
  'How to Read Nutrition Labels',
  'Plant-Based Protein Sources',
  'Importance of Hydration',
  'Superfoods You Should Eat',
  'Meal Timing for Energy',
  'Understanding Macronutrients',
  'Anti-Inflammatory Foods',
  'Gut Health and Probiotics',
  'Healthy Snack Ideas',
  'Portion Control Tips',
  'Benefits of Fiber',
  'Vitamin D Sources',
  'Iron-Rich Foods',
  'Calcium Beyond Dairy'
]

const COOKING_TECHNIQUE_TITLES = [
  'Perfect Knife Skills',
  'How to Sear Meat Properly',
  'Emulsification Technique',
  'Blanching Vegetables',
  'Making Perfect Pasta',
  'Bread Baking Basics',
  'Tempering Chocolate',
  'Stock Making 101',
  'Poaching Fish',
  'Caramelizing Onions'
]

const RECIPE_DESCRIPTIONS = [
  'A delicious and healthy meal that comes together in 30 minutes.',
  'Perfect for weeknight dinners or meal prep.',
  'This recipe is packed with flavor and nutrition.',
  'A family favorite that never disappoints.',
  'Simple ingredients, amazing results.',
  'Tried and tested recipe with 5-star reviews.',
  'A modern twist on a classic dish.',
  'Restaurant-quality meal you can make at home.',
  'Nutritionist-approved and incredibly tasty.',
  'Gluten-free and dairy-free option available.'
]

const TAGS = [
  'healthy', 'quick', 'easy', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'high-protein', 'low-carb', 'keto', 'paleo', 'meal-prep', 'dinner', 'lunch',
  'breakfast', 'snack', 'dessert', 'comfort-food', 'asian', 'italian', 'mexican',
  'mediterranean', 'indian', 'thai', 'japanese', 'chinese', 'french', 'american',
  'seafood', 'chicken', 'beef', 'pork', 'pasta', 'rice', 'salad', 'soup', 'stew'
]

const BIOS = [
  'Home cook sharing family recipes',
  'Passionate about healthy eating',
  'Food blogger and recipe developer',
  'Nutrition enthusiast',
  'Weekend warrior in the kitchen',
  'Plant-based chef',
  'Baking is my therapy',
  'Creating delicious memories',
  'Foodie and photographer',
  'Making cooking fun and easy'
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
  console.log('🌱 Starting seed...')

  console.log('🧹 Cleaning database...')
  await prisma.save.deleteMany()
  await prisma.like.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  console.log('👥 Creating 50 users...')
  const users = []

  for (let i = 0; i < 50; i++) {
    const firstName = randomElement(FIRST_NAMES)
    const lastName = randomElement(LAST_NAMES)
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i > 0 ? i : ''}`
    const email = `${username}@nutrisipe.com`

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName: `${firstName} ${lastName}`,
        avatarUrl: `https://i.pravatar.cc/150?u=${username}`,
        bio: i % 3 === 0 ? randomElement(BIOS) : null,
      },
    })
    users.push(user)
  }

  console.log(`✅ Created ${users.length} users`)

  console.log('📝 Creating 250 posts...')
  const posts = []
  const categoryWeights = [
    { category: POST_CATEGORIES.RECIPE, weight: 0.6 },
    { category: POST_CATEGORIES.MEAL_PHOTO, weight: 0.25 },
    { category: POST_CATEGORIES.NUTRITION_TIP, weight: 0.1 },
    { category: POST_CATEGORIES.COOKING_TECHNIQUE, weight: 0.05 },
  ]

  for (let i = 0; i < 250; i++) {
    const rand = Math.random()
    let cumulative = 0
    let selectedCategory = POST_CATEGORIES.RECIPE

    for (const { category, weight } of categoryWeights) {
      cumulative += weight
      if (rand < cumulative) {
        selectedCategory = category
        break
      }
    }

    let title = ''
    let imageQuery = 'food'

    switch (selectedCategory) {
      case POST_CATEGORIES.RECIPE:
        title = randomElement(RECIPE_TITLES)
        imageQuery = title.toLowerCase().replace(/ /g, '-')
        break
      case POST_CATEGORIES.MEAL_PHOTO:
        title = randomElement(MEAL_PHOTO_TITLES)
        imageQuery = 'meal,food'
        break
      case POST_CATEGORIES.NUTRITION_TIP:
        title = randomElement(NUTRITION_TIP_TITLES)
        imageQuery = 'nutrition,healthy'
        break
      case POST_CATEGORIES.COOKING_TECHNIQUE:
        title = randomElement(COOKING_TECHNIQUE_TITLES)
        imageQuery = 'cooking,kitchen'
        break
    }

    const user = randomElement(users)
    const postTags = randomElements(TAGS, randomInt(2, 5))
    const description = selectedCategory === POST_CATEGORIES.RECIPE
      ? randomElement(RECIPE_DESCRIPTIONS)
      : null

    const createdDaysAgo = randomInt(1, 90)
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - createdDaysAgo)

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        title,
        description,
        imageUrl: `https://source.unsplash.com/800x${randomInt(600, 1000)}/?${imageQuery}&sig=${i}`,
        category: selectedCategory,
        tags: postTags,
        createdAt,
      },
    })
    posts.push(post)
  }

  console.log(`✅ Created ${posts.length} posts`)

  console.log('🤝 Creating follows (each user follows 5-15 others)...')
  const followsToCreate = []
  const followSet = new Set()

  for (const user of users) {
    const numToFollow = randomInt(5, 15)
    const potentialFollows = users.filter(u => u.id !== user.id)
    const usersToFollow = randomElements(potentialFollows, numToFollow)

    for (const toFollow of usersToFollow) {
      const key = `${user.id}:${toFollow.id}`
      if (!followSet.has(key)) {
        followSet.add(key)
        followsToCreate.push({
          followerId: user.id,
          followingId: toFollow.id,
        })
      }
    }
  }

  await prisma.follow.createMany({ data: followsToCreate })
  console.log(`✅ Created ${followsToCreate.length} follows`)

  console.log('❤️ Creating likes (random engagement)...')
  const likesToCreate = []
  const likeSet = new Set()

  for (const post of posts) {
    const likersCount = randomInt(0, 50)
    const potentialLikers = users.filter(u => u.id !== post.userId)
    const likers = randomElements(potentialLikers, Math.min(likersCount, potentialLikers.length))

    for (const liker of likers) {
      const key = `${liker.id}:${post.id}`
      if (!likeSet.has(key)) {
        likeSet.add(key)
        likesToCreate.push({
          userId: liker.id,
          postId: post.id,
        })
      }
    }
  }

  await prisma.like.createMany({ data: likesToCreate })
  console.log(`✅ Created ${likesToCreate.length} likes`)

  console.log('🔖 Creating saves (random saves)...')
  const savesToCreate = []
  const saveSet = new Set()

  for (const post of posts) {
    const saversCount = randomInt(0, 30)
    const potentialSavers = users.filter(u => u.id !== post.userId)
    const savers = randomElements(potentialSavers, Math.min(saversCount, potentialSavers.length))

    for (const saver of savers) {
      const key = `${saver.id}:${post.id}`
      if (!saveSet.has(key)) {
        saveSet.add(key)
        savesToCreate.push({
          userId: saver.id,
          postId: post.id,
        })
      }
    }
  }

  await prisma.save.createMany({ data: savesToCreate })
  console.log(`✅ Created ${savesToCreate.length} saves`)

  console.log('🔢 Updating denormalized counts...')

  // Count likes and saves per post
  const postLikeCounts = new Map<string, number>()
  const postSaveCounts = new Map<string, number>()

  for (const like of likesToCreate) {
    postLikeCounts.set(like.postId, (postLikeCounts.get(like.postId) || 0) + 1)
  }

  for (const save of savesToCreate) {
    postSaveCounts.set(save.postId, (postSaveCounts.get(save.postId) || 0) + 1)
  }

  // Update posts in batch
  for (const post of posts) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        likeCount: postLikeCounts.get(post.id) || 0,
        saveCount: postSaveCounts.get(post.id) || 0,
      },
    })
  }

  // Count followers and following per user
  const userFollowerCounts = new Map<string, number>()
  const userFollowingCounts = new Map<string, number>()

  for (const follow of followsToCreate) {
    userFollowingCounts.set(follow.followerId, (userFollowingCounts.get(follow.followerId) || 0) + 1)
    userFollowerCounts.set(follow.followingId, (userFollowerCounts.get(follow.followingId) || 0) + 1)
  }

  // Update users in batch
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        followerCount: userFollowerCounts.get(user.id) || 0,
        followingCount: userFollowingCounts.get(user.id) || 0,
      },
    })
  }

  console.log('✅ Updated all counts')

  console.log('\n🎉 Seed completed successfully!')
  console.log(`\n📊 Summary:`)
  console.log(`   Users: ${users.length}`)
  console.log(`   Posts: ${posts.length}`)
  console.log(`   Follows: ${followsToCreate.length}`)
  console.log(`   Likes: ${likesToCreate.length}`)
  console.log(`   Saves: ${savesToCreate.length}`)
  console.log(`\n🔑 Demo accounts (all passwords: "password123"):`)
  console.log(`   ${users.slice(0, 3).map(u => u.email).join('\n   ')}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
