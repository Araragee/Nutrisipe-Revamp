import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting benchmark...')

  // Check existing post count
  const count = await prisma.post.count()
  console.log(`Found ${count} existing posts.`)

  if (count < 1000) {
    console.log('🌱 Seeding more posts for benchmark...')
    const users = await prisma.user.findMany({ take: 10 })
    if (users.length === 0) {
      console.error('❌ No users found. Please run seed first.')
      return
    }

    const tagsList = ['healthy', 'vegan', 'gluten-free', 'quick', 'easy']
    const postsToCreate = []

    for (let i = 0; i < 1000; i++) {
        const user = users[i % users.length]
        postsToCreate.push({
            userId: user.id,
            title: `Benchmark Post ${i}`,
            imageUrl: 'https://example.com/image.jpg',
            category: 'recipe',
            tags: [tagsList[i % tagsList.length]],
            isPublic: true
        })
    }

    // Batch create might fail if too large, so we do it in chunks or loop
    // Prisma createMany is supported
    await prisma.post.createMany({
        data: postsToCreate
    })
    console.log('✅ Added 1000 posts.')
  }

  console.log('⏱️  Measuring query time...')

  const query = 'healthy'
  const iterations = 5
  let totalTime = 0

  for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await prisma.post.findMany({
        where: {
            tags: { has: query }
        }
      })
      const end = performance.now()
      totalTime += (end - start)
  }

  const avgTime = totalTime / iterations
  console.log(`📊 Average query time over ${iterations} iterations: ${avgTime.toFixed(2)}ms`)

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
