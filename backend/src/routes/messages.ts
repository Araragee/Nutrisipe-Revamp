import { logger } from '../utils/logger'
import { Router, Response } from 'express'
import { auth } from '../middleware/auth'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { parsePagination } from '../utils/pagination'

const router = Router()

// Get user's conversations
router.get('/conversations', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }]
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        user2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            isRead: true,
            senderId: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    // Transform to include the other user and unread count
    const transformedConversations = conversations.map((conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1
      const unreadCount =
        conv.user1Id === userId
          ? conv.user1UnreadCount
          : conv.user2UnreadCount

      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.messages[0] || null,
        unreadCount,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt
      }
    })

    res.json({ data: transformedConversations })
  } catch (error) {
    logger.error('Error fetching conversations:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// Get messages in a conversation
router.get(
  '/conversations/:userId',
  auth,
  async (req: AuthRequest, res: Response) => {
    try {
      const currentUserId = req.userId!
      const { userId: otherUserId } = req.params
      const { page, limit } = parsePagination(req, 50)

      // Find conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: currentUserId, user2Id: otherUserId },
            { user1Id: otherUserId, user2Id: currentUserId }
          ]
        }
      })

      if (!conversation) {
        return res.json({ data: [], total: 0, page, limit })
      }

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId: conversation.id },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.message.count({
          where: { conversationId: conversation.id }
        })
      ])

      res.json({
        data: messages.reverse(),
        total,
        page,
        limit,
        conversationId: conversation.id
      })
      return
    } catch (error) {
      logger.error('Error fetching messages:', error)
      res.status(500).json({ error: 'Failed to fetch messages' })
      return
    }
  }
)

// Send a message (REST endpoint - mainly for fallback)
router.post('/send', auth, async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.userId!
    const { recipientId, content } = req.body

    if (!recipientId || !content) {
      return res
        .status(400)
        .json({ error: 'Recipient ID and content are required' })
    }

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

    // Emit via Socket.IO if available
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${recipientId}`).emit('message:new', message)
    }

    return res.status(201).json({ data: message })
  } catch (error) {
    logger.error('Error sending message:', error)
    return res.status(500).json({ error: 'Failed to send message' })
  }
})

// Mark messages as read
router.put(
  '/conversations/:userId/read',
  auth,
  async (req: AuthRequest, res: Response) => {
    try {
      const currentUserId = req.userId!
      const { userId: otherUserId } = req.params

      // Find conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: currentUserId, user2Id: otherUserId },
            { user1Id: otherUserId, user2Id: currentUserId }
          ]
        }
      })

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' })
      }

      // Mark all unread messages as read
      await prisma.message.updateMany({
        where: {
          conversationId: conversation.id,
          recipientId: currentUserId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      // Reset unread count
      const isUser1 = conversation.user1Id === currentUserId
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          ...(isUser1
            ? { user1UnreadCount: 0 }
            : { user2UnreadCount: 0 })
        }
      })

      res.json({ success: true })
      return
    } catch (error) {
      logger.error('Error marking messages as read:', error)
      res.status(500).json({ error: 'Failed to mark messages as read' })
      return
    }
  }
)

// Get total unread message count
router.get('/unread-count', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }]
      },
      select: {
        user1Id: true,
        user1UnreadCount: true,
        user2UnreadCount: true
      }
    })

    const totalUnread = conversations.reduce((sum, conv) => {
      return (
        sum +
        (conv.user1Id === userId
          ? conv.user1UnreadCount
          : conv.user2UnreadCount)
      )
    }, 0)

    res.json({ data: { unreadCount: totalUnread } })
  } catch (error) {
    logger.error('Error fetching unread count:', error)
    res.status(500).json({ error: 'Failed to fetch unread count' })
  }
})

// Delete a message
router.delete('/:messageId', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const { messageId } = req.params

    // Only allow sender to delete
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' })
    }

    await prisma.message.delete({
      where: { id: messageId }
    })

    res.json({ success: true })
    return
  } catch (error) {
    logger.error('Error deleting message:', error)
    res.status(500).json({ error: 'Failed to delete message' })
    return
  }
})

export default router
