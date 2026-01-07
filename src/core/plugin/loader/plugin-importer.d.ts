/**
 * Plugin Importer - Handles dynamic plugin module importing
 */
export declare class PluginImporter {
    private importMapChecked;
    /**
     * Check if import map needs to be updated
     */
    checkImportMap(): void;
    /**
     * Dynamically import plugin module
     * Uses predefined import map and applies timeout mechanism
     */
    importPlugin(pluginId: string): Promise<any>;
}
//# sourceMappingURL=plugin-importer.d.ts.map