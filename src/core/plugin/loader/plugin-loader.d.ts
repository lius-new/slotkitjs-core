/**
 * Plugin Loader - Coordinator that combines plugin discovery, validation and import modules
 */
import { Plugin, PluginLoader } from '../../types/plugin';
/**
 * Plugin Loader - Supports fully isolated dynamic plugin loading
 */
export declare class DynamicPluginLoader implements PluginLoader {
    private loadedPlugins;
    private discovery;
    private validator;
    private importer;
    /**
     * Configure plugin discoverer
     */
    configureDiscovery(options: {
        pluginRegistryPath?: string;
        pluginsBasePath?: string;
    }): void;
    /**
     * Automatically discover and load all plugins
     */
    loadAllPlugins(): Promise<Plugin[]>;
    /**
     * Dynamically load plugin from manifest
     */
    private loadPluginFromManifest;
    /**
     * Load single plugin - For interface compatibility
     */
    loadPlugin(_pluginInfo: {
        name: string;
        path: string;
    }): Promise<Plugin | null>;
    /**
     * Get loaded plugin
     */
    getLoadedPlugin(pluginId: string): Plugin | undefined;
    /**
     * Get all loaded plugins
     */
    getAllLoadedPlugins(): Plugin[];
    /**
     * Check if plugin is loaded
     */
    isPluginLoaded(pluginId: string): boolean;
    /**
     * Dynamically load remote plugin (Future extension)
     */
    loadRemotePlugin(url: string): Promise<Plugin | null>;
}
export declare const pluginLoader: DynamicPluginLoader;
//# sourceMappingURL=plugin-loader.d.ts.map