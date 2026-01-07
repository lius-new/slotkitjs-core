/**
 * Plugin Import Mapping Interface
 *
 * This file defines the types and interfaces for plugin import mappings
 * The actual import mappings will be generated at build time by CLI tools
 */
/**
 * Plugin import function type
 */
export type PluginImportFunction = () => Promise<any>;
/**
 * Plugin import mapping interface
 */
export interface PluginImportMap {
    [pluginId: string]: PluginImportFunction;
}
/**
 * Get plugin import function
 * This function needs to be implemented by build-time generated code
 */
export declare function getPluginImport(_pluginId: string): PluginImportFunction | undefined;
/**
 * Get all available plugin IDs
 */
export declare function getAvailablePluginIds(): string[];
/**
 * Set plugin import mapping
 * Used to inject generated import mappings at build time
 */
export declare function setPluginImportMap(_map: PluginImportMap): void;
//# sourceMappingURL=plugin-imports.d.ts.map