import prisma from '../config/database'

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention'

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

  // Check if similar notification already exists (to avoid spam)
  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId: data.userId,
      actorId: data.actorId,
      type: data.type,
      postId: data.postId || undefined,
      commentId: data.commentId || undefined,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  })

  if (existingNotification) {
    return existingNotification
  }

  const notification = await prisma.notification.create({
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

  return notification
}

export async function getNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const [notifications, total, unreadCount] = await Promise.all([
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
        post: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
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
