/**
 * Plugin system utility functions
 * Provides common utility functions to improve code reusability
 */

import { PLUGIN_CONFIG } from '../config/config'

/**
 * Delay function
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = PLUGIN_CONFIG?.LOADING?.RETRY_ATTEMPTS ?? 3,
  delayMs: number = PLUGIN_CONFIG?.LOADING?.RETRY_DELAY ?? 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < attempts - 1) {
        await delay(delayMs);
      }
    }
  }
  
  throw lastError!;
}

/**
 * Timeout wrapper function
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = PLUGIN_CONFIG?.LOADING?.TIMEOUT ?? 10000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Safe JSON parsing
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'plugin'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate plugin ID format
 */
export function isValidPluginId(id: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(id);
}

/**
 * Validate slot name format
 */
export function isValidSlotName(slot: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(slot);
}

/**
 * Format plugin name
 */
export function formatPluginName(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Plugin';
}

// Re-export logger and convenience functions
export * from './logger'
export { logger, debugLog, infoLog, warnLog, errorLog } from './logger'

