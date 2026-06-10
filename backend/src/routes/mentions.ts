import { logger } from '../utils/logger'
import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

const router = Router();

// Helper function to extract @mentions from text
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]); // Extract username without @
  }

  return [...new Set(mentions)]; // Remove duplicates
}

// Helper function to create mentions and notifications
export async function processMentions(
  text: string,
  mentionedById: string,
  type: 'POST' | 'COMMENT',
  postId?: string,
  commentId?: string
) {
  const usernames = extractMentions(text);

  if (usernames.length === 0) {
    return [];
  }

  // Find all mentioned users
  const users = await prisma.user.findMany({
    where: {
      username: {
        in: usernames
      },
      isActive: true // Only mention active users
    },
    select: {
      id: true,
      username: true
    }
  });

  // Create mentions and notifications for each mentioned user
  const mentions = await Promise.all(
    users.map(async (user) => {
      // Don't create mention if user mentions themselves
      if (user.id === mentionedById) {
        return null;
      }

      // Create the mention
      const mention = await prisma.mention.create({
        data: {
          mentionedById,
          mentionedId: user.id,
          type,
          postId,
          commentId
        }
      });

      // Notification (fires socket emit via createNotification)
      await createNotification({
        userId: user.id,
        actorId: mentionedById,
        type: 'mention',
        postId,
        commentId,
      });

      return mention;
    })
  );

  return mentions.filter(m => m !== null);
}

// Get all mentions for the authenticated user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const mentions = await prisma.mention.findMany({
      where: {
        mentionedId: userId
      },
      include: {
        mentionedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        comment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            postId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.mention.count({
      where: {
        mentionedId: userId
      }
    });

    res.json({
      mentions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    logger.error('Error fetching mentions:', error);
    res.status(500).json({ error: 'Failed to fetch mentions' });
  }
});

// Search users for @mention autocomplete
router.get('/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const query = (req.query.q as string || '').trim();

    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    // Search for users by username or display name
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                username: {
                  contains: query
                }
              },
              {
                displayName: {
                  contains: query
                }
              }
            ]
          },
          {
            isActive: true,
            isBanned: false
          }
        ]
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true
      },
      take: 10,
      orderBy: {
        username: 'asc'
      }
    });

    res.json({ users });
    return;
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
    return;
  }
});

// Get mentions for a specific post
router.get('/post/:postId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.params;

    const mentions = await prisma.mention.findMany({
      where: {
        postId
      },
      include: {
        mentioned: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        mentionedBy: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ mentions });
  } catch (error) {
    logger.error('Error fetching post mentions:', error);
    res.status(500).json({ error: 'Failed to fetch post mentions' });
  }
});

// Get mentions for a specific comment
router.get('/comment/:commentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { commentId } = req.params;

    const mentions = await prisma.mention.findMany({
      where: {
        commentId
      },
      include: {
        mentioned: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        mentionedBy: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ mentions });
  } catch (error) {
    logger.error('Error fetching comment mentions:', error);
    res.status(500).json({ error: 'Failed to fetch comment mentions' });
  }
});

export default router;
