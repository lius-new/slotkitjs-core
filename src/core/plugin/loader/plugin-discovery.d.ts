/**
 * Plugin Discovery Module - Responsible for discovering and loading plugin manifests
 */
import { PluginManifest } from '../../types/plugin';
export declare class PluginDiscovery {
    private pluginRegistryPath?;
    private pluginsBasePath?;
    /**
     * Set plugin registry path (optional)
     */
    setPluginRegistryPath(path: string): void;
    /**
     * Set plugins base path (optional)
     */
    setPluginsBasePath(path: string): void;
    /**
     * Discover all plugins
     * Priority: build-time config > runtime config > environment variables
     */
    discoverPlugins(): Promise<PluginManifest[]>;
    /**
     * Get complete plugin manifest info from build-time config
     */
    private getBuildTimePluginManifests;
    /**
     * Scan plugin directories
     */
    private scanPluginDirectories;
    /**
     * Get plugin list from build-time generated config file
     */
    private getBuildTimePluginList;
    /**
     * Get plugin list from config
     */
    private getPluginListFromConfig;
    /**
     * Get plugin list from environment variables
     */
    private getPluginListFromEnv;
    /**
     * Dynamically load plugin manifest.json
     */
    private loadPluginManifestDynamic;
}
//# sourceMappingURL=plugin-discovery.d.ts.map