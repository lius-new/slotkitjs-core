/**
 * Plugin Performance Metrics Collection Module
 * Provides performance monitoring and debugging tool interfaces
 */

import { PLUGIN_CONFIG } from '../config/config'
import { debugLog } from '../utils'

export interface PluginLoadMetric {
  pluginId: string
  loadStartTime: number
  loadEndTime?: number
  loadDuration?: number
  success: boolean
  error?: Error
  retryCount?: number
}

export interface PluginMemoryUsage {
  pluginId: string
  timestamp: number
  memoryUsed?: number
}

export interface PluginMetrics {
  pluginId: string
  loadMetrics: PluginLoadMetric[]
  memoryUsage: PluginMemoryUsage[]
  totalLoadTime: number
  averageLoadTime: number
  loadCount: number
  successCount: number
  errorCount: number
}

export class PluginMetricsCollector {
  private static instance: PluginMetricsCollector
  private loadMetrics = new Map<string, PluginLoadMetric[]>()
  private memoryUsage = new Map<string, PluginMemoryUsage[]>()
  private activeLoads = new Map<string, PluginLoadMetric>()

  private constructor() {}

  static getInstance(): PluginMetricsCollector {
    if (!PluginMetricsCollector.instance) {
      PluginMetricsCollector.instance = new PluginMetricsCollector()
    }
    return PluginMetricsCollector.instance
  }

  /**
   * Start recording plugin load
   */
  startLoad(pluginId: string): void {
    if (!PLUGIN_CONFIG.METRICS.ENABLED || !PLUGIN_CONFIG.METRICS.COLLECT_LOAD_TIME) {
      return
    }

    const perf = typeof performance !== 'undefined' ? performance : { now: () => Date.now() }
    const metric: PluginLoadMetric = {
      pluginId,
      loadStartTime: perf.now(),
      success: false
    }

    this.activeLoads.set(pluginId, metric)
  }

  /**
   * End recording plugin load (success)
   */
  endLoadSuccess(pluginId: string, retryCount?: number): void {
    if (!PLUGIN_CONFIG.METRICS.ENABLED || !PLUGIN_CONFIG.METRICS.COLLECT_LOAD_TIME) {
      return
    }

    const activeMetric = this.activeLoads.get(pluginId)
    if (!activeMetric) {
      return
    }

    const perf = typeof performance !== 'undefined' ? performance : { now: () => Date.now() }
    const loadEndTime = perf.now()
    const metric: PluginLoadMetric = {
      ...activeMetric,
      loadEndTime,
      loadDuration: loadEndTime - activeMetric.loadStartTime,
      success: true,
      retryCount
    }

    this.recordLoadMetric(metric)
    this.activeLoads.delete(pluginId)

    debugLog(`Plugin ${pluginId} load time: ${metric.loadDuration?.toFixed(2)}ms`, { pluginId, operation: 'plugin-metrics' })
  }

  /**
   * End recording plugin load (failed)
   */
  endLoadError(pluginId: string, error: Error, retryCount?: number): void {
    if (!PLUGIN_CONFIG.METRICS.ENABLED || !PLUGIN_CONFIG.METRICS.COLLECT_LOAD_TIME) {
      return
    }

    const activeMetric = this.activeLoads.get(pluginId)
    if (!activeMetric) {
      return
    }

    const perf = typeof performance !== 'undefined' ? performance : { now: () => Date.now() }
    const loadEndTime = perf.now()
    const metric: PluginLoadMetric = {
      ...activeMetric,
      loadEndTime,
      loadDuration: loadEndTime - activeMetric.loadStartTime,
      success: false,
      error,
      retryCount
    }

    this.recordLoadMetric(metric)
    this.activeLoads.delete(pluginId)
  }

  /**
   * Record load metric
   */
  private recordLoadMetric(metric: PluginLoadMetric): void {
    const existing = this.loadMetrics.get(metric.pluginId) || []
    existing.push(metric)

    // Limit the number of recorded metrics
    const maxMetrics = 100
    if (existing.length > maxMetrics) {
      existing.shift()
    }

    this.loadMetrics.set(metric.pluginId, existing)
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(pluginId: string): void {
    if (!PLUGIN_CONFIG.METRICS.ENABLED || !PLUGIN_CONFIG.METRICS.COLLECT_MEMORY_USAGE) {
      return
    }

    // Note: memory API may not be supported by all browsers
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      const usage: PluginMemoryUsage = {
        pluginId,
        timestamp: Date.now(),
        memoryUsed: memory.usedJSHeapSize
      }

      const existing = this.memoryUsage.get(pluginId) || []
      existing.push(usage)

      // Limit the number of recorded metrics
      const maxMetrics = 100
      if (existing.length > maxMetrics) {
        existing.shift()
      }

      this.memoryUsage.set(pluginId, existing)
    }
  }

