import { Router } from 'express'
import * as authController from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { env } from '../config/env'

const router = Router()

router.post('/register', authController.registerHandler)
router.post('/login', authController.loginHandler)
router.post('/google-login', authController.googleLoginHandler)
router.post('/logout', authenticate, authController.logoutHandler)

// Passwordless demo login for seeded accounts — never registered in production.
if (env.NODE_ENV !== 'production') {
  router.post('/dev-login', authController.devLoginHandler)
}
router.get('/me', authenticate, authController.meHandler)

export default router
