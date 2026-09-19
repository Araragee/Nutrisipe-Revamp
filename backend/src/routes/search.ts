import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as searchController from '../controllers/searchController'

const router = Router()

router.get('/', authenticate, searchController.searchHandler)
router.get('/trending', authenticate, searchController.getTrendingHandler)
router.get('/category/:category', authenticate, searchController.getByCategoryHandler)
router.get('/categories', authenticate, searchController.getCategoriesHandler)
router.get('/tag/:tag', authenticate, searchController.getByTagHandler)
router.get('/trending-tags', searchController.getTrendingTagsHandler)

export default router
