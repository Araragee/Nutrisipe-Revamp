import { Router } from 'express'
import * as ogController from '../controllers/ogController'

const router = Router()

router.get('/post/:id', ogController.getPostOgHandler)

export default router
