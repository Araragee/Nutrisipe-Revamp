import { ref, onMounted } from 'vue'

export interface PerformanceMetrics {
  // Navigation timing
  dns: number
  tcp: number
  ttfb: number // Time to First Byte
  domContentLoaded: number
  windowLoad: number

  // Resource timing
  totalResources: number
  totalTransferSize: number

  // Custom metrics
  customMarks: Map<string, number>
  customMeasures: Map<string, number>
}

export function usePerformance() {
  const metrics = ref<PerformanceMetrics>({
    dns: 0,
    tcp: 0,
    ttfb: 0,
    domContentLoaded: 0,
    windowLoad: 0,
    totalResources: 0,
    totalTransferSize: 0,
    customMarks: new Map(),
    customMeasures: new Map(),
  })

  // Measure navigation timing
  function measureNavigationTiming() {
    if (!performance.timing) return

    const timing = performance.timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (navigation) {
      metrics.value.dns = navigation.domainLookupEnd - navigation.domainLookupStart
      metrics.value.tcp = navigation.connectEnd - navigation.connectStart
      metrics.value.ttfb = navigation.responseStart - navigation.requestStart
      metrics.value.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
      metrics.value.windowLoad = navigation.loadEventEnd - navigation.fetchStart
    }
  }

  // Measure resource timing
  function measureResourceTiming() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    metrics.value.totalResources = resources.length
    metrics.value.totalTransferSize = resources.reduce(
      (total, resource) => total + (resource.transferSize || 0),
      0
    )
  }

  // Mark a performance point
  function mark(name: string): void {
    try {
      performance.mark(name)
      metrics.value.customMarks.set(name, performance.now())
    } catch (error) {
      console.error('Failed to mark performance:', error)
    }
  }

  // Measure duration between two marks
  function measure(name: string, startMark: string, endMark: string): number {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name, 'measure')[0]
      const duration = measure?.duration || 0
      metrics.value.customMeasures.set(name, duration)
      return duration
    } catch (error) {
      console.error('Failed to measure performance:', error)
      return 0
    }
  }

  // Get First Contentful Paint (FCP)
  function getFCP(): number {
    try {
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
      return fcpEntry?.startTime || 0
    } catch (error) {
      return 0
    }
  }

  // Get Largest Contentful Paint (LCP)
  function getLCP(): Promise<number> {
    return new Promise((resolve) => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
          observer.disconnect()
        })

        observer.observe({ entryTypes: ['largest-contentful-paint'] })

        // Timeout after 10 seconds
        setTimeout(() => {
          observer.disconnect()
          resolve(0)
        }, 10000)
      } catch (error) {
        resolve(0)
      }
    })
  }

  // Get First Input Delay (FID)
  function getFID(): Promise<number> {
    return new Promise((resolve) => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const firstInput = entries[0] as PerformanceEventTiming
          resolve(firstInput.processingStart - firstInput.startTime)
          observer.disconnect()
        })

        observer.observe({ entryTypes: ['first-input'] })

        // Timeout after 30 seconds
        setTimeout(() => {
          observer.disconnect()
          resolve(0)
        }, 30000)
      } catch (error) {
        resolve(0)
      }
    })
  }

  // Get Cumulative Layout Shift (CLS)
  function getCLS(): Promise<number> {
    return new Promise((resolve) => {
      try {
        let clsScore = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsScore += (entry as any).value
            }
          }
        })

        observer.observe({ entryTypes: ['layout-shift'] })

        // Calculate final score after 10 seconds
        setTimeout(() => {
          observer.disconnect()
          resolve(clsScore)
        }, 10000)
      } catch (error) {
        resolve(0)
      }
    })
  }

  // Log all metrics
  function logMetrics(): void {
    console.group('🚀 Performance Metrics')
    console.log('Navigation Timing:')
    console.table({
      'DNS Lookup': `${metrics.value.dns.toFixed(2)}ms`,
      'TCP Connection': `${metrics.value.tcp.toFixed(2)}ms`,
      'Time to First Byte': `${metrics.value.ttfb.toFixed(2)}ms`,
      'DOM Content Loaded': `${metrics.value.domContentLoaded.toFixed(2)}ms`,
      'Window Load': `${metrics.value.windowLoad.toFixed(2)}ms`,
    })

    console.log('\nResource Timing:')
    console.table({
      'Total Resources': metrics.value.totalResources,
      'Total Transfer Size': `${(metrics.value.totalTransferSize / 1024).toFixed(2)} KB`,
    })

    if (metrics.value.customMeasures.size > 0) {
      console.log('\nCustom Measures:')
      const customData: Record<string, string> = {}
      metrics.value.customMeasures.forEach((duration, name) => {
        customData[name] = `${duration.toFixed(2)}ms`
      })
      console.table(customData)
    }
    console.groupEnd()
  }

  // Clear all custom marks and measures
  function clear(): void {
    performance.clearMarks()
    performance.clearMeasures()
    metrics.value.customMarks.clear()
    metrics.value.customMeasures.clear()
  }

  onMounted(() => {
    // Wait for page load to measure
    if (document.readyState === 'complete') {
      measureNavigationTiming()
      measureResourceTiming()
    } else {
      window.addEventListener('load', () => {
        measureNavigationTiming()
        measureResourceTiming()
      })
    }
  })

  return {
    metrics,
    mark,
    measure,
    getFCP,
    getLCP,
    getFID,
    getCLS,
    logMetrics,
    clear,
  }
}
