import { Router } from 'express'
import * as socialController from '../controllers/socialController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/follow/:userId', authenticate, socialController.followUserHandler)
router.delete('/follow/:userId', authenticate, socialController.unfollowUserHandler)

router.post('/like/:postId', authenticate, socialController.likePostHandler)
router.delete('/like/:postId', authenticate, socialController.unlikePostHandler)

router.post('/save/:postId', authenticate, socialController.savePostHandler)
router.delete('/save/:postId', authenticate, socialController.unsavePostHandler)

export default router
