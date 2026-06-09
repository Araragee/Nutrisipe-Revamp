import { PrismaClient } from '@prisma/client'

// TODO(audit:B-03) [HIGH] Duplicate PrismaClient — src/lib/prisma.ts already provides a singleton. Delete this file and point remaining importers (postService.perf.test.ts) at lib/prisma.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

export default prisma
