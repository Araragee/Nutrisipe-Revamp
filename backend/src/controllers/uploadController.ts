import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import * as storageService from '../services/storageService'

export async function uploadVideoHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      throw new AppError(400, 'No video file provided')
    }

    const result = await storageService.saveVideo(req.file.path)

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        videoUrl: result.url,
        thumbnailUrl: null,
        duration: result.duration,
        publicId: result.publicId
      }
    })
  } catch (error) {
    next(error)
  }
}

export async function uploadImageHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      throw new AppError(400, 'No image file provided')
    }

    const result = await storageService.saveImage(req.file.path)

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: result.url,
        publicId: result.publicId
      }
    })
  } catch (error) {
    next(error)
  }
}

export async function uploadVideoWithThumbnailHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const files = req.files as { [fieldname: string]: any[] }

    if (!files || !files.video || files.video.length === 0) {
      throw new AppError(400, 'No video file provided')
    }

    const videoFile = files.video[0]
    let thumbnailFile = files.thumbnail?.[0]

    const videoResult = await storageService.saveVideo(videoFile.path)

    let customThumbnailUrl = null
    let thumbnailWarning: string | undefined

    if (thumbnailFile) {
      try {
        const thumbnailResult = await storageService.saveImage(thumbnailFile.path)
        customThumbnailUrl = thumbnailResult.url
      } catch (err) {
        thumbnailWarning = 'Custom thumbnail upload failed.'
      }
    }

    res.json({
      success: true,
      message: 'Video and thumbnail uploaded successfully',
      ...(thumbnailWarning && { warning: thumbnailWarning }),
      data: {
        videoUrl: videoResult.url,
        thumbnailUrl: customThumbnailUrl,
        duration: videoResult.duration,
        publicId: videoResult.publicId
      }
    })
  } catch (error) {
    next(error)
  }
}
