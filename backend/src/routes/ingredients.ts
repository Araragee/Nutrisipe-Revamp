import { Router } from 'express'
import * as ingredientsController from '../controllers/ingredientsController'
import { authenticate } from '../middleware/auth'
import { adminOnly } from '../middleware/roles'

const router = Router()

router.get('/', ingredientsController.listHandler)
router.get('/:id', ingredientsController.getByIdHandler)
router.post('/', authenticate, adminOnly, ingredientsController.createHandler)
router.put('/:id', authenticate, adminOnly, ingredientsController.updateHandler)
router.delete('/:id', authenticate, adminOnly, ingredientsController.deleteHandler)

export default router
