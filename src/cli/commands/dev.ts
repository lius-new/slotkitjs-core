/**
 * dev command - Start development server
 */

import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'

export async function dev(options: { port?: string } = {}): Promise<void> {
  const cwd = process.cwd()
  
  // Check if vite.config.ts or vite.config.js exists
  const viteConfigPath = [
    resolve(cwd, 'vite.config.ts'),
    resolve(cwd, 'vite.config.js')
  ].find(path => existsSync(path))

  if (!viteConfigPath) {
    console.error('[ERROR] vite.config.ts or vite.config.js not found')
    console.error('[INFO] Make sure you are in a SlotKit project directory')
    process.exit(1)
  }

  console.log('[INFO] Starting development server...')
  
  // Try to use local vite first, fallback to npx vite
  const viteCommand = existsSync(resolve(cwd, 'node_modules/.bin/vite'))
    ? resolve(cwd, 'node_modules/.bin/vite')
    : 'npx'

  const args = existsSync(resolve(cwd, 'node_modules/.bin/vite'))
    ? ['--port', options.port || '5173']
    : ['vite', '--port', options.port || '5173']

  const child = spawn(viteCommand, args, {
    cwd,
    stdio: 'inherit',
    shell: true
  })

  child.on('error', (error) => {
    console.error('[ERROR] Failed to start development server:', error)
    process.exit(1)
  })

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      process.exit(code)
    }
  })
}

