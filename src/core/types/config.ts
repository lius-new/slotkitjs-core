// Cache strategy enumeration
export enum CacheStrategy {
  NONE = 'none',
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage'
}

export interface PluginSystemConfig {
  // Plugin directory configuration
  PLUGINS_DIR: string
  
  // Development mode configuration
  DEV_MODE: boolean
  
  // Logging configuration
  LOGGING: {
    ENABLED: boolean
    LEVEL: 'debug' | 'info' | 'warn' | 'error'
  }
  
  // Plugin loading configuration
  LOADING: {
    TIMEOUT: number
    RETRY_ATTEMPTS: number
    RETRY_DELAY: number
  }
  
  // Slot configuration
  SLOTS: {
    CONTENT: string
    SIDEBAR: string
    FOOTER: string
    HEADER: string
  }
  
  // Preview mode configuration
  PREVIEW: {
    ENABLED: boolean
    PREVIEW_PLUGIN_ID?: string
  }
  
  // Cache strategy configuration
  CACHE: {
    STRATEGY: CacheStrategy
    MAX_SIZE: number
    TTL: number // Cache validity period (milliseconds)
  }
  
  // Performance monitoring configuration
  METRICS: {
    ENABLED: boolean
    COLLECT_LOAD_TIME: boolean
    COLLECT_MEMORY_USAGE: boolean
  }
}

export type PluginConfig = PluginSystemConfig

