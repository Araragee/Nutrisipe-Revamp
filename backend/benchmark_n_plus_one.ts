
import prisma from './src/config/database';
import { searchPosts, createPost } from './src/services/postService';
import { v4 as uuidv4 } from 'uuid';

async function runBenchmark() {
  try {
    // Check connection
    await prisma.$connect();
  } catch (e) {
    console.error('Failed to connect to database. Ensure a Postgres instance is running at DATABASE_URL.');
    console.error(e);
    process.exit(1);
  }

  console.log('Setting up benchmark data...');

  // Create a user
  const user = await prisma.user.create({
    data: {
      username: `bench_${uuidv4().substring(0, 8)}`,
      email: `bench_${uuidv4()}@example.com`,
      passwordHash: 'hash',
      displayName: 'Benchmark User',
    },
  });

  const postCount = 50;
  const posts = [];

  // Create posts
  for (let i = 0; i < postCount; i++) {
    const post = await createPost(user.id, {
      title: `benchmark post ${i} ${uuidv4()}`,
      description: 'benchmark description',
      imageUrl: 'http://example.com/image.jpg',
      category: 'Breakfast',
      tags: ['benchmark'],
      isPublic: true,
    });
    posts.push(post);
  }

  // Like and Save half of them
  for (let i = 0; i < postCount; i++) {
    if (i % 2 === 0) {
      await prisma.like.create({
        data: {
          userId: user.id,
          postId: posts[i].id,
        },
      });
      await prisma.save.create({
        data: {
          userId: user.id,
          postId: posts[i].id,
        },
      });
    }
  }

  console.log('Data setup complete. Running benchmark...');

  const start = process.hrtime();

  // Call searchPosts
  const result = await searchPosts(user.id, 'benchmark', undefined, 1, postCount);

  const end = process.hrtime(start);
  const durationInMs = (end[0] * 1000 + end[1] / 1e6).toFixed(2);

  console.log(`\nBenchmark Results:`);
  console.log(`Time taken: ${durationInMs}ms`);
  console.log(`Posts found: ${result.posts.length}`);

  // Cleanup
  console.log('\nCleaning up...');
  await prisma.user.delete({
    where: { id: user.id },
  });
  // Posts, likes, saves should be deleted via cascade
  // But wait, createPost creates posts for the user.
  // The posts table has onDelete: Cascade for userId?
  // Let's check schema.
  // Post user: User @relation(fields: [userId], references: [id], onDelete: Cascade)
  // Yes.

  console.log('Done.');
}

runBenchmark()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
