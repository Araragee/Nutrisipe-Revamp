import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ratingsController from '../controllers/ratingsController'

const router = Router()

router.get('/post/:postId', ratingsController.getPostRatingsHandler)

router.get('/user/:userId', ratingsController.getUserRatingsHandler)

router.get('/check/:postId', authenticate, ratingsController.checkUserRatingHandler)

router.post('/', authenticate, ratingsController.createOrUpdateRatingHandler)

router.delete('/:ratingId', authenticate, ratingsController.deleteRatingHandler)

export default router
