import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { env } from '../config/env'
import { logger } from '../utils/logger'

const router = Router()

const APP_URL = env.CORS_ORIGIN

function getAbsoluteImageUrl(url: string | null, req: Request): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  const base = env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
  return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Sanitize a URL for use inside a CSS url('...') value.
 *  Strips characters that could escape the CSS string context. */
function escapeCssUrl(url: string): string {
  // Only allow safe Cloudinary/https URLs; strip anything after a ) or newline
  if (!url) return ''
  // Block CSS injection: disallow ) \n \r (they break the url() context)
  if (/[)\n\r]/.test(url)) return ''
  // Only permit http/https URLs from known Cloudinary pattern or empty
  if (!/^https?:\/\//i.test(url)) return ''
  return url.replace(/'/g, '%27') // escape single quotes inside url('...')
}

function transformedImageUrl(url: string | null): string {
  if (!url) return ''
  if (url.includes('/image/upload/')) {
    return url.replace(
      '/image/upload/',
      '/image/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/',
    )
  }
  return url
}

router.get('/post/:id', async (req: Request, res: Response) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    })

    if (!post || !post.isPublic) {
      res.status(404).send('Recipe not found')
      return
    }

    const title = escapeHtml(post.title)
    const description = escapeHtml(post.description?.slice(0, 200) || `Recipe by ${post.user.displayName}`)
    const absoluteImgUrl = getAbsoluteImageUrl(post.imageUrl, req)
    // HTML-escaped image URL for use in meta content attributes
    const imageHtml = escapeHtml(transformedImageUrl(absoluteImgUrl))
    // CSS-safe image URL for background-image url()
    const imageCss = escapeCssUrl(transformedImageUrl(absoluteImgUrl))
    const author = escapeHtml(post.user.displayName)
    // canonical is MEDIA_BASE (trusted env var) + UUID from DB — safe
    const canonical = `${APP_URL}/recipes/${escapeHtml(post.id)}`
    const rating = post.averageRating ? post.averageRating.toFixed(1) : null

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} · Nutrisipe</title>
  <meta name="description" content="${description}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Nutrisipe">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageHtml}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${canonical}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageHtml}">

  <link rel="canonical" href="${canonical}">
  <meta http-equiv="refresh" content="0; url=${canonical}">
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #faf6ee 0%, #fae0c8 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: #1a0f08;
    }
    .card {
      max-width: 480px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(20, 10, 0, 0.18);
      text-align: center;
    }
    .hero {
      width: 100%;
      aspect-ratio: 16 / 9;
      background-image: url('${imageCss}');
      background-size: cover;
      background-position: center;
    }
    .body { padding: 28px; }
    h1 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .author { color: #6d655e; font-size: 13px; margin-bottom: 18px; }
    .rating { color: #ff6b35; font-weight: 700; font-size: 14px; }
    .cta {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      border-radius: 14px;
      background: linear-gradient(135deg, #ff6b35, #ffaa6b);
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      box-shadow: 0 8px 22px rgba(255, 107, 53, 0.35);
    }
    .brand {
      display: block;
      margin-top: 16px;
      color: #87807a;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="hero" role="img" aria-label="${title}"></div>
    <div class="body">
      <h1>${title}</h1>
      <p class="author">By ${author}</p>
      ${rating ? `<p class="rating">★ ${rating} rating</p>` : ''}
      <a class="cta" href="${canonical}">Open in Nutrisipe →</a>
      <span class="brand">Nutrisipe</span>
    </div>
  </div>
  <script>setTimeout(function(){ window.location.replace(${JSON.stringify(canonical)}) }, 50)</script>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.send(html)
  } catch (error) {
    logger.error('OG render error:', error)
    res.status(500).send('Failed to render preview')
  }
})

export default router
