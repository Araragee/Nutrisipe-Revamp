import { Router } from 'express'
import * as authController from '../controllers/authController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/register', authController.registerHandler)
router.post('/login', authController.loginHandler)
router.post('/google-login', authController.googleLoginHandler)
router.post('/logout', authenticate, authController.logoutHandler)
router.post('/dev-login', authController.devLoginHandler)
router.get('/me', authenticate, authController.meHandler)

export default router
