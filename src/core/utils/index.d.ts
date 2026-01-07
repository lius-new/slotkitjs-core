/**
 * Plugin system utility functions
 * Provides common utility functions to improve code reusability
 */
/**
 * Delay function
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Retry function
 */
export declare function retry<T>(fn: () => Promise<T>, attempts?: number, delayMs?: number): Promise<T>;
/**
 * Timeout wrapper function
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T>;
/**
 * Safe JSON parsing
 */
export declare function safeJsonParse<T>(json: string, defaultValue: T): T;
/**
 * Deep merge objects
 */
export declare function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
/**
 * Generate unique ID
 */
export declare function generateId(prefix?: string): string;
/**
 * Validate plugin ID format
 */
export declare function isValidPluginId(id: string): boolean;
/**
 * Validate slot name format
 */
export declare function isValidSlotName(slot: string): boolean;
/**
 * Format plugin name
 */
export declare function formatPluginName(id: string): string;
export * from './logger';
export { logger, debugLog, infoLog, warnLog, errorLog } from './logger';
//# sourceMappingURL=index.d.ts.map