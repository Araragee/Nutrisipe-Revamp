import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth';
import { parsePagination } from '../utils/pagination';
import type { Response } from 'express';


export async function getMyMentionsHandler(req: AuthRequest, res: Response) {
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
}

export async function searchMentionableUsersHandler(req: AuthRequest, res: Response) {
  try {
    const query = (req.query.q as string || '').trim();

    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                username: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                displayName: {
                  contains: query,
                  mode: 'insensitive'
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
}

export async function getPostMentionsHandler(req: AuthRequest, res: Response) {
  try {
    const { postId } = req.params;
    const { page, limit } = parsePagination(req, 20);

    const mentions = await prisma.mention.findMany({
      where: {
        postId
      },
      skip: (page - 1) * limit,
      take: limit,
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
}

export async function getCommentMentionsHandler(req: AuthRequest, res: Response) {
  try {
    const { commentId } = req.params;
    const { page, limit } = parsePagination(req, 20);

    const mentions = await prisma.mention.findMany({
      where: {
        commentId
      },
      skip: (page - 1) * limit,
      take: limit,
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
}
