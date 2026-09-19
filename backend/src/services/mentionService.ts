import { prisma } from '../lib/prisma'
import { createNotification } from './notificationService';

export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)];
}

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

  const users = await prisma.user.findMany({
    where: {
      username: {
        in: usernames
      },
      isActive: true
    },
    select: {
      id: true,
      username: true
    }
  });

  const mentions = await Promise.all(
    users.map(async (user) => {
      if (user.id === mentionedById) {
        return null;
      }

      const mention = await prisma.mention.create({
        data: {
          mentionedById,
          mentionedId: user.id,
          type,
          postId,
          commentId
        }
      });

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
