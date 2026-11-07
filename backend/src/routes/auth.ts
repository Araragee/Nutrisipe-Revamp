import { Router } from 'express'
import * as authController from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { env } from '../config/env'

const router = Router()

router.post('/register', authController.registerHandler)
router.post('/login', authController.loginHandler)
router.post('/logout', authenticate, authController.logoutHandler)
router.post('/logout-all', authenticate, authController.logoutAllHandler)

if (env.NODE_ENV !== 'production') {
  router.post('/dev-login', authController.devLoginHandler)
  // SECURITY: google-login trusts the email in the request body and never verifies a Google ID token,
  // so anyone could sign in as any user. Dev-only until it verifies the credential server-side.
  router.post('/google-login', authController.googleLoginHandler)
}
router.get('/me', authenticate, authController.meHandler)

export default router
