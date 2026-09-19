import { ref } from 'vue'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn

    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  invalidatePattern(pattern: RegExp): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach((key) => {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    })
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

const cacheManager = new CacheManager()

export function useCache() {
  return {
    cache: cacheManager,

    async cacheApiCall<T>(
      key: string,
      fetchFn: () => Promise<T>,
      ttl?: number
    ): Promise<T> {
      const cached = cacheManager.get<T>(key)

      if (cached !== null) {
        return cached
      }

      const data = await fetchFn()
      cacheManager.set(key, data, ttl)

      return data
    },

    invalidateCache(pattern: string | RegExp): void {
      if (typeof pattern === 'string') {
        cacheManager.delete(pattern)
      } else {
        cacheManager.invalidatePattern(pattern)
      }
    },

    clearCache(): void {
      cacheManager.clear()
    },
  }
}

export { cacheManager }
