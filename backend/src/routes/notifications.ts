import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as notificationsController from '../controllers/notificationsController'

const router = Router()

// Get notifications (authenticated)
router.get('/', authenticate, notificationsController.getNotificationsHandler)

// Mark notification as read (authenticated)
router.put('/:notificationId/read', authenticate, notificationsController.markAsReadHandler)

// Mark all notifications as read (authenticated)
router.put('/read-all', authenticate, notificationsController.markAllAsReadHandler)

// Delete notification (authenticated)
router.delete('/:notificationId', authenticate, notificationsController.deleteNotificationHandler)

export default router
