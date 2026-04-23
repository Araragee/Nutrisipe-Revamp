import express from 'express'
import cors from 'cors'
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

const app = express()
const httpServer = createServer(app)

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))

app.use(express.json())

app.get('/health', (req, res) => {
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
