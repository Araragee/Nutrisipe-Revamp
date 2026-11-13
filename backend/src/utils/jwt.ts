import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface JwtPayload {
  userId: string
  tv?: number
}

export function generateToken(userId: string, tokenVersion = 0): string {
  return jwt.sign({ userId, tv: tokenVersion } as JwtPayload, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload
}

// Tokens issued before tokenVersion existed carry no `tv`; treat them as version 0 so nobody is logged out by the deploy.
export function isTokenCurrent(payload: JwtPayload, tokenVersion: number): boolean {
  return (payload.tv ?? 0) === tokenVersion
}
