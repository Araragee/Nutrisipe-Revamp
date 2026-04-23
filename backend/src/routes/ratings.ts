import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ratingsController from '../controllers/ratingsController'

const router = Router()

// Get ratings for a post
router.get('/post/:postId', ratingsController.getPostRatingsHandler)

// Get user's ratings
router.get('/user/:userId', ratingsController.getUserRatingsHandler)

// Get specific rating (check if user rated a post)
router.get('/check/:postId', authenticate, ratingsController.checkUserRatingHandler)

// Create or update rating (authenticated)
router.post('/', authenticate, ratingsController.createOrUpdateRatingHandler)

// Delete rating (authenticated)
router.delete('/:ratingId', authenticate, ratingsController.deleteRatingHandler)

export default router
