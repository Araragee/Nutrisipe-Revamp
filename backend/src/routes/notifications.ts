import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as notificationsController from '../controllers/notificationsController'

const router = Router()

router.get('/', authenticate, notificationsController.getNotificationsHandler)

router.put('/:notificationId/read', authenticate, notificationsController.markAsReadHandler)

router.put('/read-all', authenticate, notificationsController.markAllAsReadHandler)

router.delete('/:notificationId', authenticate, notificationsController.deleteNotificationHandler)

export default router
