import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { uploadVideo, uploadImage, uploadVideoWithThumbnail } from '../middleware/upload'
import * as uploadController from '../controllers/uploadController'

const router = Router()

// Upload video only
router.post(
  '/video',
  authenticate,
  uploadVideo.single('video'),
  uploadController.uploadVideoHandler
)

// Upload image only
router.post(
  '/image',
  authenticate,
  uploadImage.single('image'),
  uploadController.uploadImageHandler
)

// Upload video with optional thumbnail
router.post(
  '/video-with-thumbnail',
  authenticate,
  uploadVideoWithThumbnail.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  uploadController.uploadVideoWithThumbnailHandler
)

export default router
