/**
 * Plugin Config Manager - Manages plugin discovery and configuration
 */
export declare class PluginConfigManager {
    private static instance;
    private pluginList;
    private constructor();
    static getInstance(): PluginConfigManager;
    /**
     * Set plugin list
     */
    setPluginList(plugins: string[]): void;
    /**
     * Get plugin list
     */
    getPluginList(): string[];
    /**
     * Add plugin
     */
    addPlugin(pluginName: string): void;
    /**
     * Remove plugin
     */
    removePlugin(pluginName: string): void;
    /**
     * Load plugin list from localStorage (SSR safe)
     */
    loadFromStorage(): string[];
    /**
     * Clear plugin list
     */
    clear(): void;
}
export declare const pluginConfigManager: PluginConfigManager;
//# sourceMappingURL=plugin-config-manager.d.ts.map