import { Plugin, PluginRegistry, PluginState, PluginStateInfo, PluginRegistryListener } from '../../types/plugin';
declare class PluginRegistryImpl implements PluginRegistry {
    private plugins;
    private slotPlugins;
    private pluginStates;
    private listeners;
    register(plugin: Plugin): void;
    unregister(pluginId: string): void;
    getPlugin(pluginId: string): Plugin | undefined;
    getPluginsForSlot(slotName: string): Plugin[];
    /**
     * Set plugin state
     */
    setPluginState(pluginId: string, state: PluginState, error?: Error): void;
    /**
     * Get plugin state
     */
    getPluginState(pluginId: string): PluginState;
    /**
     * Get plugin state info
     */
    getPluginStateInfo(pluginId: string): PluginStateInfo | undefined;
    /**
     * Get plugins by state
     */
    getPluginsByState(state: PluginState): Plugin[];
    /**
     * Subscribe to registry change events
     */
    subscribe(listener: PluginRegistryListener): () => void;
    /**
     * Unsubscribe from registry change events
     */
    unsubscribe(listener: PluginRegistryListener): void;
    /**
     * Notify all listeners
     */
    private notifyListeners;
}
export declare const pluginRegistry: PluginRegistryImpl;
export {};
//# sourceMappingURL=plugin-registry.d.ts.map