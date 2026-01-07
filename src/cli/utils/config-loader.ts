/**
 * CLI Configuration Loader
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import type { SlotKitConfig } from '../../core/config/define-config'

// Re-export for backward compatibility
export type { SlotKitConfig } from '../../core/config/define-config'

export function loadConfig(configPath?: string): SlotKitConfig {
  const defaultConfig: SlotKitConfig = {
    pluginsDir: './plugins',
    outputDir: './src/core/plugin/loader/plugin-imports.generated.ts'
  }

  if (!configPath) {
    // Try to find slotkit.config.ts or slotkit.config.js
    const possiblePaths = [
      resolve(process.cwd(), 'slotkit.config.ts'),
      resolve(process.cwd(), 'slotkit.config.js'),
      resolve(process.cwd(), 'slotkit.config.json')
    ]

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        configPath = path
        break
      }
    }
  }

  if (!configPath || !existsSync(configPath)) {
    return defaultConfig
  }

  try {
    const content = readFileSync(configPath, 'utf-8')
    if (configPath.endsWith('.json')) {
      return { ...defaultConfig, ...JSON.parse(content) }
    }
    // For .ts/.js files, need dynamic import, simplified handling here
    return defaultConfig
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}:`, error)
    return defaultConfig
  }
}

