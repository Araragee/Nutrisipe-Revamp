import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as messagesController from '../controllers/messagesController'

const router = Router()

router.get('/conversations', authenticate, messagesController.getConversationsHandler)
router.get('/conversations/:userId', authenticate, messagesController.getConversationMessagesHandler)
router.post('/send', authenticate, messagesController.sendMessageHandler)
router.put('/conversations/:userId/read', authenticate, messagesController.markConversationReadHandler)
router.get('/unread-count', authenticate, messagesController.getUnreadCountHandler)
router.delete('/:messageId', authenticate, messagesController.deleteMessageHandler)

export default router
