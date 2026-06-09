import { logger } from '../utils/logger'
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { verifyToken } from '../utils/jwt'
import { prisma } from '../lib/prisma'
import { env } from '../config/env'

interface AuthenticatedSocket extends Socket {
  userId?: string
}

export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    }
  })

  // Store socket instance for use in other modules
  socketInstance = io

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const payload = verifyToken(token)
      socket.userId = payload.userId

      next()
    } catch (error) {
      next(new Error('Invalid authentication token'))
    }
  })

  // Connection handler
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!
    logger.log(`User connected: ${userId}`)

    // Update user presence to online
    await updateUserPresence(userId, true, socket.id)

    // Join user's personal room for notifications
    socket.join(`user:${userId}`)

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.log(`User disconnected: ${userId}`)
      await updateUserPresence(userId, false)
    })

    // Direct Messaging Events
    socket.on('message:send', async (data) => {
      await handleSendMessage(io, socket, data)
    })

    socket.on('message:read', async (data) => {
      await handleMarkMessageRead(io, socket, data)
    })

    socket.on('message:typing', async (data) => {
      await handleTypingIndicator(io, socket, data)
    })

    // Conversation Events
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
    })

    // Real-time Notifications
    socket.on('notification:read', async (notificationId: string) => {
      await handleNotificationRead(socket, notificationId)
    })

    // Presence Events
    socket.on('presence:check', async (userIds: string[]) => {
      const presences = await getUsersPresence(userIds)
      socket.emit('presence:status', presences)
    })

    // Feed Events - Join/Leave post rooms for real-time updates
    socket.on('post:join', (postId: string) => {
      socket.join(`post:${postId}`)
    })

    socket.on('post:leave', (postId: string) => {
      socket.leave(`post:${postId}`)
    })
  })

  return io
}

// Helper Functions

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
  data: { recipientId: string; content: string }
) {
  try {
    const senderId = socket.userId!
    const { recipientId, content } = data

    // Find or create conversation
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

    // Create message
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

    // Update conversation
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

    // Emit to recipient
    io.to(`user:${recipientId}`).emit('message:new', message)

    // Emit to sender (for multi-device sync)
    socket.emit('message:sent', message)
  } catch (error) {
    logger.error('Error sending message:', error)
    socket.emit('message:error', { error: 'Failed to send message' })
  }
}

async function handleMarkMessageRead(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  data: { messageId: string }
) {
  try {
    const userId = socket.userId!
    const { messageId } = data

    // Update message
    const message = await prisma.message.update({
      where: {
        id: messageId,
        recipientId: userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    // Update conversation unread count
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

    // Notify sender
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
  data: { recipientId: string; isTyping: boolean }
) {
  const senderId = socket.userId!
  const { recipientId, isTyping } = data

  // Emit to recipient
  io.to(`user:${recipientId}`).emit('message:typing', {
    userId: senderId,
    isTyping
  })
}

async function handleNotificationRead(
  socket: AuthenticatedSocket,
  notificationId: string
) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    })

    socket.emit('notification:updated', { notificationId, isRead: true })
  } catch (error) {
    logger.error('Error marking notification as read:', error)
  }
}

// Helper functions to emit real-time feed updates
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
    // Broadcast to all connected users (they can filter on client side)
    socketInstance.emit('feed:new-post', post)
  }
}

export function emitNotificationNew(userId: string, notification: any) {
  if (socketInstance) {
    socketInstance.to(`user:${userId}`).emit('notification:new', notification)
  }
}

export { SocketIOServer }