  /**
   * Get plugin metrics
   */
  getPluginMetrics(pluginId: string): PluginMetrics | undefined {
    const loadMetrics = this.loadMetrics.get(pluginId) || []
    const memoryUsage = this.memoryUsage.get(pluginId) || []

    if (loadMetrics.length === 0) {
      return undefined
    }

    const successfulLoads = loadMetrics.filter(m => m.success)
    const failedLoads = loadMetrics.filter(m => !m.success)
    const totalLoadTime = loadMetrics
      .filter(m => m.loadDuration !== undefined)
      .reduce((sum, m) => sum + (m.loadDuration || 0), 0)
    const averageLoadTime = successfulLoads.length > 0
      ? successfulLoads.reduce((sum, m) => sum + (m.loadDuration || 0), 0) / successfulLoads.length
      : 0

    return {
      pluginId,
      loadMetrics,
      memoryUsage,
      totalLoadTime,
      averageLoadTime,
      loadCount: loadMetrics.length,
      successCount: successfulLoads.length,
      errorCount: failedLoads.length
    }
  }

  /**
   * Get all plugin metrics
   */
  getAllMetrics(): Map<string, PluginMetrics> {
    const metrics = new Map<string, PluginMetrics>()
    const pluginIds = new Set<string>()

    // Collect all plugin IDs
    this.loadMetrics.forEach((_, pluginId) => pluginIds.add(pluginId))
    this.memoryUsage.forEach((_, pluginId) => pluginIds.add(pluginId))

    // Generate metrics for each plugin
    pluginIds.forEach(pluginId => {
      const metric = this.getPluginMetrics(pluginId)
      if (metric) {
        metrics.set(pluginId, metric)
      }
    })

    return metrics
  }

  /**
   * Clear plugin metrics
   */
  clearMetrics(pluginId?: string): void {
    if (pluginId) {
      this.loadMetrics.delete(pluginId)
      this.memoryUsage.delete(pluginId)
      this.activeLoads.delete(pluginId)
    } else {
      this.loadMetrics.clear()
      this.memoryUsage.clear()
      this.activeLoads.clear()
    }
  }

  /**
   * Get performance summary (for debugging)
   */
  getPerformanceSummary(): {
    totalPlugins: number
    totalLoads: number
    totalSuccess: number
    totalErrors: number
    averageLoadTime: number
    fastestLoad: { pluginId: string; duration: number }
    slowestLoad: { pluginId: string; duration: number }
  } {
    const allMetrics = Array.from(this.getAllMetrics().values())

    if (allMetrics.length === 0) {
      return {
        totalPlugins: 0,
        totalLoads: 0,
        totalSuccess: 0,
        totalErrors: 0,
        averageLoadTime: 0,
        fastestLoad: { pluginId: '', duration: 0 },
        slowestLoad: { pluginId: '', duration: 0 }
      }
    }

    const totalLoads = allMetrics.reduce((sum, m) => sum + m.loadCount, 0)
    const totalSuccess = allMetrics.reduce((sum, m) => sum + m.successCount, 0)
    const totalErrors = allMetrics.reduce((sum, m) => sum + m.errorCount, 0)

    const allLoadTimes = allMetrics
      .flatMap(m => m.loadMetrics.filter(l => l.success && l.loadDuration))
      .map(l => l.loadDuration!)

    const averageLoadTime =
      allLoadTimes.length > 0
        ? allLoadTimes.reduce((sum, t) => sum + t, 0) / allLoadTimes.length
        : 0

    const fastestLoad = allMetrics.reduce(
      (min, m) => {
        const fastest = m.loadMetrics
          .filter(l => l.success && l.loadDuration)
          .reduce(
            (fast, l) => (!fast || (l.loadDuration! < fast.duration) ? { pluginId: m.pluginId, duration: l.loadDuration! } : fast),
            null as { pluginId: string; duration: number } | null
          )
        if (!fastest) return min
        return !min || fastest.duration < min.duration ? fastest : min
      },
      null as { pluginId: string; duration: number } | null
    )

    const slowestLoad = allMetrics.reduce(
      (max, m) => {
        const slowest = m.loadMetrics
          .filter(l => l.success && l.loadDuration)
          .reduce(
            (slow, l) => (!slow || (l.loadDuration! > slow.duration) ? { pluginId: m.pluginId, duration: l.loadDuration! } : slow),
            null as { pluginId: string; duration: number } | null
          )
        if (!slowest) return max
        return !max || slowest.duration > max.duration ? slowest : max
      },
      null as { pluginId: string; duration: number } | null
    )

    return {
      totalPlugins: allMetrics.length,
      totalLoads,
      totalSuccess,
      totalErrors,
      averageLoadTime,
      fastestLoad: fastestLoad || { pluginId: '', duration: 0 },
      slowestLoad: slowestLoad || { pluginId: '', duration: 0 }
    }
  }
}

// Export singleton instance
export const pluginMetricsCollector = PluginMetricsCollector.getInstance()

