import { logger } from '../utils/logger'
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { verifyToken } from '../utils/jwt'
import { prisma } from '../lib/prisma'
import { env } from '../config/env'
// cookie@1 is an ES module build with no default export; a default import is undefined at runtime
import { parse as parseCookie } from 'cookie'
import { sendMessageSchema } from '../controllers/messagesController'

// Async socket handlers that throw become unhandled rejections and kill the process; never let client input do that.
function safe<T extends unknown[]>(name: string, fn: (...args: T) => unknown) {
  return async (...args: T) => {
    try {
      await fn(...args)
    } catch (error) {
      logger.error(`Socket handler ${name} failed:`, error)
    }
  }
}

const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64

interface AuthenticatedSocket extends Socket {
  userId?: string
}

export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true
    }
  })

  socketInstance = io

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const raw = socket.handshake.headers.cookie
      const token = raw ? parseCookie(raw).auth_token : socket.handshake.auth?.token

      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const payload = verifyToken(token as string)
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { isBanned: true },
      })
      if (!user || user.isBanned) {
        return next(new Error('Invalid authentication token'))
      }
      socket.userId = payload.userId

      next()
    } catch (error) {
      next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!
    logger.log(`User connected: ${userId}`)

    // Register handlers before any await: events sent right after connect are dropped otherwise.
    socket.join(`user:${userId}`)

    socket.on('disconnect', async () => {
      logger.log(`User disconnected: ${userId}`)
      await updateUserPresence(userId, false)
    })

    socket.on('message:send', safe('message:send', (data) => handleSendMessage(io, socket, data)))

    socket.on('message:read', safe('message:read', (data) => handleMarkMessageRead(io, socket, data)))

    socket.on('message:typing', safe('message:typing', (data) => handleTypingIndicator(io, socket, data)))

    socket.on('notification:read', safe('notification:read', (notificationId) => handleNotificationRead(socket, notificationId)))

    socket.on('presence:check', safe('presence:check', async (userIds) => {
      if (!Array.isArray(userIds)) return
      const presences = await getUsersPresence(userIds.filter(isId).slice(0, 200))
      socket.emit('presence:status', presences)
    }))

    socket.on('post:join', (postId) => {
      if (isId(postId)) socket.join(`post:${postId}`)
    })

    socket.on('post:leave', (postId) => {
      if (isId(postId)) socket.leave(`post:${postId}`)
    })

    await updateUserPresence(userId, true, socket.id)
  })

  return io
}

async function updateUserPresence(
  userId: string,
  isOnline: boolean,
  socketId?: string
) {
  try {
    await prisma.userPresence.upsert({
      where: { userId },
      create: {
        userId,
        isOnline,
        socketId,
        lastSeenAt: new Date()
      },
      update: {
        isOnline,
        socketId: isOnline ? socketId : null,
        lastSeenAt: new Date()
      }
    })
  } catch (error) {
    logger.error('Error updating user presence:', error)
  }
}

async function getUsersPresence(userIds: string[]) {
  try {
    const presences = await prisma.userPresence.findMany({
      where: {
        userId: { in: userIds }
      },
      select: {
        userId: true,
        isOnline: true,
        lastSeenAt: true
      }
    })

    return presences
  } catch (error) {
    logger.error('Error fetching user presence:', error)
    return []
  }
}

async function handleSendMessage(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  data: unknown
) {
  try {
    const senderId = socket.userId!
    const parsed = sendMessageSchema.safeParse(data)
    if (!parsed.success || parsed.data.recipientId === senderId) {
      socket.emit('message:error', { error: 'Invalid message' })
      return
    }
    const { recipientId, content } = parsed.data
    const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { isBanned: true } })
    if (!recipient || recipient.isBanned) {
      socket.emit('message:error', { error: 'Recipient not found' })
      return
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: recipientId },
          { user1Id: recipientId, user2Id: senderId }
        ]
      }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: senderId,
          user2Id: recipientId,
          lastMessageAt: new Date()
        }
      })
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        recipientId,
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    })

    const isUser1 = conversation.user1Id === senderId
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        ...(isUser1
          ? { user2UnreadCount: { increment: 1 } }
          : { user1UnreadCount: { increment: 1 } })
      }
    })

    io.to(`user:${recipientId}`).emit('message:new', message)

    socket.emit('message:sent', message)
  } catch (error) {
    logger.error('Error sending message:', error)
    socket.emit('message:error', { error: 'Failed to send message' })
  }
}

