/**
 * Plugin Performance Metrics Collection Module
 * Provides performance monitoring and debugging tool interfaces
 */
export interface PluginLoadMetric {
    pluginId: string;
    loadStartTime: number;
    loadEndTime?: number;
    loadDuration?: number;
    success: boolean;
    error?: Error;
    retryCount?: number;
}
export interface PluginMemoryUsage {
    pluginId: string;
    timestamp: number;
    memoryUsed?: number;
}
export interface PluginMetrics {
    pluginId: string;
    loadMetrics: PluginLoadMetric[];
    memoryUsage: PluginMemoryUsage[];
    totalLoadTime: number;
    averageLoadTime: number;
    loadCount: number;
    successCount: number;
    errorCount: number;
}
export declare class PluginMetricsCollector {
    private static instance;
    private loadMetrics;
    private memoryUsage;
    private activeLoads;
    private constructor();
    static getInstance(): PluginMetricsCollector;
    /**
     * Start recording plugin load
     */
    startLoad(pluginId: string): void;
    /**
     * End recording plugin load (success)
     */
    endLoadSuccess(pluginId: string, retryCount?: number): void;
    /**
     * End recording plugin load (failed)
     */
    endLoadError(pluginId: string, error: Error, retryCount?: number): void;
    /**
     * Record load metric
     */
    private recordLoadMetric;
    /**
     * Record memory usage
     */
    recordMemoryUsage(pluginId: string): void;
    /**
     * Get plugin metrics
     */
    getPluginMetrics(pluginId: string): PluginMetrics | undefined;
    /**
     * Get all plugin metrics
     */
    getAllMetrics(): Map<string, PluginMetrics>;
    /**
     * Clear plugin metrics
     */
    clearMetrics(pluginId?: string): void;
    /**
     * Get performance summary (for debugging)
     */
    getPerformanceSummary(): {
        totalPlugins: number;
        totalLoads: number;
        totalSuccess: number;
        totalErrors: number;
        averageLoadTime: number;
        fastestLoad: {
            pluginId: string;
            duration: number;
        };
        slowestLoad: {
            pluginId: string;
            duration: number;
        };
    };
}
export declare const pluginMetricsCollector: PluginMetricsCollector;
//# sourceMappingURL=plugin-metrics.d.ts.map