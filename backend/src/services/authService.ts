import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword } from '../utils/hash'
import { generateToken } from '../utils/jwt'
import { AppError } from '../middleware/errorHandler'
import crypto from 'crypto'
import { env } from '../config/env'

export async function register(username: string, email: string, password: string, displayName: string) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  })

  if (existingUser) {
    throw new AppError(400, 'User with this email or username already exists')
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      displayName,
      avatarUrl: `https://i.pravatar.cc/150?u=${username}`,
    },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      followerCount: true,
      followingCount: true,
      onboardingCompleted: true,
      createdAt: true,
    },
  })

  const token = generateToken(user.id)

  return { user, token }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new AppError(401, 'Invalid email or password')
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash)

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password')
  }

  const token = generateToken(user.id, user.tokenVersion)

  const { passwordHash, tokenVersion, ...userWithoutPassword } = user

  return { user: userWithoutPassword, token }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      followerCount: true,
      followingCount: true,
      createdAt: true,
      role: true,
      onboardingCompleted: true,
      preferences: true,
    },
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  return user
}

const NO_PASSWORD = 'GOOGLE_AUTH_NO_PASSWORD'

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com']

export interface GoogleProfile {
  sub: string
  email: string
  name: string
  picture?: string
}

// ponytail: Google's tokeninfo endpoint checks signature + expiry for us; swap to google-auth-library (local JWKS) if latency/rate limits matter
export async function verifyGoogleIdToken(credential: string): Promise<GoogleProfile> {
  const invalid = new AppError(401, 'Invalid Google credential')
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(401, 'Google sign-in is not configured')

  let claims: Record<string, unknown>
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`)
    if (!res.ok) throw invalid
    claims = (await res.json()) as Record<string, unknown>
  } catch {
    throw invalid
  }

  const emailVerified = claims.email_verified === true || claims.email_verified === 'true'
  const exp = Number(claims.exp)
  if (
    claims.aud !== env.GOOGLE_CLIENT_ID ||
    !GOOGLE_ISSUERS.includes(String(claims.iss)) ||
    !emailVerified ||
    !Number.isFinite(exp) ||
    exp * 1000 <= Date.now() ||
    typeof claims.sub !== 'string' ||
    !claims.sub ||
    typeof claims.email !== 'string' ||
    !claims.email
  ) {
    throw invalid
  }

  const email = claims.email.toLowerCase()
  return {
    sub: claims.sub,
    email,
    name: typeof claims.name === 'string' && claims.name ? claims.name : email.split('@')[0],
    picture: typeof claims.picture === 'string' ? claims.picture : undefined,
  }
}

export async function googleLogin(credential: string) {
  const profile = await verifyGoogleIdToken(credential)

  let user = await prisma.user.findUnique({ where: { googleId: profile.sub } })

  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email } })
    if (byEmail) {
      if (byEmail.googleId) throw new AppError(401, 'Email is linked to a different Google account')
      // Registration never verified this email, so the existing password may belong to someone else.
      // Google has verified ownership: drop the password and revoke every existing session.
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: profile.sub, passwordHash: NO_PASSWORD, tokenVersion: { increment: 1 } },
      })
    } else {
      const username = profile.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40) + crypto.randomInt(1000, 9999)
      user = await prisma.user.create({
        data: {
          username,
          email: profile.email,
          googleId: profile.sub,
          displayName: profile.name.slice(0, 100),
          avatarUrl: profile.picture || `https://i.pravatar.cc/150?u=${username}`,
          passwordHash: NO_PASSWORD,
        },
      })
    }
  }

  const token = generateToken(user.id, user.tokenVersion)
  const { passwordHash, tokenVersion, ...userWithoutPassword } = user

  return { user: userWithoutPassword, token }
}

export async function devLogin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new AppError(404, `Dev user with email ${email} not found. Please seed the database first.`)
  }

  const token = generateToken(user.id, user.tokenVersion)
  const { passwordHash, tokenVersion, ...userWithoutPassword } = user

  return { user: userWithoutPassword, token }
}

export async function revokeAllSessions(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } })
}
