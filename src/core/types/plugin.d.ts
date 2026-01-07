export declare enum PluginState {
    IDLE = "idle",
    LOADING = "loading",
    LOADED = "loaded",
    ERROR = "error"
}
export type PluginComponent = any;
export interface Plugin {
    id: string;
    name: string;
    version: string;
    component: PluginComponent;
    slots?: string[];
    onMount?: () => void | Promise<void>;
    onUnmount?: () => void | Promise<void>;
    onUpdate?: (oldVersion: string, newVersion: string) => void | Promise<void>;
    onError?: (error: Error) => void;
    state?: Record<string, any>;
    saveState?: () => Record<string, any>;
    restoreState?: (state: Record<string, any>) => void;
}
export interface PluginRegistry {
    register(plugin: Plugin): void;
    unregister(pluginId: string): void;
    getPlugin(pluginId: string): Plugin | undefined;
    getPluginsForSlot(slotName: string): Plugin[];
    setPluginState(pluginId: string, state: PluginState, error?: Error): void;
    getPluginState(pluginId: string): PluginState;
    getPluginStateInfo(pluginId: string): PluginStateInfo | undefined;
    getPluginsByState(state: PluginState): Plugin[];
    subscribe(listener: PluginRegistryListener): () => void;
    unsubscribe(listener: PluginRegistryListener): void;
}
/** @deprecated This interface is deprecated, please use PluginManifest */
export interface LegacyPluginConfig {
    id: string;
    name: string;
    path: string;
    enabled: boolean;
}
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    entry: string;
    slots: string[];
    enabled: boolean;
    dependencies: string[];
    metadata?: {
        category?: string;
        tags?: string[];
        [key: string]: any;
    };
}
export interface PluginLoader {
    loadAllPlugins(): Promise<Plugin[]>;
    loadPlugin(pluginInfo: any): Promise<Plugin | null>;
    getLoadedPlugin(pluginId: string): Plugin | undefined;
    getAllLoadedPlugins(): Plugin[];
    isPluginLoaded(pluginId: string): boolean;
}
export interface PluginContext {
    eventBus?: {
        emit: (event: string, data: any) => void;
        on: (event: string, callback: (data: any) => void) => () => void;
        off: (event: string, callback: (data: any) => void) => void;
    };
    sharedState?: {
        get: (key: string) => any;
        set: (key: string, value: any) => void;
    };
    pluginId: string;
}
export interface PluginStateInfo {
    pluginId: string;
    state: PluginState;
    error?: Error;
    loadedAt?: Date;
}
export type PluginRegistryListener = (event: {
    type: 'register' | 'unregister' | 'state-change';
    pluginId: string;
    plugin?: Plugin;
    state?: PluginState;
    error?: Error;
}) => void;
//# sourceMappingURL=plugin.d.ts.map