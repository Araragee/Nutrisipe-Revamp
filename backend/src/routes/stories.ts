import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/auth'
import * as storiesController from '../controllers/storiesController'

const router = Router()

// 20 story creations per IP per hour
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many stories created, please slow down',
})

router.get('/feed', authenticate, storiesController.feedHandler)
router.post('/', authenticate, createLimiter, storiesController.createHandler)
router.post('/:id/view', authenticate, storiesController.viewHandler)
router.delete('/:id', authenticate, storiesController.deleteHandler)

export default router
