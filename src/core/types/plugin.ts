// Plugin state enumeration
export enum PluginState {
  IDLE = 'idle',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

// Plugin component type - Uses generic type instead of React.ComponentType
export type PluginComponent = any

// Plugin interface definition - Framework agnostic version
export interface Plugin {
  id: string
  name: string
  version: string
  component: PluginComponent
  slots?: string[]
  
  // Lifecycle hooks (optional, prepared for future extensions)
  onMount?: (context: PluginContext) => void | Promise<void>
  onUnmount?: (context: PluginContext) => void | Promise<void>
  onUpdate?: (oldVersion: string, newVersion: string) => void | Promise<void>
  onError?: (error: Error) => void
  onConfigChange?: (context: PluginContext, key: string, oldValue: any, newValue: any) => void | Promise<void>
  
  // State management (optional)
  state?: Record<string, any>
  saveState?: () => Record<string, any>
  restoreState?: (state: Record<string, any>) => void
}

export interface PluginRegistry {
  register(plugin: Plugin): void
  unregister(pluginId: string): void
  getPlugin(pluginId: string): Plugin | undefined
  getPluginsForSlot(slotName: string): Plugin[]
  setPluginState(pluginId: string, state: PluginState, error?: Error): void
  getPluginState(pluginId: string): PluginState
  getPluginStateInfo(pluginId: string): PluginStateInfo | undefined
  getPluginsByState(state: PluginState): Plugin[]
  subscribe(listener: PluginRegistryListener): () => void
  unsubscribe(listener: PluginRegistryListener): void
}

// Plugin configuration interface (deprecated, use PluginManifest instead)
/** @deprecated This interface is deprecated, please use PluginManifest */
export interface LegacyPluginConfig {
  id: string
  name: string
  path: string
  enabled: boolean
}

// Plugin Manifest interface
export interface PluginManifest {
  // 基本信息
  id: string
  name: string
  version: string
  description: string
  author: string
  license?: string
  homepage?: string
  repository?: string
  
  // 入口和激活
  entry: string
  slots?: string[]  // Made optional for non-UI plugins
  enabled?: boolean  // Made optional with default true
  activationEvents?: string[]  // 激活事件（由应用定义，如 'onStartup', 'onEvent:custom'）
  
  // 依赖声明
  dependencies?: {
    plugins?: Array<{
      id: string
      version?: string // Semver 范围，例如 "^1.0.0"
      optional?: boolean
    }>
    services?: Array<{
      interface: string | symbol
      optional?: boolean
    }>
  }
  
  // 贡献点（完全由应用定义）
  contributes?: Record<string, any>
  
  // 能力声明（由应用定义）
  capabilities?: Record<string, any>
  
  // 元数据
  metadata?: {
    category?: string
    tags?: string[]
    icon?: string
    displayName?: string
    publisher?: string
    [key: string]: any
  }
}

// Plugin loader interface - Supports dynamic loading
export interface PluginLoader {
  loadAllPlugins(): Promise<Plugin[]>
  loadPlugin(pluginInfo: any): Promise<Plugin | null>
  getLoadedPlugin(pluginId: string): Plugin | undefined
  getAllLoadedPlugins(): Plugin[]
  isPluginLoaded(pluginId: string): boolean
}

// Plugin context interface - Provides access to system services
export interface PluginContext {
  // Plugin identity
  pluginId: string
  manifest: PluginManifest
  
  // Service access
  services: {
    get<T>(interfaceName: string | symbol): T | null
    getAll<T>(interfaceName: string | symbol): T[]
    register<T>(descriptor: any): void
    onAvailable(interfaceName: string | symbol, callback: (service: any) => void): () => void
  }
  
  // Event communication
  events: {
    emit<T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): void
    emitAsync<T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): Promise<void>
    on<T>(eventType: string, callback: (event: any) => void | Promise<void>, options?: any): () => void
    once<T>(eventType: string, callback: (event: any) => void | Promise<void>): () => void
  }
  
  // Plugin registry access (read-only)
  plugins: {
    get(pluginId: string): Plugin | undefined
    getAll(): Plugin[]
    getBySlot(slotName: string): Plugin[]
  }
  
  // Logger
  logger: {
    debug(message: string, data?: any): void
    info(message: string, data?: any): void
    warn(message: string, data?: any): void
    error(message: string, error?: Error): void
  }
}

// Plugin state information
export interface PluginStateInfo {
  pluginId: string
  state: PluginState
  error?: Error
  loadedAt?: Date
}

// Plugin registry listener
export type PluginRegistryListener = (event: {
  type: 'register' | 'unregister' | 'state-change'
  pluginId: string
  plugin?: Plugin
  state?: PluginState
  error?: Error
}) => void

