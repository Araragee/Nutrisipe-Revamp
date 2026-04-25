import multer from 'multer'
import path from 'path'
import { AppError } from './errorHandler'

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/temp')
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// File filter for videos
const videoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-ms-wmv'
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(400, 'Invalid video format. Allowed: MP4, MOV, WebM, AVI, WMV'))
  }
}

// File filter for images
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(400, 'Invalid image format. Allowed: JPEG, PNG, WebP, GIF'))
  }
}

// Video upload configuration
export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  }
})

// Image upload configuration
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
})

// Mixed upload (video + thumbnail)
export const uploadVideoWithThumbnail = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      videoFilter(req, file, cb)
    } else if (file.fieldname === 'thumbnail') {
      imageFilter(req, file, cb)
    } else {
      cb(new AppError(400, 'Unexpected field'))
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 2 // video + thumbnail
  }
})
