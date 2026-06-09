import { v2 as cloudinary } from 'cloudinary'
import { env } from './env'
import { logger } from '../utils/logger'

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET
})

export default cloudinary

// Helper function to upload video to Cloudinary
export async function uploadVideo(
  filePath: string,
  folder: string = 'nutrisipe/videos'
): Promise<{
  url: string
  publicId: string
  duration: number
  thumbnailUrl: string
}> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder,
      chunk_size: 6000000, // 6MB chunks
      eager: [
        {
          width: 1280,
          height: 720,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto'
        }
      ],
      eager_async: true
    })

    // Generate thumbnail from video
    const thumbnailUrl = cloudinary.url(result.public_id, {
      resource_type: 'video',
      transformation: [
        { width: 640, height: 360, crop: 'fill' },
        { start_offset: '0', duration: '0.1', format: 'jpg' }
      ]
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration || 0,
      thumbnailUrl
    }
  } catch (error) {
    logger.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload video')
  }
}

// Helper function to delete video from Cloudinary
export async function deleteVideo(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    })
  } catch (error) {
    logger.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete video')
  }
}

// Helper function to upload image (for thumbnails)
export async function uploadImage(
  filePath: string,
  folder: string = 'nutrisipe/images'
): Promise<{
  url: string
  publicId: string
}> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'image',
      folder,
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto' }
      ]
    })

    return {
      url: result.secure_url,
      publicId: result.public_id
    }
  } catch (error) {
    logger.error('Cloudinary image upload error:', error)
    throw new Error('Failed to upload image')
  }
}

// Helper function to delete image from Cloudinary
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    })
  } catch (error) {
    logger.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete image')
  }
}
