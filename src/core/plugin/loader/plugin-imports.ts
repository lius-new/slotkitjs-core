/**
 * Plugin Import Mapping Interface
 * 
 * This file defines the types and interfaces for plugin import mappings
 * The actual import mappings will be generated at build time by CLI tools
 */

/**
 * Plugin import function type
 */
export type PluginImportFunction = () => Promise<any>

/**
 * Plugin import mapping interface
 */
export interface PluginImportMap {
  [pluginId: string]: PluginImportFunction
}

// Internal storage for plugin import mappings
let pluginImportMap: PluginImportMap = {}
let pluginImportFunctions: {
  getPluginImport?: (pluginId: string) => PluginImportFunction | undefined
  getAvailablePluginIds?: () => string[]
  getAllPluginManifests?: () => any[]
  getPluginManifest?: (pluginId: string) => any
} = {}

/**
 * Get plugin import function
 * This function needs to be implemented by build-time generated code
 */
export function getPluginImport(pluginId: string): PluginImportFunction | undefined {
  // First try to use injected functions from generated file
  if (pluginImportFunctions.getPluginImport) {
    return pluginImportFunctions.getPluginImport(pluginId)
  }
  
  // Fallback to internal map
  if (pluginImportMap[pluginId]) {
    return pluginImportMap[pluginId]
  }
  
  // If no mapping found, warn (only in development)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.warn(
      `[SlotKit] Plugin import mapping not found for "${pluginId}". Please run "slotkit generate-imports" to generate plugin import mappings`
    )
  }
  return undefined
}

/**
 * Get all available plugin IDs
 */
export function getAvailablePluginIds(): string[] {
  // First try to use injected functions from generated file
  if (pluginImportFunctions.getAvailablePluginIds) {
    return pluginImportFunctions.getAvailablePluginIds()
  }
  
  // Fallback to internal map
  return Object.keys(pluginImportMap)
}

/**
 * Get all plugin manifests
 * This function needs to be implemented by build-time generated code
 */
export function getAllPluginManifests(): any[] {
  // First try to use injected functions from generated file
  if (pluginImportFunctions.getAllPluginManifests) {
    return pluginImportFunctions.getAllPluginManifests()
  }
  
  return []
}

/**
 * Get plugin manifest
 * This function needs to be implemented by build-time generated code
 */
export function getPluginManifest(pluginId: string): any {
  // First try to use injected functions from generated file
  if (pluginImportFunctions.getPluginManifest) {
    return pluginImportFunctions.getPluginManifest(pluginId)
  }
  
  return undefined
}

/**
 * Set plugin import mapping
 * Used to inject generated import mappings at build time
 */
export function setPluginImportMap(map: PluginImportMap): void {
  pluginImportMap = map
}

/**
 * Set plugin import functions from generated file
 * This allows the generated plugin-imports.generated.ts to override the placeholder functions
 */
export function setPluginImportFunctions(functions: {
  getPluginImport?: (pluginId: string) => PluginImportFunction | undefined
  getAvailablePluginIds?: () => string[]
  getAllPluginManifests?: () => any[]
  getPluginManifest?: (pluginId: string) => any
}): void {
  pluginImportFunctions = functions
}

