import { Router } from 'express'
import * as collectionsController from '../controllers/collectionsController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/user/:userId', authenticate, collectionsController.getUserCollectionsHandler)
router.post('/', authenticate, collectionsController.createCollectionHandler)
router.get('/:id', authenticate, collectionsController.getCollectionByIdHandler)
router.delete('/:id', authenticate, collectionsController.deleteCollectionHandler)
router.post('/:id/posts/:postId', authenticate, collectionsController.addPostToCollectionHandler)
router.delete('/:id/posts/:postId', authenticate, collectionsController.removePostFromCollectionHandler)

export default router
