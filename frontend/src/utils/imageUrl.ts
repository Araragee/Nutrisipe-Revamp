import { API_URL } from './constants'

export const MEDIA_BASE = API_URL.replace(/\/api\/?$/, '')

export function ogShareUrl(postId: string): string {
  return `${MEDIA_BASE}/og/post/${postId}`
}

function hashSeed(seed: string | number | undefined | null): number {
  if (seed == null) return 0
  const s = String(seed)
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function placeholderImage(seed?: string | number | null): string {
  const hue = (hashSeed(seed) % 36) * 10
  const hueB = (hue + 35) % 360
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 10'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0%' stop-color='hsl(${hue} 78% 62%)'/>` +
    `<stop offset='100%' stop-color='hsl(${hueB} 72% 48%)'/>` +
    `</linearGradient></defs>` +
    `<rect width='8' height='10' fill='url(#g)'/>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function resolveImage(
  url?: string | null,
  seed?: string | number | null,
): string {
  if (!url) return placeholderImage(seed)
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url
  return `${MEDIA_BASE}/${url.replace(/^\/+/, '')}`
}

const CLOUDINARY_RE = /\/image\/upload\//
const DEFAULT_WIDTHS = [400, 800, 1200, 1600]

export interface ResolvedSrcset {
  src: string
  srcset: string | undefined
}

export function resolveSrcset(
  url?: string | null,
  seed?: string | number | null,
  widths: number[] = DEFAULT_WIDTHS,
): ResolvedSrcset {
  const resolved = resolveImage(url, seed)
  if (resolved.startsWith('data:')) return { src: resolved, srcset: undefined }
  if (!CLOUDINARY_RE.test(resolved)) return { src: resolved, srcset: undefined }

  const variants = widths.map((w) => {
    const transformed = resolved.replace(
      CLOUDINARY_RE,
      `/image/upload/w_${w},c_limit,q_auto,f_auto/`,
    )
    return `${transformed} ${w}w`
  })
  const largest = widths[widths.length - 1]
  const src = resolved.replace(
    CLOUDINARY_RE,
    `/image/upload/w_${largest},c_limit,q_auto,f_auto/`,
  )
  return { src, srcset: variants.join(', ') }
}
