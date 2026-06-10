import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as mealPlansController from '../controllers/mealPlansController'

const router = Router()

router.use(authenticate)

router.get('/grocery', mealPlansController.groceryHandler)
router.get('/', mealPlansController.listHandler)
router.post('/', mealPlansController.createHandler)
router.put('/:id', mealPlansController.updateHandler)
router.delete('/:id', mealPlansController.deleteHandler)

export default router
