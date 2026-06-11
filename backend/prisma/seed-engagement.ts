import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const COMMENT_TEMPLATES = [
  "This looks absolutely delicious! Can't wait to try it.",
  "I made this last night and my family loved it! 10/10.",
  "Is there a good substitute for olive oil in this recipe?",
  "Wow, the presentation is stunning!",
  "Great recipe, very easy to follow.",
  "A bit too spicy for my taste, but still good.",
  "Adding this to my weekly meal prep rotation!",
  "Can I use chicken thighs instead of breast?",
  "Love the nutritional breakdown on this one. Very helpful!",
  "Simply amazing. Thanks for sharing!",
  "This is a game-changer! So simple yet so flavorful.",
  "I added some extra garlic and it was perfect.",
  "Can this be made vegan?",
  "Beautiful plating! Thanks for the inspiration.",
  "Perfect for weeknight dinners."
]

const REPLY_TEMPLATES = [
  "Agreed! It's one of my favorites now.",
  "Thanks for the tip, will try that next time!",
  "Yes, coconut oil or avocado oil works great as a sub.",
  "Let me know how it goes if you make it!",
  "Yes! Chicken thighs work perfectly and stay super juicy.",
  "You can easily make it vegan by replacing the meat with tofu.",
  "Same here! My kids actually ate it without complaining."
]

const REVIEW_TEMPLATES = [
  "Absolutely perfect recipe. Instructions were spot on and it turned out exactly like the photo.",
  "Very good and easy to make. I reduced the salt slightly and it was perfect.",
  "Decent recipe, but took a bit longer to prep than advertised. Still tasted great.",
  "A new staple in our house! Everyone loved it.",
  "Simple, healthy, and delicious. Highly recommend!",
  "Tastes good but mine turned out a bit dry. Might reduce cook time next time.",
  "Outstanding flavor profile. Tastes like restaurant quality!",
  "Super quick and easy. Perfect for a busy weeknight."
]

const VARIATION_DESCRIPTIONS = [
  "Swapped chicken breast for firm tofu to make it vegetarian. Tastes amazing!",
  "Added a dash of sriracha and chili flakes for an extra kick of spice.",
  "Substituted white rice with quinoa for extra protein and fiber.",
  "Used gluten-free soy sauce and tamari to make it safe for celiac diet.",
  "Doubled the garlic and added some fresh basil at the end.",
  "Air-fried the proteins instead of pan-searing to cut down on oil."
]

const MESSAGE_TEMPLATES = [
  "Hey! Did you try that new curry recipe?",
  "Yeah, it was delicious! Super creamy.",
  "Nice! Did you make any changes to it?",
  "I added some extra lime juice and chili flakes.",
  "Oh good idea, I'll try that next time.",
  "Are you free for dinner tomorrow?",
  "Yes! What should we cook?",
  "Let's try that teriyaki salmon bowl.",
  "Perfect, I'll buy the salmon on my way back.",
  "Awesome, see you tomorrow at 6 PM!",
  "See you!"
]

