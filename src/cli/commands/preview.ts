/**
 * preview command - Preview the built project
 */

import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'

export async function preview(options: { port?: string } = {}): Promise<void> {
  const cwd = process.cwd()
  
  // Check if dist directory exists
  if (!existsSync(resolve(cwd, 'dist'))) {
    console.error('[ERROR] dist directory not found')
    console.error('[INFO] Please run "slotkit build" first')
    process.exit(1)
  }

  console.log('[INFO] Previewing build...')
  
  // Try to use local vite first, fallback to npx vite
  const viteCommand = existsSync(resolve(cwd, 'node_modules/.bin/vite'))
    ? resolve(cwd, 'node_modules/.bin/vite')
    : 'npx'

  const args = existsSync(resolve(cwd, 'node_modules/.bin/vite'))
    ? ['preview', '--port', options.port || '4173']
    : ['vite', 'preview', '--port', options.port || '4173']

  const child = spawn(viteCommand, args, {
    cwd,
    stdio: 'inherit',
    shell: true
  })

  child.on('error', (error) => {
    console.error('[ERROR] Failed to preview build:', error)
    process.exit(1)
  })

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      process.exit(code)
    }
  })
}

