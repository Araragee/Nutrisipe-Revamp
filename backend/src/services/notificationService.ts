import { prisma } from '../lib/prisma'
import { emitNotificationNew } from '../socket'

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'rating' | 'variation'

interface CreateNotificationData {
  userId: string
  actorId: string
  type: NotificationType
  postId?: string
  commentId?: string
}

export async function createNotification(data: CreateNotificationData) {
  // Don't create notification if user is acting on their own content
  if (data.userId === data.actorId) {
    return null
  }

  // Dedup check + create inside a transaction to close the check-then-create race (B-07).
  const notification = await prisma.$transaction(async (tx) => {
    const existing = await tx.notification.findFirst({
      where: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId || undefined,
        commentId: data.commentId || undefined,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })
    if (existing) return existing

    return tx.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId,
        commentId: data.commentId,
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })
  })

  let post = null
  if (notification.postId) {
    post = await prisma.post.findUnique({
      where: { id: notification.postId },
      select: { id: true, title: true, imageUrl: true },
    })
  }

  emitNotificationNew(data.userId, { ...notification, post })

  return notification
}

export async function getNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const [notificationsRaw, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: { userId },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ])

  // Fetch related posts manually since there is no relation in schema
  const postIds = notificationsRaw
    .map((n) => n.postId)
    .filter((id): id is string => id !== null)

  const posts =
    postIds.length > 0
      ? await prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        })
      : []

  const postsMap = new Map(posts.map((p) => [p.id, p]))

  const notifications = notificationsRaw.map((n) => ({
    ...n,
    post: n.postId ? postsMap.get(n.postId) || null : null,
  }))

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification || notification.userId !== userId) {
    return null
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })

  return { success: true }
}

export async function deleteNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification || notification.userId !== userId) {
    return null
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  })

  return { success: true }
}
