import { Plugin, PluginRegistry, PluginState, PluginStateInfo, PluginRegistryListener } from '../../types/plugin'
import { infoLog, debugLog, errorLog } from '../../utils'

class PluginRegistryImpl implements PluginRegistry {
  private plugins = new Map<string, Plugin>()
  private slotPlugins = new Map<string, Plugin[]>()
  private pluginStates = new Map<string, PluginStateInfo>()
  private listeners = new Set<PluginRegistryListener>()

  register(plugin: Plugin): void {
    // Check if already registered
    if (this.plugins.has(plugin.id)) {
      debugLog(`Plugin ${plugin.name} already registered, skipping`, { pluginId: plugin.id, operation: 'plugin-registry' })
      return
    }

    // Set plugin state to loaded
    this.setPluginState(plugin.id, PluginState.LOADED)

    this.plugins.set(plugin.id, plugin)

    if (plugin.slots) {
      plugin.slots.forEach(slotName => {
        if (!this.slotPlugins.has(slotName)) {
          this.slotPlugins.set(slotName, [])
        }
        this.slotPlugins.get(slotName)!.push(plugin)
      })
    }

    infoLog(`Plugin ${plugin.name} registered`, { pluginId: plugin.id, operation: 'plugin-registry' })
    
    // Notify listeners
    this.notifyListeners({
      type: 'register',
      pluginId: plugin.id,
      plugin
    })
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      this.plugins.delete(pluginId)
      this.pluginStates.delete(pluginId)
      
      if (plugin.slots) {
        plugin.slots.forEach(slotName => {
          const slotPlugins = this.slotPlugins.get(slotName)
          if (slotPlugins) {
            const index = slotPlugins.findIndex(p => p.id === pluginId)
            if (index > -1) {
              slotPlugins.splice(index, 1)
            }
          }
        })
      }
      
      infoLog(`Plugin ${plugin.name} unregistered`, { pluginId: plugin.id, operation: 'plugin-registry' })
      
      // Notify listeners
      this.notifyListeners({
        type: 'unregister',
        pluginId: plugin.id,
        plugin
      })
    }
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }

  getPluginsForSlot(slotName: string): Plugin[] {
    return this.slotPlugins.get(slotName) || []
  }

  /**
   * Set plugin state
   */
  setPluginState(pluginId: string, state: PluginState, error?: Error): void {
    const currentState = this.pluginStates.get(pluginId)
    const newState: PluginStateInfo = {
      pluginId,
      state,
      error,
      loadedAt: state === PluginState.LOADED ? new Date() : currentState?.loadedAt
    }
    
    this.pluginStates.set(pluginId, newState)
    
    // Notify listeners of state change
    this.notifyListeners({
      type: 'state-change',
      pluginId,
      state,
      error
    })
  }

  /**
   * Get plugin state
   */
  getPluginState(pluginId: string): PluginState {
    return this.pluginStates.get(pluginId)?.state || PluginState.IDLE
  }

  /**
   * Get plugin state info
   */
  getPluginStateInfo(pluginId: string): PluginStateInfo | undefined {
    return this.pluginStates.get(pluginId)
  }

  /**
   * Get plugins by state
   */
  getPluginsByState(state: PluginState): Plugin[] {
    return Array.from(this.pluginStates.entries())
      .filter(([_, info]) => info.state === state)
      .map(([pluginId]) => this.plugins.get(pluginId))
      .filter((plugin): plugin is Plugin => plugin !== undefined)
  }

  /**
   * Subscribe to registry change events
   */
  subscribe(listener: PluginRegistryListener): () => void {
    this.listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Unsubscribe from registry change events
   */
  unsubscribe(listener: PluginRegistryListener): void {
    this.listeners.delete(listener)
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(event: {
    type: 'register' | 'unregister' | 'state-change'
    pluginId: string
    plugin?: Plugin
    state?: PluginState
    error?: Error
  }): void {
    console.log(`[DEBUG] PluginRegistry: Notifying ${this.listeners.size} listener(s) of event:`, event.type, {
      pluginId: event.pluginId,
      plugin: event.plugin ? { id: event.plugin.id, name: event.plugin.name, slots: event.plugin.slots } : undefined
    })
    
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        errorLog('Listener error', { pluginId: event.pluginId, operation: 'registry-listener' }, error)
      }
    })
  }
}

export const pluginRegistry = new PluginRegistryImpl()

