import { getPostsByUser } from './postService';
import { prisma } from '../lib/prisma'

jest.mock('../lib/prisma', () => {
  const client = {
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    like: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    save: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return { __esModule: true, default: client, prisma: client };
});

describe('getPostsByUser Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify N+1 query behavior', async () => {
    const POST_COUNT = 20;
    const mockPosts = Array.from({ length: POST_COUNT }, (_, i) => ({
      id: `post-${i}`,
      userId: 'target-user',
      title: `Post ${i}`,
      isPublic: true,
      createdAt: new Date(),
    }));

    (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
    (prisma.post.count as jest.Mock).mockResolvedValue(POST_COUNT);
    (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.save.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.like.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.save.findMany as jest.Mock).mockResolvedValue([]);

    await getPostsByUser('target-user', 'current-user');

    expect(prisma.like.findUnique).toHaveBeenCalledTimes(0);
    expect(prisma.save.findUnique).toHaveBeenCalledTimes(0);

    expect(prisma.like.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.save.findMany).toHaveBeenCalledTimes(1);
  });
});
