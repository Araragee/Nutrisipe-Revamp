import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export const STORY_TTL_MS = 24 * 60 * 60 * 1000

interface CreateInput {
  userId: string
  imageUrl: string
  caption?: string
  postId?: string
}

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const

export async function createStory(data: CreateInput) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + STORY_TTL_MS)
  const story = await prisma.story.create({
    data: {
      userId: data.userId,
      imageUrl: data.imageUrl,
      caption: data.caption,
      postId: data.postId,
      expiresAt,
    },
    include: { user: { select: USER_SELECT } },
  })
  return story
}

export async function getFeed(userId: string) {
  const now = new Date()
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  const ids = [userId, ...following.map((f) => f.followingId)]

  const stories = await prisma.story.findMany({
    where: {
      userId: { in: ids },
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: USER_SELECT } },
  })

  // Group by user
  const groups: Record<string, { user: any; stories: any[] }> = {}
  for (const s of stories) {
    if (!groups[s.userId]) {
      groups[s.userId] = { user: s.user, stories: [] }
    }
    groups[s.userId].stories.push({
      id: s.id,
      imageUrl: s.imageUrl,
      caption: s.caption,
      postId: s.postId,
      views: s.views,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    })
  }

  // Place current user first
  const ordered = Object.values(groups).sort((a, b) => {
    if (a.user.id === userId) return -1
    if (b.user.id === userId) return 1
    return 0
  })

  return ordered
}

export async function deleteStory(userId: string, storyId: string) {
  const story = await prisma.story.findUnique({ where: { id: storyId } })
  if (!story) throw new AppError(404, 'Story not found')
  if (story.userId !== userId) throw new AppError(403, 'Forbidden')
  await prisma.story.delete({ where: { id: storyId } })
  return { success: true }
}

export async function getStoryById(storyId: string) {
  return prisma.story.findUnique({ where: { id: storyId }, select: { id: true } })
}

export async function recordView(storyId: string) {
  await prisma.story.update({
    where: { id: storyId },
    data: { views: { increment: 1 } },
  })
}

export async function purgeExpired(now: Date = new Date()) {
  const result = await prisma.story.deleteMany({
    where: { expiresAt: { lte: now } },
  })
  return { deleted: result.count }
}
