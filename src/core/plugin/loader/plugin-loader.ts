/**
 * Plugin Loader - Coordinator that combines plugin discovery, validation and import modules
 */

import { Plugin, PluginLoader, PluginManifest } from '../../types/plugin'
import { PluginDiscovery } from './plugin-discovery'
import { PluginValidator } from './plugin-validator'
import { PluginImporter } from './plugin-importer'
import { PluginLoadError, handlePluginError, logError } from '../../errors'
import { debugLog, infoLog, warnLog, retry } from '../../utils'
import { PLUGIN_CONFIG } from '../../config/config'
import { pluginMetricsCollector } from '../../metrics'

/**
 * Plugin Loader - Supports fully isolated dynamic plugin loading
 */
export class DynamicPluginLoader implements PluginLoader {
  private loadedPlugins = new Map<string, Plugin>()
  private discovery = new PluginDiscovery()
  private validator = new PluginValidator()
  private importer = new PluginImporter()

  /**
   * Configure plugin discoverer
   */
  configureDiscovery(options: {
    pluginRegistryPath?: string
    pluginsBasePath?: string
  }): void {
    if (options.pluginRegistryPath) {
      this.discovery.setPluginRegistryPath(options.pluginRegistryPath)
    }
    if (options.pluginsBasePath) {
      this.discovery.setPluginsBasePath(options.pluginsBasePath)
    }
  }

  /**
   * Automatically discover and load all plugins
   */
  async loadAllPlugins(): Promise<Plugin[]> {
    // Check import mapping
    this.importer.checkImportMap()

    // If plugins already loaded, return cached result
    if (this.loadedPlugins.size > 0) {
      debugLog('Plugins already loaded, returning cached result', { operation: 'plugin-loader' })
      return Array.from(this.loadedPlugins.values())
    }

    const plugins: Plugin[] = []

    try {
      // Discover all plugins
      const pluginManifests = await this.discovery.discoverPlugins()
      infoLog(`Discovered ${pluginManifests.length} plugin(s)`, { operation: 'plugin-discovery' })

      for (const manifest of pluginManifests) {
        if (!manifest.enabled) {
          debugLog(`Plugin "${manifest.name}" is disabled, skipping`, { pluginId: manifest.id, operation: 'plugin-loader' })
          continue
        }

        // Start recording load metrics
        pluginMetricsCollector.startLoad(manifest.id)

        let retryCount = 0
        try {
          const plugin = await this.loadPluginFromManifest(manifest)
          if (plugin) {
            plugins.push(plugin)
            this.loadedPlugins.set(plugin.id, plugin)
            infoLog(`Plugin "${plugin.name}" loaded successfully`, { pluginId: plugin.id, operation: 'plugin-loader' })
            
            // Record successful load
            pluginMetricsCollector.endLoadSuccess(manifest.id, retryCount)
          }
        } catch (error) {
          const pluginError =
            error instanceof PluginLoadError
              ? error
              : new PluginLoadError(manifest.id, error instanceof Error ? error : undefined)
          logError(pluginError)
          
          // Record failed load
          pluginMetricsCollector.endLoadError(
            manifest.id,
            error instanceof Error ? error : new Error(String(error)),
            retryCount
          )
        }
      }
    } catch (error) {
      const pluginError = handlePluginError(error, 'Plugin discovery')
      logError(pluginError)
    }

    return plugins
  }

  /**
   * Dynamically load plugin from manifest
   */
  private async loadPluginFromManifest(manifest: PluginManifest): Promise<Plugin | null> {
    try {
      debugLog(`Dynamically loading plugin: ${manifest.name}, ID: ${manifest.id}`, { pluginId: manifest.id, operation: 'plugin-loader' })

      // Dynamically import plugin module with retry mechanism
      const module = await retry(
        () => this.importer.importPlugin(manifest.id),
        PLUGIN_CONFIG.LOADING.RETRY_ATTEMPTS,
        PLUGIN_CONFIG.LOADING.RETRY_DELAY
      )

      // Debug: Check module exports
      debugLog(`Plugin "${manifest.name}" module exports:`, { pluginId: manifest.id }, Object.keys(module))
      debugLog(`Default export:`, { pluginId: manifest.id }, module.default)

      // Extract and validate plugin from module
      const plugin = this.validator.extractPlugin(module, manifest)

      return plugin
    } catch (error) {
      const pluginError =
        error instanceof PluginLoadError
          ? error
          : new PluginLoadError(manifest.id, error instanceof Error ? error : undefined)
      logError(pluginError)
      return null
    }
  }

  /**
   * Load single plugin - For interface compatibility
   */
  async loadPlugin(_pluginInfo: { name: string; path: string }): Promise<Plugin | null> {
    // This method is deprecated, use loadAllPlugins instead
    warnLog('loadPlugin method is deprecated, use loadAllPlugins instead', { operation: 'plugin-loader' })
    return null
  }

  /**
   * Get loaded plugin
   */
  getLoadedPlugin(pluginId: string): Plugin | undefined {
    return this.loadedPlugins.get(pluginId)
  }

  /**
   * Get all loaded plugins
   */
  getAllLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values())
  }

  /**
   * Check if plugin is loaded
   */
  isPluginLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId)
  }

  /**
   * Dynamically load remote plugin (Future extension)
   */
  async loadRemotePlugin(url: string): Promise<Plugin | null> {
    try {
      // Future implementation: load plugin from remote URL
      debugLog(`Attempting to load remote plugin: ${url}`, { operation: 'plugin-loader' })
      return null
    } catch (error) {
      const pluginError = handlePluginError(error, `Remote plugin loading: ${url}`)
      logError(pluginError)
      return null
    }
  }
}

// Create global plugin loader instance
export const pluginLoader = new DynamicPluginLoader()

