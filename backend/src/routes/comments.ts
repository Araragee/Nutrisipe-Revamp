import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as commentsController from '../controllers/commentsController'

const router = Router()

// Get comments for a post
router.get('/post/:postId', commentsController.getCommentsByPostHandler)

// Create comment (authenticated)
router.post('/', authenticate, commentsController.createCommentHandler)

// Update comment (authenticated)
router.put('/:commentId', authenticate, commentsController.updateCommentHandler)

// Delete comment (authenticated)
router.delete('/:commentId', authenticate, commentsController.deleteCommentHandler)

export default router
