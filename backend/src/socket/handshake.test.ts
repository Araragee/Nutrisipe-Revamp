jest.mock('../config/env', () => ({
  env: { NODE_ENV: 'test', JWT_SECRET: 'test-secret-test-secret-test-secret-1234', JWT_EXPIRES_IN: '1h', CORS_ORIGINS: [] },
}))
jest.mock('../lib/prisma', () => ({ prisma: {} }))

import { tokenFromHandshake } from './index'
import { generateToken, verifyToken, isTokenCurrent } from '../utils/jwt'

describe('socket handshake token', () => {
  it('reads auth_token from the cookie header', () => {
    expect(tokenFromHandshake('theme=dark; auth_token=abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('falls back to handshake auth, ignores non-strings', () => {
    expect(tokenFromHandshake(undefined, { token: 'abc' })).toBe('abc')
    expect(tokenFromHandshake('theme=dark', { token: { $ne: null } })).toBeUndefined()
    expect(tokenFromHandshake(undefined)).toBeUndefined()
  })
})

describe('token version', () => {
  it('rejects tokens issued before a revocation', () => {
    const payload = verifyToken(generateToken('u1', 2))
    expect(isTokenCurrent(payload, 2)).toBe(true)
    expect(isTokenCurrent(payload, 3)).toBe(false)
  })

  it('accepts legacy tokens without a version until the first revocation', () => {
    expect(isTokenCurrent({ userId: 'u1' }, 0)).toBe(true)
    expect(isTokenCurrent({ userId: 'u1' }, 1)).toBe(false)
  })
})
