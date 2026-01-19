import { Router } from 'express'
import * as postsController from '../controllers/postsController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/feed', authenticate, postsController.getFeedHandler)
router.get('/search', postsController.searchPostsHandler)
router.get('/user/:userId', postsController.getPostsByUserHandler)
router.get('/:id', postsController.getPostByIdHandler)

router.post('/', authenticate, postsController.createPostHandler)
router.put('/:id', authenticate, postsController.updatePostHandler)
router.delete('/:id', authenticate, postsController.deletePostHandler)

export default router
