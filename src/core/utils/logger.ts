/**
 * Logger - Unified logging system for SlotKit
 * 
 * Provides structured logging with different levels and context support.
 * Supports debug, info, warn, and error log levels.
 */

// Import config directly (no circular dependency since config doesn't use logger)
import { PLUGIN_CONFIG } from '../config/config'

function getPluginConfig() {
  // Use imported PLUGIN_CONFIG with fallback
  return PLUGIN_CONFIG || {
        LOGGING: {
          ENABLED: true,
          LEVEL: 'info'
        },
        DEV_MODE: false
      }
}

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Log context information
 */
export interface LogContext {
  pluginId?: string
  slotName?: string
  operation?: string
  [key: string]: any
}

/**
 * Logger class for unified logging
 */
export class Logger {
  private static instance: Logger
  private enabled!: boolean
  private level!: LogLevel
  private initialized: boolean = false

  private constructor() {
    this.initialize()
  }

  /**
   * Initialize logger configuration (lazy initialization)
   */
  private initialize(): void {
    // Safe access to PLUGIN_CONFIG with fallback defaults
    try {
      const config = getPluginConfig()
      if (config?.LOGGING) {
        this.enabled = config.LOGGING.ENABLED ?? true
        const levelMap: Record<string, LogLevel> = {
          debug: LogLevel.DEBUG,
          info: LogLevel.INFO,
          warn: LogLevel.WARN,
          error: LogLevel.ERROR
        }
        this.level = levelMap[config.LOGGING.LEVEL] || LogLevel.INFO
      } else {
        // Fallback defaults if PLUGIN_CONFIG is not available
        this.enabled = true
        this.level = LogLevel.INFO
      }
    } catch (error) {
      // Fallback if PLUGIN_CONFIG is undefined
      this.enabled = true
      this.level = LogLevel.INFO
    }
    this.initialized = true
  }

  /**
   * Get singleton instance
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const parts: string[] = [`[${level}]`]
    
    if (context?.pluginId) {
      parts.push(`Plugin: ${context.pluginId}`)
    }
    
    if (context?.slotName) {
      parts.push(`Slot: ${context.slotName}`)
    }
    
    if (context?.operation) {
      parts.push(`Operation: ${context.operation}`)
    }
    
    parts.push(message)
    
    return parts.join(' ')
  }

  /**
   * Check if logging is enabled for the given level
   */
  private shouldLog(level: LogLevel): boolean {
    return this.enabled && level >= this.level
  }

  /**
   * Log debug message (only in development mode)
   */
  debug(message: string, context?: LogContext, ...args: any[]): void {
    if (!this.initialized) {
      this.initialize()
    }
    try {
      const config = getPluginConfig()
      const devMode = config?.DEV_MODE ?? false
      if (!this.shouldLog(LogLevel.DEBUG) || !devMode) {
        return
      }
      console.log(this.formatMessage('DEBUG', message, context), ...args)
    } catch (error) {
      // If PLUGIN_CONFIG is not available, skip debug logs
      return
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext, ...args: any[]): void {
    if (!this.initialized) {
      this.initialize()
    }
    if (!this.shouldLog(LogLevel.INFO)) {
      return
    }
    console.log(this.formatMessage('INFO', message, context), ...args)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, ...args: any[]): void {
    if (!this.initialized) {
      this.initialize()
    }
    if (!this.shouldLog(LogLevel.WARN)) {
      return
    }
    console.warn(this.formatMessage('WARN', message, context), ...args)
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, ...args: any[]): void {
    if (!this.initialized) {
      this.initialize()
    }
    if (!this.shouldLog(LogLevel.ERROR)) {
      return
    }
    console.error(this.formatMessage('ERROR', message, context), ...args)
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level
  }
}

/**
 * Default logger instance
 */
export const logger = Logger.getInstance()

/**
 * Convenience functions for logging
 */
export function debugLog(message: string, context?: LogContext, ...args: any[]): void {
  logger.debug(message, context, ...args)
}

export function infoLog(message: string, context?: LogContext, ...args: any[]): void {
  logger.info(message, context, ...args)
}

export function warnLog(message: string, context?: LogContext, ...args: any[]): void {
  logger.warn(message, context, ...args)
}

export function errorLog(message: string, context?: LogContext, ...args: any[]): void {
  logger.error(message, context, ...args)
}

