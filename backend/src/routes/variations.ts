import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as variationsController from '../controllers/variationsController'

const router = Router()

router.post('/:postId/fork', authenticate, variationsController.forkRecipeHandler)

router.get('/:postId/variations', variationsController.getVariationsHandler)

router.get('/:postId/original', variationsController.getOriginalRecipeHandler)

router.get('/:postId/chain', variationsController.getVariationChainHandler)

router.delete('/:variationId', authenticate, variationsController.deleteVariationHandler)

export default router
