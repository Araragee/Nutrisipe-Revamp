import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { env } from '../config/env'
import { AppError } from '../middleware/errorHandler'

const UPLOAD_DIR = env.UPLOAD_DIR || 'uploads'

export interface UploadResult {
  url: string
  publicId: string
}

export interface VideoUploadResult extends UploadResult {
  duration: number
}

export async function saveImage(tempPath: string): Promise<UploadResult> {
  try {
    const ext = path.extname(tempPath)
    const filename = `${randomUUID()}${ext}`
    const targetDir = path.join(UPLOAD_DIR, 'images')
    await fs.mkdir(targetDir, { recursive: true })
    
    const targetPath = path.join(targetDir, filename)
    await fs.rename(tempPath, targetPath)
    
    return {
      url: `/uploads/images/${filename}`,
      publicId: filename,
    }
  } catch (error) {
    try {
      await fs.unlink(tempPath)
    } catch (_) {}
    throw new AppError(500, `Failed to save image: ${(error as Error).message}`)
  }
}

export async function saveVideo(tempPath: string): Promise<VideoUploadResult> {
  try {
    const ext = path.extname(tempPath)
    const filename = `${randomUUID()}${ext}`
    const targetDir = path.join(UPLOAD_DIR, 'videos')
    await fs.mkdir(targetDir, { recursive: true })
    
    const targetPath = path.join(targetDir, filename)
    await fs.rename(tempPath, targetPath)
    
    return {
      url: `/uploads/videos/${filename}`,
      publicId: filename,
      duration: 0, // No server ffmpeg dependency; default duration to 0
    }
  } catch (error) {
    try {
      await fs.unlink(tempPath)
    } catch (_) {}
    throw new AppError(500, `Failed to save video: ${(error as Error).message}`)
  }
}

export async function deleteFile(relativeUrl: string): Promise<void> {
  if (!relativeUrl) return
  if (relativeUrl.includes('..')) {
    throw new AppError(400, 'Invalid file path')
  }
  
  const cleanPath = relativeUrl.replace(/^\/uploads\//, '')
  const fullPath = path.join(UPLOAD_DIR, cleanPath)
  
  try {
    await fs.unlink(fullPath)
  } catch (_) {
    // Ignore if file doesn't exist
  }
}