const COLLECTION_NAMES = [
  "Weeknight Dinners",
  "High Protein Prep",
  "Guilt-Free Desserts",
  "Brunch Favorites",
  "Spicy Dishes",
  "Quick 15-Min Meals",
  "Healthy Comfort Food"
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
  console.log('🌱 Starting engagement seed data generation...')

  // Fetch users and posts created by seed.ts
  const users = await prisma.user.findMany()
  const posts = await prisma.post.findMany()
  const recipePosts = posts.filter(p => p.category === 'recipe')

  if (users.length === 0 || posts.length === 0) {
    console.error('❌ Error: Seed users/posts first using seed.ts!')
    process.exit(1)
  }

  const adminUser = users.find(u => u.username === 'admin') || users[0]

  console.log('🧹 Cleaning existing engagement data...')
  await prisma.recipeVariation.deleteMany()
  await prisma.rating.deleteMany()
  await prisma.mention.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.collectionPost.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.mealPlan.deleteMany()
  await prisma.story.deleteMany()
  await prisma.notification.deleteMany()

  console.log('💬 Seeding comments and replies...')
  let commentCount = 0
  let mentionCount = 0

  for (const post of posts) {
    // Determine how many comments this post gets (3 to 8 for popular posts, fewer for others)
    const count = randomInt(1, 8)
    const postComments = []

    for (let c = 0; c < count; c++) {
      const commenter = randomElement(users)
      
      // 15% chance comment mentions another random user
      let content = randomElement(COMMENT_TEMPLATES)
      let mentionedUser = null
      if (Math.random() < 0.15) {
        mentionedUser = randomElement(users.filter(u => u.id !== commenter.id))
        content = `@${mentionedUser.username} ${content}`
      }

      const comment = await prisma.comment.create({
        data: {
          id: randomUUID(),
          userId: commenter.id,
          postId: post.id,
          content,
          createdAt: new Date(post.createdAt.getTime() + randomInt(1, 10) * 3600 * 1000)
        }
      })
      postComments.push(comment)
      commentCount++

      if (mentionedUser) {
        await prisma.mention.create({
          data: {
            id: randomUUID(),
            mentionedById: commenter.id,
            mentionedId: mentionedUser.id,
            type: 'comment',
            postId: post.id,
            commentId: comment.id
          }
        })
        mentionCount++

        await prisma.notification.create({
          data: {
            id: randomUUID(),
            userId: mentionedUser.id,
            actorId: commenter.id,
            type: 'mention',
            postId: post.id,
            commentId: comment.id
          }
        })
      }

      // Create notification for post owner
      if (commenter.id !== post.userId) {
        await prisma.notification.create({
          data: {
            id: randomUUID(),
            userId: post.userId,
            actorId: commenter.id,
            type: 'comment',
            postId: post.id,
            commentId: comment.id
          }
        })
      }
    }

    // Add nested replies (30% of comments get 1-2 replies)
    for (const comment of postComments) {
      if (Math.random() < 0.3) {
        const replyCount = randomInt(1, 2)
        for (let r = 0; r < replyCount; r++) {
          const replier = randomElement(users)
          const reply = await prisma.comment.create({
            data: {
              id: randomUUID(),
              userId: replier.id,
              postId: post.id,
              parentId: comment.id,
              content: randomElement(REPLY_TEMPLATES),
              createdAt: new Date(comment.createdAt.getTime() + randomInt(1, 120) * 60 * 1000)
            }
          })
          commentCount++

          // Notification for original commenter
          if (replier.id !== comment.userId) {
            await prisma.notification.create({
              data: {
                id: randomUUID(),
                userId: comment.userId,
                actorId: replier.id,
                type: 'comment',
                postId: post.id,
                commentId: reply.id
              }
            })
          }
        }
      }
    }
  }
  console.log(`✅ Seeded ${commentCount} comments/replies and ${mentionCount} comment mentions.`)

  console.log('⭐️ Seeding ratings and reviews for recipes...')
  let ratingCount = 0
  for (const recipePost of recipePosts) {
    const numRatings = randomInt(5, 18)
    const ratingUsers = randomElements(users, numRatings)
    let totalScore = 0

    for (const rUser of ratingUsers) {
      const score = randomInt(3, 5) // mostly good reviews
      const hasReview = Math.random() < 0.6
      const reviewText = hasReview ? randomElement(REVIEW_TEMPLATES) : null

      await prisma.rating.create({
        data: {
          id: randomUUID(),
          userId: rUser.id,
          postId: recipePost.id,
          rating: score,
          review: reviewText,
          createdAt: new Date(recipePost.createdAt.getTime() + randomInt(12, 120) * 3600 * 1000)
        }
      })
      totalScore += score
      ratingCount++

      // Create notification for rating on owned recipe
      if (rUser.id !== recipePost.userId && score >= 4) {
        await prisma.notification.create({
          data: {
            id: randomUUID(),
            userId: recipePost.userId,
            actorId: rUser.id,
            type: 'like', // Map high ratings as positive engagement
            postId: recipePost.id
          }
        })
      }
    }

    const averageRating = Number((totalScore / numRatings).toFixed(2))

    // Update aggregate post rating fields
    await prisma.post.update({
      where: { id: recipePost.id },
      data: {
        ratingCount: numRatings,
        averageRating: averageRating
      }
    })
  }
  console.log(`✅ Seeded ${ratingCount} ratings and reviews.`)

  console.log('🔄 Seeding recipe variations and forks...')
  // Select ~15 recipe posts to be targets of variations
  const targetRecipes = randomElements(recipePosts, Math.min(15, recipePosts.length))
  let variationCount = 0

  for (const originalPost of targetRecipes) {
    // 1 to 3 forks per recipe
    const numForks = randomInt(1, 3)
    
    // Fetch recipe data of original post
    const originalRecipe = await prisma.recipe.findUnique({
      where: { postId: originalPost.id }
    })

    if (!originalRecipe) continue

    for (let f = 0; f < numForks; f++) {
      const forkCreator = randomElement(users.filter(u => u.id !== originalPost.userId))
      const variationPostId = randomUUID()
      const title = `Modified ${originalPost.title}`
      const varDescription = randomElement(VARIATION_DESCRIPTIONS)

      // Create fork post
      await prisma.post.create({
        data: {
          id: variationPostId,
          userId: forkCreator.id,
          title,
          description: `My custom spin on ${originalPost.title}. ${varDescription}`,
          imageUrl: originalPost.imageUrl,
          category: 'recipe',
          tags: originalPost.tags,
          isVariation: true,
          createdAt: new Date(originalPost.createdAt.getTime() + randomInt(24, 72) * 3600 * 1000)
        }
      })

      // Create fork recipe
      await prisma.recipe.create({
        data: {
          id: randomUUID(),
          postId: variationPostId,
          servings: originalRecipe.servings,
          prepTime: originalRecipe.prepTime,
          cookTime: originalRecipe.cookTime,
          difficulty: originalRecipe.difficulty,
          ingredients: originalRecipe.ingredients,
          instructions: originalRecipe.instructions,
          nutrition: originalRecipe.nutrition
        }
      })

      // Create variation relation
      await prisma.recipeVariation.create({
        data: {
          id: randomUUID(),
          originalPostId: originalPost.id,
          variationPostId: variationPostId,
          userId: forkCreator.id,
          description: varDescription,
          createdAt: new Date()
        }
      })

      // Notify parent post creator
      await prisma.notification.create({
        data: {
          id: randomUUID(),
          userId: originalPost.userId,
          actorId: forkCreator.id,
          type: 'variation',
          postId: originalPost.id
        }
      })

      variationCount++
    }

    // Update parent variation count
    await prisma.post.update({
      where: { id: originalPost.id },
      data: {
        variationCount: { increment: numForks }
      }
    })
  }

  // Seeding 2-3 multigenerational chains (original -> variation -> variation-of-variation)
  const chainRoots = randomElements(recipePosts.filter(p => p.variationCount > 0), 2)
  for (const rootPost of chainRoots) {
    // Find one of its variations
    const firstGenVar = await prisma.recipeVariation.findFirst({
      where: { originalPostId: rootPost.id },
      include: { variationPost: { include: { recipe: true } } }
    })

    if (firstGenVar && firstGenVar.variationPost && firstGenVar.variationPost.recipe) {
      const nextGenCreator = randomElement(users.filter(u => u.id !== firstGenVar.userId && u.id !== rootPost.userId))
      const chainPostId = randomUUID()
      const chainVarDesc = "Further optimized cooking time and reduced fat content."

      await prisma.post.create({
        data: {
          id: chainPostId,
          userId: nextGenCreator.id,
          title: `Next-Gen ${rootPost.title}`,
          description: `A variation of ${firstGenVar.variationPost.title}. ${chainVarDesc}`,
          imageUrl: rootPost.imageUrl,
          category: 'recipe',
          tags: rootPost.tags,
          isVariation: true,
          createdAt: new Date(firstGenVar.variationPost.createdAt.getTime() + randomInt(24, 48) * 3600 * 1000)
        }
      })

      await prisma.recipe.create({
        data: {
          id: randomUUID(),
          postId: chainPostId,
          servings: firstGenVar.variationPost.recipe.servings,
          prepTime: firstGenVar.variationPost.recipe.prepTime,
          cookTime: Math.max(5, (firstGenVar.variationPost.recipe.cookTime || 20) - 5),
          difficulty: firstGenVar.variationPost.recipe.difficulty,
          ingredients: firstGenVar.variationPost.recipe.ingredients,
          instructions: firstGenVar.variationPost.recipe.instructions,
          nutrition: firstGenVar.variationPost.recipe.nutrition
        }
      })

      await prisma.recipeVariation.create({
        data: {
          id: randomUUID(),
          originalPostId: firstGenVar.variationPostId,
          variationPostId: chainPostId,
          userId: nextGenCreator.id,
          description: chainVarDesc,
          createdAt: new Date()
        }
      })

      await prisma.post.update({
        where: { id: firstGenVar.variationPostId },
        data: {
          variationCount: { increment: 1 }
        }
      })

      await prisma.notification.create({
        data: {
          id: randomUUID(),
          userId: firstGenVar.userId,
          actorId: nextGenCreator.id,
          type: 'variation',
          postId: firstGenVar.variationPostId
        }
      })
      variationCount++
    }
  }

  console.log(`✅ Seeded ${variationCount} variations and multi-generational lineages.`)

  console.log('📂 Seeding collections...')
  let collectionCount = 0
  const collectionUsers = randomElements(users, 20)
  for (const colUser of collectionUsers) {
    const numCols = randomInt(1, 3)
    for (let c = 0; c < numCols; c++) {
      const name = randomElement(COLLECTION_NAMES)
      const collection = await prisma.collection.create({
        data: {
          id: randomUUID(),
          userId: colUser.id,
          name: `${name} (${colUser.displayName.split(' ')[0]})`,
          description: `Curated collection of my favorite recipes and nutrition tips.`,
          isPublic: Math.random() < 0.7,
        }
      })
      collectionCount++

      // Add 4-10 posts
      const colPosts = randomElements(posts, randomInt(4, 10))
      for (const cPost of colPosts) {
        await prisma.collectionPost.create({
          data: {
            id: randomUUID(),
            collectionId: collection.id,
            postId: cPost.id
          }
        })
      }
    }
  }
  console.log(`✅ Seeded ${collectionCount} collections.`)

  console.log('💬 Seeding mutual conversations & direct messages...')
  let messageCount = 0
  let convoCount = 0

  // Find users who follow each other (mutual follows)
  const follows = await prisma.follow.findMany()
  const mutualFollows: [string, string][] = []
  const checked = new Set<string>()

  for (const f of follows) {
    const key = `${f.followerId}-${f.followingId}`
    const reverseKey = `${f.followingId}-${f.followerId}`
    if (checked.has(reverseKey)) {
      mutualFollows.push([f.followerId, f.followingId])
    }
    checked.add(key)
  }

  // If not enough mutual follows in seed, force some mutuals
  const seedMutualUsers = mutualFollows.length >= 15 ? mutualFollows : []
  if (seedMutualUsers.length < 15) {
    const potentialPairs = randomElements(users, 16)
    for (let i = 0; i < potentialPairs.length; i += 2) {
      const u1 = potentialPairs[i]
      const u2 = potentialPairs[i+1]
      // Force follow both ways
      try {
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: u1.id, followingId: u2.id } },
          create: { id: randomUUID(), followerId: u1.id, followingId: u2.id },
          update: {}
        })
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: u2.id, followingId: u1.id } },
          create: { id: randomUUID(), followerId: u2.id, followingId: u1.id },
          update: {}
        })
        seedMutualUsers.push([u1.id, u2.id])
      } catch (e) {}
    }
  }

  // Seed 15 conversations
  const activeMutuals = randomElements(seedMutualUsers, Math.min(15, seedMutualUsers.length))
  for (const [u1Id, u2Id] of activeMutuals) {
    const convoId = randomUUID()
    const sortedIds = [u1Id, u2Id].sort()
    
    const conversation = await prisma.conversation.create({
      data: {
        id: convoId,
        user1Id: sortedIds[0],
        user2Id: sortedIds[1],
        lastMessageAt: new Date()
      }
    })
    convoCount++

    // Add 5-25 messages
    const numMsgs = randomInt(5, 25)
    let lastMsgDate = new Date(Date.now() - numMsgs * 30 * 60 * 1000)
    let senderId = u1Id
    let recipientId = u2Id
    let unreadCount = 0

    for (let m = 0; m < numMsgs; m++) {
      // Alternate sender
      senderId = m % 2 === 0 ? u1Id : u2Id
      recipientId = senderId === u1Id ? u2Id : u1Id
      lastMsgDate = new Date(lastMsgDate.getTime() + randomInt(5, 20) * 60 * 1000)

      const isLastMessage = m === numMsgs - 1
      const isRead = isLastMessage ? Math.random() < 0.3 : true // Last message might be unread

      if (!isRead) {
        unreadCount++
      }

      await prisma.message.create({
        data: {
          id: randomUUID(),
          conversationId: convoId,
          senderId,
          recipientId,
          content: randomElement(MESSAGE_TEMPLATES),
          isRead,
          createdAt: lastMsgDate
        }
      })
      messageCount++
    }

    // Update conversation metadata
    await prisma.conversation.update({
      where: { id: convoId },
      data: {
        lastMessageAt: lastMsgDate,
        user1UnreadCount: sortedIds[0] === recipientId ? unreadCount : 0,
        user2UnreadCount: sortedIds[1] === recipientId ? unreadCount : 0
      }
    })
  }
  console.log(`✅ Seeded ${convoCount} conversations and ${messageCount} messages.`)

  console.log('🎬 Seeding active and expired stories...')
  let storyCount = 0
  const activeStoryCreators = randomElements(users, 8)
  for (const sUser of activeStoryCreators) {
    // Active story
    await prisma.story.create({
      data: {
        id: randomUUID(),
        userId: sUser.id,
        imageUrl: `https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=400&h=700&q=80`,
        caption: `Cooking something beautiful today!`,
        postId: randomElement(recipePosts).id,
        views: randomInt(5, 80),
        createdAt: new Date(Date.now() - randomInt(1, 3) * 3600 * 1000),
        expiresAt: new Date(Date.now() + 20 * 3600 * 1000) // Active
      }
    })
    storyCount++

    // Expired story
    if (Math.random() < 0.5) {
      await prisma.story.create({
        data: {
          id: randomUUID(),
          userId: sUser.id,
          imageUrl: `https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&h=700&q=80`,
          caption: `Flashback to this delicious feast!`,
          views: randomInt(30, 150),
          createdAt: new Date(Date.now() - 30 * 3600 * 1000),
          expiresAt: new Date(Date.now() - 6 * 3600 * 1000) // Expired
        }
      })
      storyCount++
    }
  }
  console.log(`✅ Seeded ${storyCount} stories.`)

  console.log('📅 Seeding weekly meal plans...')
  let mealPlanCount = 0
  const mealPlanUsers = randomElements(users, 5)
  const slots = ['breakfast', 'lunch', 'dinner']
  const today = new Date()

  for (const mpUser of mealPlanUsers) {
    // Seed dinner/lunch slots for the current week
    for (let dayOffset = -3; dayOffset <= 3; dayOffset++) {
      const date = new Date()
      date.setDate(today.getDate() + dayOffset)
      date.setHours(0, 0, 0, 0)

      // Randomly schedule 1-2 meals per day
      const numMeals = randomInt(1, 2)
      const scheduledSlots = randomElements(slots, numMeals)

      for (const slot of scheduledSlots) {
        const recipe = randomElement(recipePosts)
        await prisma.mealPlan.create({
          data: {
            id: randomUUID(),
            userId: mpUser.id,
            postId: recipe.id,
            date,
            slot,
            servings: randomInt(2, 4),
            notes: Math.random() < 0.5 ? "Remember to prep ingredients the night before." : null
          }
        })
        mealPlanCount++
      }
    }
  }
  console.log(`✅ Seeded ${mealPlanCount} meal plans.`)

  console.log('🔔 Deriving notifications for admin user inbox...')
  // Specifically send comments/replies/likes to Admin so they have immediate inbox items to look at
  const adminPosts = posts.filter(p => p.userId === adminUser.id)
  let adminInboxCount = 0
  if (adminPosts.length > 0) {
    const notifyUsers = randomElements(users.filter(u => u.id !== adminUser.id), 8)
    for (const actor of notifyUsers) {
      // Create follow notification
      await prisma.notification.create({
        data: {
          id: randomUUID(),
          userId: adminUser.id,
          actorId: actor.id,
          type: 'follow',
          isRead: false
        }
      })
      adminInboxCount++

      // Create comment notification on admin's post
      const adminPost = randomElement(adminPosts)
      const adminComment = await prisma.comment.create({
        data: {
          id: randomUUID(),
          userId: actor.id,
          postId: adminPost.id,
          content: "Incredible recipe! The steps were very descriptive.",
          createdAt: new Date()
        }
      })
      await prisma.notification.create({
        data: {
          id: randomUUID(),
          userId: adminUser.id,
          actorId: actor.id,
          type: 'comment',
          postId: adminPost.id,
          commentId: adminComment.id,
          isRead: false
        }
      })
      adminInboxCount++
    }
  }
  console.log(`✅ Derived ${adminInboxCount} inbox notifications for admin.`)

  console.log('\n🎉 Engagement seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Engagement seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
