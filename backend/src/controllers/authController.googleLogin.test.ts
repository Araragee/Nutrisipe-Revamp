import { Request, Response } from 'express'
import { googleLoginHandler } from './authController'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

jest.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
    JWT_EXPIRES_IN: '1h',
    GOOGLE_CLIENT_ID: 'client-123.apps.googleusercontent.com',
    COOKIE_SECURE: false,
    COOKIE_SAMESITE: 'lax',
  },
}))

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
  },
}))

const mockUser = prisma.user as unknown as Record<'findUnique' | 'update' | 'create', jest.Mock>

const validClaims = {
  aud: 'client-123.apps.googleusercontent.com',
  iss: 'https://accounts.google.com',
  sub: 'google-sub-1',
  email: 'Real.User@gmail.com',
  email_verified: 'true',
  exp: String(Math.floor(Date.now() / 1000) + 3600),
  name: 'Real User',
  picture: 'https://lh3.googleusercontent.com/a/x',
}

function mockTokeninfo(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok: status === 200, status, json: async () => body }) as jest.Mock
}

async function call(body: unknown) {
  const res = { cookie: jest.fn(), json: jest.fn() } as unknown as Response
  const next = jest.fn()
  await googleLoginHandler({ body } as Request, res, next)
  const err = next.mock.calls[0]?.[0]
  return { res, status: err instanceof AppError ? err.statusCode : err ? 500 : 200 }
}

describe('POST /auth/google-login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('logs in with a verified Google ID token, using only token claims', async () => {
    mockTokeninfo(200, validClaims)
    mockUser.findUnique.mockResolvedValue(null)
    mockUser.create.mockImplementation(async ({ data }) => ({ id: 'u1', ...data }))

    const { res, status } = await call({ credential: 'good.jwt', email: 'admin@nutrisipe.com' })

    expect(status).toBe(200)
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('id_token=good.jwt')
    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { googleId: 'google-sub-1' } })
    expect(mockUser.create.mock.calls[0][0].data).toMatchObject({ email: 'real.user@gmail.com', googleId: 'google-sub-1' })
    expect(res.cookie).toHaveBeenCalledWith('auth_token', expect.any(String), expect.any(Object))
  })

  it.each([
    ['forged email, no credential', null, { email: 'admin@nutrisipe.com', googleId: '1' }],
    ['bad token', [400, { error: 'invalid_token' }], { credential: 'bad' }],
    ['wrong aud', [200, { ...validClaims, aud: 'someone-else' }], { credential: 'x' }],
    ['unverified email', [200, { ...validClaims, email_verified: 'false' }], { credential: 'x' }],
    ['wrong issuer', [200, { ...validClaims, iss: 'evil.com' }], { credential: 'x' }],
    ['expired', [200, { ...validClaims, exp: '1000' }], { credential: 'x' }],
  ] as const)('rejects %s with 401', async (_label, tokeninfo, body) => {
    if (tokeninfo) mockTokeninfo(tokeninfo[0], tokeninfo[1])
    else global.fetch = jest.fn() as jest.Mock

    const { res, status } = await call(body)

    expect(status).toBe(401)
    expect(res.cookie).not.toHaveBeenCalled()
    expect(mockUser.create).not.toHaveBeenCalled()
    expect(mockUser.update).not.toHaveBeenCalled()
  })
})
