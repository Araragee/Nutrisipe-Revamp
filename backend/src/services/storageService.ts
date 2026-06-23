import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { env } from '../config/env'
import { AppError } from '../middleware/errorHandler'
import { supabase } from '../lib/supabase'

export interface UploadResult {
  url: string
  publicId: string
}

export interface VideoUploadResult extends UploadResult {
  duration: number
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
  }
  return map[ext.toLowerCase()] || 'application/octet-stream'
}

export async function saveImage(tempPath: string): Promise<UploadResult> {
  let fileBuffer: Buffer | null = null
  try {
    const ext = path.extname(tempPath)
    const filename = `${randomUUID()}${ext}`
    const storagePath = `images/${filename}`
    const contentType = getContentType(ext)

    fileBuffer = await fs.readFile(tempPath)

    const { error } = await supabase.storage
      .from(env.SUPABASE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      throw new Error(error.message)
    }

    const { data } = supabase.storage
      .from(env.SUPABASE_BUCKET)
      .getPublicUrl(storagePath)

    return {
      url: data.publicUrl,
      publicId: storagePath,
    }
  } catch (error) {
    throw new AppError(500, `Failed to save image: ${(error as Error).message}`)
  } finally {
    try {
      await fs.unlink(tempPath)
    } catch (_) {}
  }
}

export async function saveVideo(tempPath: string): Promise<VideoUploadResult> {
  let fileBuffer: Buffer | null = null
  try {
    const ext = path.extname(tempPath)
    const filename = `${randomUUID()}${ext}`
    const storagePath = `videos/${filename}`
    const contentType = getContentType(ext)

    fileBuffer = await fs.readFile(tempPath)

    const { error } = await supabase.storage
      .from(env.SUPABASE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      throw new Error(error.message)
    }

    const { data } = supabase.storage
      .from(env.SUPABASE_BUCKET)
      .getPublicUrl(storagePath)

    return {
      url: data.publicUrl,
      publicId: storagePath,
      duration: 0,
    }
  } catch (error) {
    throw new AppError(500, `Failed to save video: ${(error as Error).message}`)
  } finally {
    try {
      await fs.unlink(tempPath)
    } catch (_) {}
  }
}

export async function deleteFile(relativeUrl: string): Promise<void> {
  if (!relativeUrl) return
  if (relativeUrl.includes('..')) {
    throw new AppError(400, 'Invalid file path')
  }

  let storagePath = relativeUrl
  if (relativeUrl.startsWith('http')) {
    const bucketName = env.SUPABASE_BUCKET
    const token = `/public/${bucketName}/`
    const index = relativeUrl.indexOf(token)
    if (index !== -1) {
      storagePath = relativeUrl.slice(index + token.length)
    }
  } else {
    storagePath = relativeUrl.replace(/^\/uploads\//, '')
  }

  try {
    const { error } = await supabase.storage
      .from(env.SUPABASE_BUCKET)
      .remove([storagePath])
    if (error) {
      throw new Error(error.message)
    }
  } catch (_) {
    // Ignore error, log it or proceed
  }
}
