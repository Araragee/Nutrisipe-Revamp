// @ts-ignore
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { AppError } from './errorHandler'
import { env } from '../config/env'

const TEMP_DIR = path.join(env.UPLOAD_DIR || 'uploads', 'temp')

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/mpeg': '.mpeg',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
  'video/x-msvideo': '.avi',
  'video/x-ms-wmv': '.wmv',
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, TEMP_DIR)
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex')
    const ext = EXT_BY_MIME[file.mimetype] || ''
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

const videoFilter = (_req: any, file: any, cb: any) => {
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

const imageFilter = (_req: any, file: any, cb: any) => {
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

export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  }
})

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
})

export const uploadVideoWithThumbnail = multer({
  storage,
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.fieldname === 'video') {
      videoFilter(req, file, cb)
    } else if (file.fieldname === 'thumbnail') {
      imageFilter(req, file, cb)
    } else {
      cb(new AppError(400, 'Unexpected field'))
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 2
  }
})
