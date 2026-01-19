import express from 'express'
import cors from 'cors'
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

const app = express()

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

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`)
  console.log(`📝 Environment: ${env.NODE_ENV}`)
  console.log(`🌐 CORS enabled for: ${env.CORS_ORIGIN}`)
})
