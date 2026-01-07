/**
 * Plugin Validator - Validates plugins against interface requirements
 */
import { Plugin, PluginManifest } from '../../types/plugin';
export declare class PluginValidator {
    /**
     * Validate if plugin meets interface requirements
     */
    isValidPlugin(obj: any): obj is Plugin;
    /**
     * Validate if plugin slot configuration matches manifest
     */
    validatePluginSlots(plugin: Plugin, manifest: PluginManifest): boolean;
    /**
     * Extract plugin instance from module exports
     * Supports multiple export formats
     */
    extractPlugin(module: any, manifest: PluginManifest): Plugin | null;
    /**
     * Compare if two arrays are equal
     */
    private arraysEqual;
}
//# sourceMappingURL=plugin-validator.d.ts.map