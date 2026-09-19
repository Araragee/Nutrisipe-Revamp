import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { mkdirSync, writeFileSync, unlinkSync } from 'fs'
import path from 'path'
import { env } from './config/env'
import { logger } from './utils/logger'

const UPLOAD_DIR = env.UPLOAD_DIR || 'uploads'
try {
  mkdirSync(path.join(UPLOAD_DIR, 'temp'), { recursive: true })
  mkdirSync(path.join(UPLOAD_DIR, 'images'), { recursive: true })
  mkdirSync(path.join(UPLOAD_DIR, 'videos'), { recursive: true })

  const probeFile = path.join(UPLOAD_DIR, '.write-probe')
  writeFileSync(probeFile, 'probe')
  unlinkSync(probeFile)
} catch (err) {
  console.error(`FATAL: Upload directory "${UPLOAD_DIR}" is not writable:`, err)
  process.exit(1)
}
import { errorHandler } from './middleware/errorHandler'
import { initializeSocketServer } from './socket'
import authRoutes from './routes/auth'
import postsRoutes from './routes/posts'
import usersRoutes from './routes/users'
import socialRoutes from './routes/social'
import commentsRoutes from './routes/comments'
import notificationsRoutes from './routes/notifications'
import adminRoutes from './routes/admin'
import reportsRoutes from './routes/reports'
import searchRoutes from './routes/search'
import collectionsRoutes from './routes/collections'
import messagesRoutes from './routes/messages'
import mentionsRoutes from './routes/mentions'
import ratingsRoutes from './routes/ratings'
import variationsRoutes from './routes/variations'
import uploadRoutes from './routes/upload'
import ingredientsRoutes from './routes/ingredients'
import mealPlansRoutes from './routes/mealPlans'
import storiesRoutes from './routes/stories'
import ogRoutes from './routes/og'
import { purgeExpired as purgeExpiredStories } from './services/storyService'
import { purgeScheduledDeletions } from './services/userService'

const app = express()
app.set('trust proxy', 1)
app.use(cookieParser())
const httpServer = createServer(app)

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

const allowedOrigins = env.CORS_ORIGINS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again after 15 minutes',
})

app.use(limiter)

app.use('/api/ingredients/bulk', express.json({ limit: '10mb' }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

app.get('/', (_req, res) => {
  res.json({
    message: 'Nutrisipe API is running',
    version: '1.0.0',
    docs: '/health',
    endpoints: [
      '/api/auth',
      '/api/posts',
      '/api/users',
      '/api/search',
      '/api/feed'
    ]
  })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/social', socialRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/collections', collectionsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/mentions', mentionsRoutes)
app.use('/api/ratings', ratingsRoutes)
app.use('/api/variations', variationsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/ingredients', ingredientsRoutes)
app.use('/api/meal-plans', mealPlansRoutes)
app.use('/api/stories', storiesRoutes)
app.use('/og', ogRoutes)

app.use(errorHandler)

const io = initializeSocketServer(httpServer)

app.set('io', io)

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`)
  console.log(`📝 Environment: ${env.NODE_ENV}`)
  console.log(`🌐 CORS enabled for: ${env.CORS_ORIGIN}`)
  console.log(`⚡ WebSocket server initialized`)
})

setInterval(async () => {
  try {
    const { deleted } = await purgeExpiredStories()
    if (deleted > 0) logger.log(`🗑  Purged ${deleted} expired stories`)
  } catch (e) {
    logger.error('Story purge error:', e)
  }
}, 60 * 60 * 1000)

setInterval(async () => {
  try {
    const { purged } = await purgeScheduledDeletions()
    if (purged > 0) logger.log(`🗑  Purged ${purged} scheduled account deletions`)
  } catch (e) {
    logger.error('Account deletion purge error:', e)
  }
}, 6 * 60 * 60 * 1000)
