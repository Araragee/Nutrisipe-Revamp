import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { adminOnly } from '../middleware/roles'
import * as adminController from '../controllers/adminController'

const router = Router()

router.get('/stats', authenticate, adminOnly, adminController.getStatsHandler)
router.get('/users', authenticate, adminOnly, adminController.listUsersHandler)
router.put('/users/:id/role', authenticate, adminOnly, adminController.updateUserRoleHandler)
router.post('/users/:id/ban', authenticate, adminOnly, adminController.banUserHandler)
router.post('/users/:id/unban', authenticate, adminOnly, adminController.unbanUserHandler)
router.get('/reports', authenticate, adminOnly, adminController.listReportsHandler)
router.put('/reports/:id', authenticate, adminOnly, adminController.updateReportHandler)
router.delete('/posts/:id', authenticate, adminOnly, adminController.deletePostHandler)
router.delete('/comments/:id', authenticate, adminOnly, adminController.deleteCommentHandler)

export default router
