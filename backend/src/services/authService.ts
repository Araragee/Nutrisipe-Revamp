import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/hash'
import { generateToken } from '../utils/jwt'
import { AppError } from '../middleware/errorHandler'

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

  const token = generateToken(user.id)

  const { passwordHash, ...userWithoutPassword } = user

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
    },
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  return user
}
