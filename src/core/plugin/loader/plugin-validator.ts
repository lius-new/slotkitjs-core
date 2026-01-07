/**
 * Plugin Validator - Validates plugins against interface requirements
 */

import { Plugin, PluginManifest } from '../../types/plugin'
import { PluginValidationError } from '../../errors'
import { debugLog } from '../../utils'

export class PluginValidator {
  /**
   * Validate if plugin meets interface requirements
   */
  isValidPlugin(obj: any): obj is Plugin {
    if (!obj) {
      debugLog('Plugin validation failed: object is empty', { operation: 'plugin-validation' })
      return false
    }

    if (typeof obj !== 'object') {
      debugLog('Plugin validation failed: not an object', { operation: 'plugin-validation' }, typeof obj)
      return false
    }

    if (typeof obj.id !== 'string') {
      debugLog('Plugin validation failed: id is not a string', { operation: 'plugin-validation' }, typeof obj.id, obj.id)
      return false
    }

    if (typeof obj.name !== 'string') {
      debugLog('Plugin validation failed: name is not a string', { operation: 'plugin-validation' }, typeof obj.name, obj.name)
      return false
    }

    if (typeof obj.version !== 'string') {
      debugLog('Plugin validation failed: version is not a string', { operation: 'plugin-validation' }, typeof obj.version, obj.version)
      return false
    }

    if (typeof obj.component !== 'function') {
      debugLog('Plugin validation failed: component is not a function', { operation: 'plugin-validation' }, typeof obj.component, obj.component)
      return false
    }

    if (obj.slots !== undefined && !Array.isArray(obj.slots)) {
      debugLog('Plugin validation failed: slots is not an array', { operation: 'plugin-validation' }, typeof obj.slots, obj.slots)
      return false
    }

    debugLog('Plugin validation passed', { pluginId: obj.id, operation: 'plugin-validation' }, obj.name)
    return true
  }

  /**
   * Validate if plugin slot configuration matches manifest
   */
  validatePluginSlots(plugin: Plugin, manifest: PluginManifest): boolean {
    if (!plugin.slots || !manifest.slots) {
      return true
    }

    const pluginSlots = new Set(plugin.slots)
    const manifestSlots = new Set(manifest.slots)

    if (!this.arraysEqual(Array.from(pluginSlots), Array.from(manifestSlots))) {
      debugLog(`Plugin "${manifest.name}" slot configuration does not match manifest`, { pluginId: manifest.id, operation: 'plugin-validation' })
      return false
    }

    return true
  }

  /**
   * Extract plugin instance from module exports
   * Supports multiple export formats
   */
  extractPlugin(module: any, manifest: PluginManifest): Plugin | null {
    let plugin: Plugin | null = null

    // Method 1: Direct plugin object export
    if (module.default && this.isValidPlugin(module.default)) {
      debugLog(`Found default export plugin: ${manifest.name}`, { pluginId: manifest.id, operation: 'plugin-extraction' })
      plugin = module.default
    }
    // Method 2: Named export (supports multiple naming formats)
    else if (module[`${manifest.id}Plugin`]) {
      debugLog(`Found named export plugin: ${manifest.name} (${manifest.id}Plugin)`, { pluginId: manifest.id, operation: 'plugin-extraction' })
      plugin = module[`${manifest.id}Plugin`]
    }
    // Method 3: Check if it's a destructured plugin object
    else if (module.id && module.name && module.component) {
      debugLog(`Found destructured plugin object: ${manifest.name}`, { pluginId: manifest.id, operation: 'plugin-extraction' })
      plugin = module
    }
    // Method 4: Other possible export formats
    else {
      debugLog('Trying other export formats...', { pluginId: manifest.id, operation: 'plugin-extraction' })
      for (const key in module) {
        debugLog(`Checking export key: ${key}`, { pluginId: manifest.id, operation: 'plugin-extraction' }, module[key])
        if (this.isValidPlugin(module[key])) {
          debugLog(`Found valid plugin export: ${key}`, { pluginId: manifest.id, operation: 'plugin-extraction' })
          plugin = module[key]
          break
        }
      }
    }

    if (!plugin) {
      throw new PluginValidationError(manifest.id, 'No valid plugin export found')
    }

    // Validate slot configuration
    this.validatePluginSlots(plugin, manifest)

    return plugin
  }

  /**
   * Compare if two arrays are equal
   */
  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index])
  }
}

