import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as variationsController from '../controllers/variationsController'

const router = Router()

// Fork a recipe (create variation)
router.post('/:postId/fork', authenticate, variationsController.forkRecipeHandler)

// Get variations of a recipe
router.get('/:postId/variations', variationsController.getVariationsHandler)

// Get original recipe (if this is a variation)
router.get('/:postId/original', variationsController.getOriginalRecipeHandler)

// Get variation chain (full lineage)
router.get('/:postId/chain', variationsController.getVariationChainHandler)

// Delete variation relationship (but keeps the variation post)
router.delete('/:variationId', authenticate, variationsController.deleteVariationHandler)

export default router
