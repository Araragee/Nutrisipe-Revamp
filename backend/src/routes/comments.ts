import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as commentsController from '../controllers/commentsController'

const router = Router()

router.get('/post/:postId', commentsController.getCommentsByPostHandler)

router.post('/', authenticate, commentsController.createCommentHandler)

router.put('/:commentId', authenticate, commentsController.updateCommentHandler)

router.delete('/:commentId', authenticate, commentsController.deleteCommentHandler)

export default router
