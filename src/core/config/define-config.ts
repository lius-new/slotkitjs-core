/**
 * Define SlotKit Configuration
 * Helper function for type-safe configuration definition
 * This is a pure TypeScript file that works in both browser and Node.js environments
 */

export interface SlotKitConfig {
  pluginsDir?: string
  outputDir?: string
  pluginsBasePath?: string
  [key: string]: any
}

/**
 * Define SlotKit configuration
 * Helper function for type-safe configuration
 */
export function defineConfig(config: SlotKitConfig): SlotKitConfig {
  return config
}

