/**
 * Plugin Importer - Handles dynamic plugin module importing
 */

import { PluginImportError } from '../../errors'
import { debugLog, warnLog } from '../../utils'
import { withTimeout } from '../../utils'
import { PLUGIN_CONFIG } from '../../config/config'
import { getPluginImport, getAvailablePluginIds } from './plugin-imports'

export class PluginImporter {
  private importMapChecked = false

  /**
   * Check if import map needs to be updated
   */
  checkImportMap(): void {
    if (this.importMapChecked) return

    try {
      // Check if import map file exists
      const availableIds = getAvailablePluginIds()
      if (availableIds.length === 0) {
        warnLog('No plugins found, check plugin directory or run: slotkit generate-imports', { operation: 'import-map-check' })
      }
      this.importMapChecked = true
    } catch (error) {
      warnLog('Failed to check import map, run: slotkit generate-imports to regenerate', { operation: 'import-map-check' }, error)
    }
  }

  /**
   * Dynamically import plugin module
   * Uses predefined import map and applies timeout mechanism
   */
  async importPlugin(pluginId: string): Promise<any> {
    debugLog(`Attempting to import plugin: ${pluginId}`, { pluginId })

    try {
      // Use predefined import mapping
      const pluginImport = getPluginImport(pluginId)

      if (!pluginImport) {
        throw new PluginImportError(pluginId)
      }

      debugLog(`Using predefined import: ${pluginId}`, { pluginId })
      // Apply timeout mechanism, ensure return value is Promise
      const importPromise = Promise.resolve(pluginImport())
      const module = await withTimeout(
        importPromise,
        PLUGIN_CONFIG.LOADING.TIMEOUT
      )
      debugLog(`Successfully imported plugin: ${pluginId}`, { pluginId })

      return module
    } catch (error) {
      const originalError = error instanceof Error ? error : new Error(String(error))
      throw new PluginImportError(pluginId, originalError)
    }
  }
}

