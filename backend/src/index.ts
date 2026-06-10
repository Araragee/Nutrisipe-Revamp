import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { env } from './config/env'
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
const httpServer = createServer(app)

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))

// Global rate limiter — raised to 500 req/15min to accommodate SPA page loads,
// socket handshakes, and realtime polling without false positives.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
})


// Apply the rate limiting middleware to all requests
app.use(limiter)

app.use(express.json())
app.use('/uploads', express.static('uploads'))

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

app.use('/api/auth', authRoutes)
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

// Initialize Socket.IO
const io = initializeSocketServer(httpServer)

// Make io available to routes if needed
app.set('io', io)

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`)
  console.log(`📝 Environment: ${env.NODE_ENV}`)
  console.log(`🌐 CORS enabled for: ${env.CORS_ORIGIN}`)
  console.log(`⚡ WebSocket server initialized`)
})

// ── Background jobs ────────────────────────────────────────────────────────
// Purge expired stories every hour
setInterval(async () => {
  try {
    const { deleted } = await purgeExpiredStories()
    if (deleted > 0) console.log(`🗑  Purged ${deleted} expired stories`)
  } catch (e) {
    console.error('Story purge error:', e)
  }
}, 60 * 60 * 1000)

// Purge grace-period-expired account deletions every 6 hours
setInterval(async () => {
  try {
    const { purged } = await purgeScheduledDeletions()
    if (purged > 0) console.log(`🗑  Purged ${purged} scheduled account deletions`)
  } catch (e) {
    console.error('Account deletion purge error:', e)
  }
}, 6 * 60 * 60 * 1000)
