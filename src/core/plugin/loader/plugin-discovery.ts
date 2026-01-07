/**
 * Plugin Discovery Module - Responsible for discovering and loading plugin manifests
 */

import { PluginManifest } from '../../types/plugin'
import { pluginConfigManager } from '../../config/plugin-config-manager'
import { PluginLoadError, handlePluginError, logError } from '../../errors'
import { debugLog, warnLog } from '../../utils'
import { getAvailablePluginIds, getAllPluginManifests } from './plugin-imports'
import { ManifestValidator } from './manifest-validator'

export class PluginDiscovery {
  private pluginRegistryPath?: string
  private pluginsBasePath?: string
  private manifestValidator = new ManifestValidator()

  /**
   * Set plugin registry path (optional)
   */
  setPluginRegistryPath(path: string): void {
    this.pluginRegistryPath = path
  }

  /**
   * Set plugins base path (optional)
   */
  setPluginsBasePath(path: string): void {
    this.pluginsBasePath = path
  }

  /**
   * Discover all plugins
   * Priority: build-time config > runtime config > environment variables
   */
  async discoverPlugins(): Promise<PluginManifest[]> {
    // First try to get complete manifest info from build-time config
    const buildTimeManifests = await this.getBuildTimePluginManifests()
    if (buildTimeManifests.length > 0) {
      debugLog(`Got plugin manifests from build-time config: ${buildTimeManifests.length}`, { operation: 'plugin-discovery' })
      return buildTimeManifests
    }

    // If no build-time config, try dynamic discovery
    const pluginDirs = await this.scanPluginDirectories()
    if (pluginDirs.length === 0) {
      debugLog(
        'No plugin configuration found. Tips: ' +
        '1) Make sure to run slotkit generate-imports to generate plugin import mappings; ' +
        '2) Check if plugin directory exists; ' +
        '3) Check if localStorage or environment variable PLUGIN_LIST is configured',
        { operation: 'plugin-discovery' }
      )
      return []
    }

    debugLog(`Discovered ${pluginDirs.length} plugin directory(ies) from dynamic scan:`, { operation: 'plugin-discovery' }, pluginDirs)
    const manifests: PluginManifest[] = []
    const errors: Array<{ pluginId: string; error: Error }> = []

    for (const pluginDir of pluginDirs) {
      try {
        const manifest = await this.loadPluginManifestDynamic(pluginDir)
        if (manifest) {
          // Validate and normalize the manifest
          const { manifest: validatedManifest, result } = this.manifestValidator.validateAndNormalize(manifest)
          
          // Log warnings
          if (result.warnings.length > 0) {
            result.warnings.forEach(warning => {
              warnLog(`Manifest validation warning for ${pluginDir}: ${warning.field} - ${warning.message}`, { 
                operation: 'plugin-discovery',
                pluginId: pluginDir 
              })
            })
          }
          
          // Only add if validation passed
          if (validatedManifest) {
            manifests.push(validatedManifest)
          } else {
            // Log validation errors
            const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('; ')
            const err = new Error(`Manifest validation failed: ${errorMessages}`)
            errors.push({ pluginId: pluginDir, error: err })
            logError(new PluginLoadError(pluginDir, err), 'warn')
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        errors.push({ pluginId: pluginDir, error: err })
        
        const pluginError = new PluginLoadError(pluginDir, err)
        logError(pluginError, 'warn')
      }
    }

    // If some plugins failed to load, provide detailed error information
    if (errors.length > 0 && manifests.length > 0) {
      debugLog(
        `Some plugins failed to load: ${errors.length} failed, ${manifests.length} succeeded. ` +
        `Failed plugins: ${errors.map(e => e.pluginId).join(', ')}`,
        { operation: 'plugin-discovery' }
      )
    } else if (errors.length > 0 && manifests.length === 0) {
      debugLog(
        `All plugins failed to load (${errors.length}). ` +
        `Please check if plugin directories and manifest.json files exist and are correctly formatted. ` +
        `Failed plugins: ${errors.map(e => e.pluginId).join(', ')}`,
        { operation: 'plugin-discovery' }
      )
    }

    return manifests
  }

  /**
   * Get complete plugin manifest info from build-time config
   */
  private async getBuildTimePluginManifests(): Promise<PluginManifest[]> {
    // Try to get manifests from generated import mappings
    // Use the imported function directly instead of dynamic import
    try {
      // Add console.log for debugging (will show even if debugLog is disabled)
      console.log('[DEBUG] getBuildTimePluginManifests: Checking getAllPluginManifests function', {
        exists: typeof getAllPluginManifests === 'function',
        type: typeof getAllPluginManifests
      })
      
      debugLog('Checking getAllPluginManifests function', { operation: 'plugin-discovery' }, {
        exists: typeof getAllPluginManifests === 'function',
        type: typeof getAllPluginManifests
      })
      
      if (typeof getAllPluginManifests === 'function') {
        const manifests = getAllPluginManifests()
        console.log('[DEBUG] getBuildTimePluginManifests: getAllPluginManifests result', {
          count: manifests?.length || 0,
          manifests: manifests
        })
        
        debugLog('getAllPluginManifests result', { operation: 'plugin-discovery' }, {
          count: manifests?.length || 0,
          manifests: manifests
        })
        
        if (manifests && manifests.length > 0) {
          console.log(`[DEBUG] getBuildTimePluginManifests: Got ${manifests.length} plugin manifest(s)`)
          debugLog(`Got plugin manifests from generated import mappings: ${manifests.length}`, { operation: 'plugin-discovery' })
          
          // Validate and normalize all manifests
          const validatedManifests: PluginManifest[] = []
          for (const manifest of manifests) {
            const { manifest: validatedManifest, result } = this.manifestValidator.validateAndNormalize(manifest)
            
            // Log warnings
            if (result.warnings.length > 0) {
              result.warnings.forEach(warning => {
                warnLog(`Manifest validation warning for ${manifest.id}: ${warning.field} - ${warning.message}`, { 
                  operation: 'plugin-discovery',
                  pluginId: manifest.id 
                })
              })
            }
            
            // Only add if validation passed
            if (validatedManifest) {
              validatedManifests.push(validatedManifest)
            } else {
              const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('; ')
              warnLog(`Skipping invalid manifest for ${manifest.id}: ${errorMessages}`, { 
                operation: 'plugin-discovery',
                pluginId: manifest.id 
              })
            }
          }
          
          return validatedManifests
        } else {
          console.log('[DEBUG] getBuildTimePluginManifests: getAllPluginManifests returned empty array')
          debugLog('getAllPluginManifests returned empty array', { operation: 'plugin-discovery' })
        }
      } else {
        console.log('[DEBUG] getBuildTimePluginManifests: getAllPluginManifests is not a function', getAllPluginManifests)
        debugLog('getAllPluginManifests is not a function', { operation: 'plugin-discovery' }, {
          value: getAllPluginManifests
        })
      }
    } catch (error) {
      console.error('[DEBUG] getBuildTimePluginManifests: Failed to get manifests', error)
      debugLog('Failed to get manifests from import mappings', { operation: 'plugin-discovery' }, error)
    }

    // Fallback to plugin registry path
    if (!this.pluginRegistryPath) {
      console.log('[DEBUG] getBuildTimePluginManifests: No plugin registry path configured')
      debugLog('No plugin registry path configured', { operation: 'plugin-discovery' })
      return []
    }

    try {
      // Dynamically import build-time generated registry file
      const registry = await import(/* @vite-ignore */ this.pluginRegistryPath)
      const config = registry.default || registry
      return config.plugins?.map((p: any) => p.manifest).filter(Boolean) || []
    } catch (error) {
      const pluginError = handlePluginError(error, 'Loading build-time plugin manifest')
      logError(pluginError, 'warn')
      return []
    }
  }

  /**
   * Scan plugin directories
   */
  private async scanPluginDirectories(): Promise<string[]> {
    // First try to get plugin list from generated import mappings
    try {
      const availablePluginIds = getAvailablePluginIds()
      if (availablePluginIds.length > 0) {
        debugLog('Got plugin list from generated import mappings:', { operation: 'plugin-discovery' }, availablePluginIds)
        return availablePluginIds
      }
    } catch (error) {
      debugLog('Failed to get plugin list from import mappings', { operation: 'plugin-discovery' }, error)
    }

    // Then try to get plugin list from build-time generated config file
    const buildTimePlugins = await this.getBuildTimePluginList()
    if (buildTimePlugins.length > 0) {
      debugLog('Got plugin list from build-time config:', { operation: 'plugin-discovery' }, buildTimePlugins)
      return buildTimePlugins
    }

    // Then try to get from runtime config
    const runtimePlugins = this.getPluginListFromConfig()
    if (runtimePlugins.length > 0) {
      debugLog('Got plugin list from runtime config:', { operation: 'plugin-discovery' }, runtimePlugins)
      return runtimePlugins
    }

    // Finally try to get from environment variables
    const envPlugins = this.getPluginListFromEnv()
    if (envPlugins.length > 0) {
      debugLog('Got plugin list from environment variables:', { operation: 'plugin-discovery' }, envPlugins)
      return envPlugins
    }

    return []
  }

  /**
   * Get plugin list from build-time generated config file
   */
  private async getBuildTimePluginList(): Promise<string[]> {
    if (!this.pluginRegistryPath) {
      return []
    }

    try {
      const registry = await import(/* @vite-ignore */ this.pluginRegistryPath)
      const config = registry.default || registry
      return config.plugins?.map((p: any) => p.id) || []
    } catch (error) {
      const pluginError = handlePluginError(error, 'Loading build-time plugin config')
      logError(pluginError, 'warn')
      return []
    }
  }

  /**
   * Get plugin list from config
   */
  private getPluginListFromConfig(): string[] {
    return pluginConfigManager.loadFromStorage()
  }

  /**
   * Get plugin list from environment variables
   */
  private getPluginListFromEnv(): string[] {
    const env = typeof process !== 'undefined' ? process.env : {}
    const envPlugins = env.PLUGIN_LIST || (typeof window !== 'undefined' && (window as any).__PLUGIN_LIST__)
    
    if (envPlugins) {
      try {
        if (typeof envPlugins === 'string') {
          return JSON.parse(envPlugins)
        }
        return Array.isArray(envPlugins) ? envPlugins : []
      } catch (error) {
      const pluginError = handlePluginError(error, 'Parsing plugin list from environment variables')
      logError(pluginError, 'warn')
      }
    }
    return []
  }

  /**
   * Dynamically load plugin manifest.json
   */
  private async loadPluginManifestDynamic(pluginName: string): Promise<PluginManifest | null> {
    try {
      // Build plugin manifest path
      const basePath = this.pluginsBasePath || ''
      const manifestPath = basePath 
        ? `${basePath}/${pluginName}/manifest.json`
        : `./plugins/${pluginName}/manifest.json`
      
      // Use dynamic import
      const manifest = await import(/* @vite-ignore */ manifestPath)
      return manifest.default || manifest
    } catch (error) {
      throw new PluginLoadError(
        pluginName,
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }
}

