/**
 * list command - List all plugins
 */

import { readdirSync, existsSync, readFileSync } from 'fs'
import { resolve, join } from 'path'
import { loadConfig } from '../utils/config-loader'

export async function list(): Promise<void> {
  const config = loadConfig()
  const pluginsDir = resolve(process.cwd(), config.pluginsDir || './plugins')
  
  if (!existsSync(pluginsDir)) {
    console.log('[WARN] Plugin directory does not exist:', pluginsDir)
    return
  }
  
  const pluginDirs = readdirSync(pluginsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  
  if (pluginDirs.length === 0) {
    console.log('[INFO] No plugins found')
    return
  }
  
  console.log(`[INFO] Found ${pluginDirs.length} plugin(s):\n`)
  
  for (const pluginDir of pluginDirs) {
    const manifestPath = join(pluginsDir, pluginDir, 'manifest.json')
    
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
        const status = manifest.enabled !== false ? '[ENABLED]' : '[DISABLED]'
        console.log(`  ${status} ${manifest.name || pluginDir} (${pluginDir})`)
        if (manifest.description) {
          console.log(`     ${manifest.description}`)
        }
      } catch (error) {
        console.log(`  [WARN] ${pluginDir} (invalid manifest)`)
      }
    } else {
      console.log(`  [WARN] ${pluginDir} (missing manifest.json)`)
    }
  }
}

