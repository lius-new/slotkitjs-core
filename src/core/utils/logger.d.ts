/**
 * Logger - Unified logging system for SlotKit
 *
 * Provides structured logging with different levels and context support.
 * Supports debug, info, warn, and error log levels.
 */
/**
 * Log levels in order of severity
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
/**
 * Log context information
 */
export interface LogContext {
    pluginId?: string;
    slotName?: string;
    operation?: string;
    [key: string]: any;
}
/**
 * Logger class for unified logging
 */
export declare class Logger {
    private static instance;
    private enabled;
    private level;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): Logger;
    /**
     * Format log message with context
     */
    private formatMessage;
    /**
     * Check if logging is enabled for the given level
     */
    private shouldLog;
    /**
     * Log debug message (only in development mode)
     */
    debug(message: string, context?: LogContext, ...args: any[]): void;
    /**
     * Log info message
     */
    info(message: string, context?: LogContext, ...args: any[]): void;
    /**
     * Log warning message
     */
    warn(message: string, context?: LogContext, ...args: any[]): void;
    /**
     * Log error message
     */
    error(message: string, context?: LogContext, ...args: any[]): void;
    /**
     * Enable or disable logging
     */
    setEnabled(enabled: boolean): void;
    /**
     * Set log level
     */
    setLevel(level: LogLevel): void;
}
/**
 * Default logger instance
 */
export declare const logger: Logger;
/**
 * Convenience functions for logging
 */
export declare function debugLog(message: string, context?: LogContext, ...args: any[]): void;
export declare function infoLog(message: string, context?: LogContext, ...args: any[]): void;
export declare function warnLog(message: string, context?: LogContext, ...args: any[]): void;
export declare function errorLog(message: string, context?: LogContext, ...args: any[]): void;
//# sourceMappingURL=logger.d.ts.map