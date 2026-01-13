import { Router } from 'express'
import * as authController from '../controllers/authController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/register', authController.registerHandler)
router.post('/login', authController.loginHandler)
router.get('/me', authenticate, authController.meHandler)

export default router
