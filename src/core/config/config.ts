/**
 * Plugin System Configuration
 * Centralized configuration management to avoid hardcoding
 */

import type { PluginSystemConfig } from '../types/config'
import { CacheStrategy } from '../types/config'

// Safely detect development mode
const isDev = (() => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development'
    }
    // Fallback: check if we're in a browser development environment
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1' ||
             window.location.hostname.startsWith('192.168.')
    }
    return false
  } catch {
    return false
  }
})()

const defaultConfig: PluginSystemConfig = {
  PLUGINS_DIR: '../plugins',
  DEV_MODE: isDev,
  LOGGING: {
    ENABLED: true,
    LEVEL: isDev ? 'debug' : 'info'
  },
  LOADING: {
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },
  SLOTS: {
    CONTENT: 'content',
    SIDEBAR: 'sidebar',
    FOOTER: 'footer',
    HEADER: 'header'
  },
  PREVIEW: {
    ENABLED: false,
    PREVIEW_PLUGIN_ID: undefined
  },
  CACHE: {
    STRATEGY: CacheStrategy.MEMORY,
    MAX_SIZE: 100,
    TTL: 3600000 // 1 hour
  },
  METRICS: {
    ENABLED: isDev,
    COLLECT_LOAD_TIME: true,
    COLLECT_MEMORY_USAGE: false
  }
}

/**
 * Get configuration from environment variables
 */
function getConfigFromEnv(): Partial<PluginSystemConfig> {
  const env = typeof process !== 'undefined' ? process.env : {}
  const urlParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search)
    : null

  const config: Partial<PluginSystemConfig> = {}

  // Preview mode configuration
  if (urlParams?.has('preview')) {
    config.PREVIEW = {
      ENABLED: true,
      PREVIEW_PLUGIN_ID: urlParams.get('preview') || undefined
    }
  }

  // Log level
  if (env.LOG_LEVEL) {
    const level = env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error'
    if (['debug', 'info', 'warn', 'error'].includes(level)) {
      config.LOGGING = { ...defaultConfig.LOGGING, LEVEL: level }
    }
  }

  // Cache strategy
  if (env.CACHE_STRATEGY) {
    const strategy = env.CACHE_STRATEGY as CacheStrategy
    if (Object.values(CacheStrategy).includes(strategy)) {
      config.CACHE = { ...defaultConfig.CACHE, STRATEGY: strategy }
    }
  }

  return config
}

/**
 * Validate configuration
 */
function validateConfig(config: Partial<PluginSystemConfig>): void {
  // Avoid circular dependency - use console.warn directly instead of logger
  if (config.LOADING?.TIMEOUT !== undefined && config.LOADING.TIMEOUT < 0) {
    console.warn('[WARN] LOADING.TIMEOUT cannot be negative, using default value')
    config.LOADING = { ...config.LOADING, TIMEOUT: defaultConfig.LOADING.TIMEOUT }
  }

  if (config.LOADING?.RETRY_ATTEMPTS !== undefined && config.LOADING.RETRY_ATTEMPTS < 0) {
    console.warn('[WARN] LOADING.RETRY_ATTEMPTS cannot be negative, using default value')
    config.LOADING = { ...config.LOADING, RETRY_ATTEMPTS: defaultConfig.LOADING.RETRY_ATTEMPTS }
  }

  if (config.CACHE?.MAX_SIZE !== undefined && config.CACHE.MAX_SIZE < 0) {
    console.warn('[WARN] CACHE.MAX_SIZE cannot be negative, using default value')
    config.CACHE = { ...config.CACHE, MAX_SIZE: defaultConfig.CACHE.MAX_SIZE }
  }

  if (config.CACHE?.TTL !== undefined && config.CACHE.TTL < 0) {
    console.warn('[WARN] CACHE.TTL cannot be negative, using default value')
    config.CACHE = { ...config.CACHE, TTL: defaultConfig.CACHE.TTL }
  }
}

/**
 * Merge configuration
 */
function mergeConfig(
  defaultConfig: PluginSystemConfig,
  envConfig: Partial<PluginSystemConfig>
): PluginSystemConfig {
  return {
    ...defaultConfig,
    ...envConfig,
    LOGGING: { ...defaultConfig.LOGGING, ...envConfig.LOGGING },
    LOADING: { ...defaultConfig.LOADING, ...envConfig.LOADING },
    SLOTS: { ...defaultConfig.SLOTS, ...envConfig.SLOTS },
    PREVIEW: { ...defaultConfig.PREVIEW, ...envConfig.PREVIEW },
    CACHE: { ...defaultConfig.CACHE, ...envConfig.CACHE },
    METRICS: { ...defaultConfig.METRICS, ...envConfig.METRICS }
  }
}

// Get environment configuration
const envConfig = getConfigFromEnv()
validateConfig(envConfig)

// Export merged configuration
export const PLUGIN_CONFIG: PluginSystemConfig = mergeConfig(defaultConfig, envConfig)