async function handleMarkMessageRead(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  data: { messageId?: unknown }
) {
  try {
    const userId = socket.userId!
    const messageId = data?.messageId
    if (!isId(messageId)) return

    const message = await prisma.message.update({
      where: {
        id: messageId,
        recipientId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    const conversation = await prisma.conversation.findUnique({
      where: { id: message.conversationId }
    })

    if (conversation) {
      const isUser1 = conversation.user1Id === userId
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          ...(isUser1
            ? { user1UnreadCount: { decrement: 1 } }
            : { user2UnreadCount: { decrement: 1 } })
        }
      })
    }

    io.to(`user:${message.senderId}`).emit('message:read', {
      messageId,
      readAt: message.readAt
    })
  } catch (error) {
    logger.error('Error marking message as read:', error)
  }
}

async function handleTypingIndicator(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  data: { recipientId?: unknown; isTyping?: unknown }
) {
  const senderId = socket.userId!
  const recipientId = data?.recipientId
  if (!isId(recipientId)) return
  const isTyping = data?.isTyping === true

  io.to(`user:${recipientId}`).emit('message:typing', {
    userId: senderId,
    isTyping
  })
}

async function handleNotificationRead(
  socket: AuthenticatedSocket,
  notificationId: unknown
) {
  try {
    if (!isId(notificationId)) return
    const { count } = await prisma.notification.updateMany({
      where: { id: notificationId, userId: socket.userId! },
      data: { isRead: true }
    })
    if (count === 0) return

    socket.emit('notification:updated', { notificationId, isRead: true })
  } catch (error) {
    logger.error('Error marking notification as read:', error)
  }
}

let socketInstance: SocketIOServer | null = null

export function getSocketInstance(): SocketIOServer | null {
  return socketInstance
}

export function emitPostLiked(postId: string, userId: string, newLikeCount: number) {
  if (socketInstance) {
    socketInstance.to(`post:${postId}`).emit('post:liked', {
      postId,
      userId,
      likeCount: newLikeCount
    })
  }
}

export function emitPostUnliked(postId: string, userId: string, newLikeCount: number) {
  if (socketInstance) {
    socketInstance.to(`post:${postId}`).emit('post:unliked', {
      postId,
      userId,
      likeCount: newLikeCount
    })
  }
}

export function emitPostCommented(
  postId: string,
  commentId: string,
  userId: string,
  newCommentCount: number
) {
  if (socketInstance) {
    socketInstance.to(`post:${postId}`).emit('post:commented', {
      postId,
      commentId,
      userId,
      commentCount: newCommentCount
    })
  }
}

export function emitPostSaved(postId: string, userId: string, newSaveCount: number) {
  if (socketInstance) {
    socketInstance.to(`post:${postId}`).emit('post:saved', {
      postId,
      userId,
      saveCount: newSaveCount
    })
  }
}

export function emitPostUnsaved(postId: string, userId: string, newSaveCount: number) {
  if (socketInstance) {
    socketInstance.to(`post:${postId}`).emit('post:unsaved', {
      postId,
      userId,
      saveCount: newSaveCount
    })
  }
}

export function emitNewPost(post: Record<string, unknown>) {
  if (socketInstance) {
    socketInstance.emit('feed:new-post', post)
  }
}

export function emitNotificationNew(userId: string, notification: any) {
  if (socketInstance) {
    socketInstance.to(`user:${userId}`).emit('notification:new', notification)
  }
}

export { SocketIOServer }
