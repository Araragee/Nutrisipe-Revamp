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

  it('should verify optimized O(1) query behavior in searchPosts', async () => {
    // Setup 20 mock posts
    const POST_COUNT = 20;
    const mockPosts = Array.from({ length: POST_COUNT }, (_, i) => ({
      id: `post-${i}`,
      userId: 'post-author',
      title: `Search Result ${i}`,
      isPublic: true,
      createdAt: new Date(),
    }));

    (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
    (prisma.post.count as jest.Mock).mockResolvedValue(POST_COUNT);
    (prisma.like.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.save.findUnique as jest.Mock).mockResolvedValue(null);

    // Optimized version uses findMany
    (prisma.like.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.save.findMany as jest.Mock).mockResolvedValue([]);

    await searchPosts('current-user', 'query');

    // After optimization, it should NOT call findUnique N times
    expect(prisma.like.findUnique).toHaveBeenCalledTimes(0);
    expect(prisma.save.findUnique).toHaveBeenCalledTimes(0);

    // Instead, it should call findMany ONCE for each
    expect(prisma.like.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.save.findMany).toHaveBeenCalledTimes(1);

    // Verify it used the correct post IDs
    const expectedPostIds = mockPosts.map(p => p.id);
    expect(prisma.like.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        postId: { in: expectedPostIds }
      })
    }));
  });
});
