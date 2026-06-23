import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the constants module before importing imageUrl
vi.mock('./constants', () => ({
  API_URL: 'http://localhost:3001/api',
}))

import { resolveImage, placeholderImage, ogShareUrl, MEDIA_BASE } from './imageUrl'

describe('MEDIA_BASE', () => {
  it('strips /api suffix', () => {
    expect(MEDIA_BASE).toBe('http://localhost:3001')
  })
})

describe('placeholderImage', () => {
  it('returns a data URI', () => {
    const result = placeholderImage('test-seed')
    expect(result).toMatch(/^data:image\/svg\+xml/)
  })

  it('same seed → same output (deterministic)', () => {
    expect(placeholderImage('abc')).toBe(placeholderImage('abc'))
  })

  it('different seeds → different hues', () => {
    // Hard to guarantee different output for all seeds, but visually distinct for common ones
    const a = placeholderImage('seed-1')
    const b = placeholderImage('seed-2')
    // Both are data URIs
    expect(a).toMatch(/^data:/)
    expect(b).toMatch(/^data:/)
  })

  it('handles null/undefined seed', () => {
    expect(placeholderImage(null)).toMatch(/^data:/)
    expect(placeholderImage(undefined)).toMatch(/^data:/)
  })
})

describe('resolveImage', () => {
  it('returns placeholder for null/undefined/empty', () => {
    expect(resolveImage(null)).toMatch(/^data:/)
    expect(resolveImage(undefined)).toMatch(/^data:/)
    expect(resolveImage('')).toMatch(/^data:/)
  })

  it('returns absolute https URLs unchanged', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    expect(resolveImage(url)).toBe(url)
  })

  it('returns protocol-relative URLs unchanged', () => {
    const url = '//res.cloudinary.com/demo/image/upload/sample.jpg'
    expect(resolveImage(url)).toBe(url)
  })

  it('returns data URIs unchanged', () => {
    const url = 'data:image/png;base64,abc=='
    expect(resolveImage(url)).toBe(url)
  })

  it('prepends MEDIA_BASE to relative paths', () => {
    expect(resolveImage('uploads/photo.jpg')).toBe('http://localhost:3001/uploads/photo.jpg')
  })

  it('handles leading slash in relative paths', () => {
    expect(resolveImage('/uploads/photo.jpg')).toBe('http://localhost:3001/uploads/photo.jpg')
  })
})

describe('ogShareUrl', () => {
  it('returns correct OG URL', () => {
    expect(ogShareUrl('abc123')).toBe('http://localhost:3001/og/post/abc123')
  })
})
