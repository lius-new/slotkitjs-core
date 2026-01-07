/**
 * Plugin System Error Handling
 * Unified error types and handling mechanism
 */

import { errorLog, warnLog } from '../utils/logger'

export class PluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public pluginId?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

export class PluginLoadError extends PluginError {
  constructor(pluginId: string, originalError?: Error) {
    super(
      `Failed to load plugin "${pluginId}"`,
      'PLUGIN_LOAD_ERROR',
      pluginId,
      originalError
    );
    this.name = 'PluginLoadError';
  }
}

export class PluginValidationError extends PluginError {
  constructor(pluginId: string, validationMessage: string) {
    super(
      `Plugin validation failed for "${pluginId}": ${validationMessage}`,
      'PLUGIN_VALIDATION_ERROR',
      pluginId
    );
    this.name = 'PluginValidationError';
  }
}

export class PluginImportError extends PluginError {
  constructor(pluginId: string, originalError?: Error) {
    super(
      `Failed to import plugin "${pluginId}"`,
      'PLUGIN_IMPORT_ERROR',
      pluginId,
      originalError
    );
    this.name = 'PluginImportError';
  }
}

export class PluginRegistryError extends PluginError {
  constructor(message: string, pluginId?: string) {
    super(message, 'PLUGIN_REGISTRY_ERROR', pluginId);
    this.name = 'PluginRegistryError';
  }
}

/**
 * Error handling utility function
 */
export function handlePluginError(error: unknown, context?: string): PluginError {
  if (error instanceof PluginError) {
    return error;
  }
  
  const message = error instanceof Error ? error.message : String(error);
  const contextMessage = context ? ` (${context})` : '';
  
  return new PluginError(
    `Unexpected error${contextMessage}: ${message}`,
    'UNKNOWN_ERROR',
    undefined,
    error instanceof Error ? error : undefined
  );
}

/**
 * Log error using the unified logger
 */
export function logError(error: PluginError, level: 'error' | 'warn' = 'error'): void {
  const context = error.pluginId ? { pluginId: error.pluginId } : undefined
  
  if (level === 'error') {
    errorLog(error.message, context, error.code)
  } else {
    warnLog(error.message, context, error.code)
  }
  
  // Check if in development mode (browser-safe)
  const isDev = typeof process !== 'undefined' && process.env
    ? process.env.NODE_ENV === 'development'
    : typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.')
      )
  
  if (error.originalError && isDev) {
    errorLog('Original error', context, error.originalError)
  }
}

