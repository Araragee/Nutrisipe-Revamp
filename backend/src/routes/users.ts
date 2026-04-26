import { Router } from 'express'
import * as usersController from '../controllers/usersController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/search', usersController.searchUsersHandler)
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

export default router
