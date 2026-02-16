import { searchPosts } from './postService';
import prisma from '../config/database';

// Mock the prisma client
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
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
  },
}));

describe('searchPosts Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify N+1 query behavior in searchPosts', async () => {
    const POST_COUNT = 10;
    const mockPosts = Array.from({ length: POST_COUNT }, (_, i) => ({
      id: `post-${i}`,
      userId: 'user-1',
      title: `Post ${i}`,
      isPublic: true,
      createdAt: new Date(),
    }));

    (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
    (prisma.post.count as jest.Mock).mockResolvedValue(POST_COUNT);
    (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.save.findUnique as jest.Mock).mockResolvedValue(null);

    await searchPosts('current-user', 'query');

    // Optimized code should use findMany for batch fetching and not call findUnique in a loop
    expect(prisma.like.findUnique).toHaveBeenCalledTimes(0);
    expect(prisma.save.findUnique).toHaveBeenCalledTimes(0);

    // Wait, prisma.post.findMany is called once. prisma.like.findMany is called once. prisma.save.findMany is called once.
    // Total 3 findMany calls.
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.like.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.save.findMany).toHaveBeenCalledTimes(1);
  });
});
