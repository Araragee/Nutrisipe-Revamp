import { purgeExpired } from './storyService'
import { prisma } from '../lib/prisma'

jest.mock('../lib/prisma', () => ({
  prisma: {
    story: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('purgeExpired', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deletes stories where expiresAt <= now', async () => {
    ;(mockPrisma.story.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })

    const now = new Date('2026-01-01T12:00:00Z')
    const result = await purgeExpired(now)

    expect(result).toEqual({ deleted: 3 })
    expect(mockPrisma.story.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lte: now } },
    })
  })

  it('returns 0 when nothing to purge', async () => {
    ;(mockPrisma.story.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })

    const result = await purgeExpired()
    expect(result).toEqual({ deleted: 0 })
  })

  it('uses current time when no arg passed', async () => {
    ;(mockPrisma.story.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
    const before = Date.now()
    await purgeExpired()
    const after = Date.now()

    const callArg = (mockPrisma.story.deleteMany as jest.Mock).mock.calls[0][0]
    const lte: Date = callArg.where.expiresAt.lte
    expect(lte.getTime()).toBeGreaterThanOrEqual(before)
    expect(lte.getTime()).toBeLessThanOrEqual(after)
  })
})
