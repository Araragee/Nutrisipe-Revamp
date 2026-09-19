import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as reportsController from '../controllers/reportsController'

const router = Router()

router.post('/', authenticate, reportsController.createReportHandler)
router.get('/my-reports', authenticate, reportsController.getMyReportsHandler)

export default router
