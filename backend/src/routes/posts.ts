import { Router } from 'express'
import * as postsController from '../controllers/postsController'
import { authenticate, optionalAuthenticate } from '../middleware/auth'

const router = Router()

router.get('/feed', authenticate, postsController.getFeedHandler)
router.get('/following', authenticate, postsController.getFollowingFeedHandler)
router.get('/recommendations', authenticate, postsController.getRecommendationsHandler)
router.get('/ingredients', postsController.getAllIngredientsHandler)
router.get('/search', optionalAuthenticate, postsController.searchPostsHandler)
router.get('/tags/:tag', optionalAuthenticate, postsController.getPostsByTagHandler)
router.get('/user/:userId', optionalAuthenticate, postsController.getPostsByUserHandler)
router.get('/:id', optionalAuthenticate, postsController.getPostByIdHandler)
router.get('/:id/related', optionalAuthenticate, postsController.getRelatedPostsHandler)

router.post('/', authenticate, postsController.createPostHandler)
router.put('/:id', authenticate, postsController.updatePostHandler)
router.delete('/:id', authenticate, postsController.deletePostHandler)

export default router
