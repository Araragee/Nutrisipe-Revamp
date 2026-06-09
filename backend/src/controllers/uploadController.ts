import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { uploadVideo as uploadVideoToCloud, uploadImage as uploadImageToCloud } from '../config/cloudinary'
import fs from 'fs/promises'

export async function uploadVideoHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      throw new AppError(400, 'No video file provided')
    }

    // Upload to Cloudinary
    const result = await uploadVideoToCloud(req.file.path)

    // Delete temporary file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        videoUrl: result.url,
        thumbnailUrl: result.thumbnailUrl,
        duration: result.duration,
        publicId: result.publicId
      }
    })
  } catch (error) {
    // Clean up temp file if it exists
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path)
      } catch (err) {
        // Ignore if file doesn't exist
      }
    }
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

    // Upload to Cloudinary
    const result = await uploadImageToCloud(req.file.path)

    // Delete temporary file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: result.url,
        publicId: result.publicId
      }
    })
  } catch (error) {
    // Clean up temp file if it exists
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path)
      } catch (err) {
        // Ignore if file doesn't exist
      }
    }
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

    if (!files.video || files.video.length === 0) {
      throw new AppError(400, 'No video file provided')
    }

    const videoFile = files.video[0]
    let thumbnailFile = files.thumbnail?.[0]

    // Upload video to Cloudinary
    const videoResult = await uploadVideoToCloud(videoFile.path)

    // Delete temporary video file
    await fs.unlink(videoFile.path)

    let customThumbnailUrl = videoResult.thumbnailUrl

    // If custom thumbnail provided, upload it
    if (thumbnailFile) {
      try {
        const thumbnailResult = await uploadImageToCloud(thumbnailFile.path)
        customThumbnailUrl = thumbnailResult.url

        // Delete temporary thumbnail file
        await fs.unlink(thumbnailFile.path)
      } catch (err) {
        // TODO(audit:B-11) [MEDIUM] Custom thumbnail failure is swallowed — user silently gets the auto-generated one; surface a warning in the response.
        console.error('Thumbnail upload failed, using auto-generated:', err)
      }
    }

    res.json({
      success: true,
      message: 'Video and thumbnail uploaded successfully',
      data: {
        videoUrl: videoResult.url,
        thumbnailUrl: customThumbnailUrl,
        duration: videoResult.duration,
        publicId: videoResult.publicId
      }
    })
  } catch (error) {
    // Clean up temp files if they exist
    const files = req.files as { [fieldname: string]: any[] }
    if (files) {
      const allFiles = [
        ...(files.video || []),
        ...(files.thumbnail || [])
      ]
      for (const file of allFiles) {
        try {
          await fs.unlink(file.path)
        } catch (err) {
          // Ignore if file doesn't exist
        }
      }
    }
    next(error)
  }
}
