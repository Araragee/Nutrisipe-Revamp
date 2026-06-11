import dotenv from 'dotenv'

dotenv.config()

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  PUBLIC_URL: process.env.PUBLIC_URL || '',
}

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

// Known example-file placeholders that must never reach production.
const PLACEHOLDER_SECRETS = ['your-super-secret-jwt-key', 'dev-only-secret-do-not-use-in-production']
const isWeakSecret = PLACEHOLDER_SECRETS.includes(env.JWT_SECRET) || env.JWT_SECRET.length < 32

if (isWeakSecret) {
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is a placeholder or shorter than 32 chars. Generate one with: openssl rand -base64 48'
    )
  }
  console.warn('[env] WARNING: weak/placeholder JWT_SECRET — fine for local dev, fatal in production.')
}
