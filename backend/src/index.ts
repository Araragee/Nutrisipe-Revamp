import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler'
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

const app = express()

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

app.use(express.json())

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

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`)
  console.log(`📝 Environment: ${env.NODE_ENV}`)
  console.log(`🌐 CORS enabled for: ${env.CORS_ORIGIN}`)
})
