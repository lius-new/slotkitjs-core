/**
 * enable command - Enable a plugin
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { loadConfig } from '../utils/config-loader'

export async function enable(id: string): Promise<void> {
  const config = loadConfig()
  const pluginsDir = resolve(process.cwd(), config.pluginsDir || './plugins')
  const manifestPath = join(pluginsDir, id, 'manifest.json')
  
  if (!existsSync(manifestPath)) {
    console.error(`[ERROR] Plugin "${id}" does not exist`)
    process.exit(1)
  }
  
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.enabled = true
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    console.log(`[OK] Plugin "${manifest.name || id}" enabled`)
  } catch (error: any) {
    console.error(`[ERROR] Failed to enable plugin:`, error.message)
    process.exit(1)
  }
}

