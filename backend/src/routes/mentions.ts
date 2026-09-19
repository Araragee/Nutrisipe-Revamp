import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as mentionsController from '../controllers/mentionsController';

const router = Router()

router.get('/', authenticate, mentionsController.getMyMentionsHandler)
router.get('/search', authenticate, mentionsController.searchMentionableUsersHandler)
router.get('/post/:postId', authenticate, mentionsController.getPostMentionsHandler)
router.get('/comment/:commentId', authenticate, mentionsController.getCommentMentionsHandler)

export default router
