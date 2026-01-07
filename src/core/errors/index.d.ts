/**
 * Plugin System Error Handling
 * Unified error types and handling mechanism
 */
export declare class PluginError extends Error {
    code: string;
    pluginId?: string | undefined;
    originalError?: Error | undefined;
    constructor(message: string, code: string, pluginId?: string | undefined, originalError?: Error | undefined);
}
export declare class PluginLoadError extends PluginError {
    constructor(pluginId: string, originalError?: Error);
}
export declare class PluginValidationError extends PluginError {
    constructor(pluginId: string, validationMessage: string);
}
export declare class PluginImportError extends PluginError {
    constructor(pluginId: string, originalError?: Error);
}
export declare class PluginRegistryError extends PluginError {
    constructor(message: string, pluginId?: string);
}
/**
 * Error handling utility function
 */
export declare function handlePluginError(error: unknown, context?: string): PluginError;
/**
 * Log error using the unified logger
 */
export declare function logError(error: PluginError, level?: 'error' | 'warn'): void;
//# sourceMappingURL=index.d.ts.map