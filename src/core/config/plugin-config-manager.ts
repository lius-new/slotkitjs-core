/**
 * Plugin Config Manager - Manages plugin discovery and configuration
 */

import { warnLog } from '../utils/logger'

export class PluginConfigManager {
  private static instance: PluginConfigManager
  private pluginList: string[] = []

  private constructor() {}

  static getInstance(): PluginConfigManager {
    if (!PluginConfigManager.instance) {
      PluginConfigManager.instance = new PluginConfigManager()
    }
    return PluginConfigManager.instance
  }

  /**
   * Set plugin list
   */
  setPluginList(plugins: string[]): void {
    this.pluginList = plugins
    // Save to localStorage (SSR safe)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('plugin-list', JSON.stringify(plugins))
      } catch (error) {
        warnLog('Failed to save to localStorage', { operation: 'plugin-config-save' }, error)
      }
    }
  }

  /**
   * Get plugin list
   */
  getPluginList(): string[] {
    return [...this.pluginList]
  }

  /**
   * Add plugin
   */
  addPlugin(pluginName: string): void {
    if (!this.pluginList.includes(pluginName)) {
      this.pluginList.push(pluginName)
      this.setPluginList(this.pluginList)
    }
  }

  /**
   * Remove plugin
   */
  removePlugin(pluginName: string): void {
    this.pluginList = this.pluginList.filter(name => name !== pluginName)
    this.setPluginList(this.pluginList)
  }

  /**
   * Load plugin list from localStorage (SSR safe)
   */
  loadFromStorage(): string[] {
    // Return empty array in SSR environment
    if (typeof window === 'undefined') {
      return []
    }
    
    try {
      const stored = localStorage.getItem('plugin-list')
      if (stored) {
        this.pluginList = JSON.parse(stored)
        return this.pluginList
      }
    } catch (error) {
      warnLog('Failed to load plugin list from storage', { operation: 'plugin-config-load' }, error)
    }
    return []
  }

  /**
   * Clear plugin list
   */
  clear(): void {
    this.pluginList = []
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('plugin-list')
      } catch (error) {
        warnLog('Failed to clear localStorage', { operation: 'plugin-config-clear' }, error)
      }
    }
  }
}

// Export singleton instance
export const pluginConfigManager = PluginConfigManager.getInstance()

