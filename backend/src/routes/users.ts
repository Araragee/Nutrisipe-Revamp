import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as usersController from '../controllers/usersController'
import { authenticate } from '../middleware/auth'

const router = Router()

const deletionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many account deletion attempts. Try again later.',
})

router.get('/search', usersController.searchUsersHandler)
router.get('/popular', usersController.getPopularHandler)
router.get('/suggestions', authenticate, usersController.getSuggestionsHandler)
router.get('/preferences', authenticate, usersController.getUserPreferencesHandler)
router.post('/preferences', authenticate, usersController.updatePreferencesHandler)
router.get('/:id', usersController.getUserByIdHandler)
router.get('/:id/followers', usersController.getUserFollowersHandler)
router.get('/:id/following', usersController.getUserFollowingHandler)
router.get('/:id/activity', usersController.getUserActivityHandler)
router.get('/:id/saved', authenticate, usersController.getSavedPostsHandler)
router.get('/:id/liked', usersController.getLikedPostsHandler)

router.put('/profile', authenticate, usersController.updateProfileHandler)
router.delete('/me', deletionLimiter, authenticate, usersController.deleteMeHandler)
router.post('/me/cancel-deletion', authenticate, usersController.cancelDeleteMeHandler)

export default router
