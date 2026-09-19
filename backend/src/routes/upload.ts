import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { uploadVideo, uploadImage, uploadVideoWithThumbnail } from '../middleware/upload'
import * as uploadController from '../controllers/uploadController'

const router = Router()

router.post(
  '/video',
  authenticate,
  uploadVideo.single('video'),
  uploadController.uploadVideoHandler
)

router.post(
  '/image',
  authenticate,
  uploadImage.single('image'),
  uploadController.uploadImageHandler
)

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
