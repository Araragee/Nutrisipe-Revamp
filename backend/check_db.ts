import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        username: true,
        email: true
      }
    });
    console.log('Recent users:', JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error);
    process.exit(1);
  }
}

main();
