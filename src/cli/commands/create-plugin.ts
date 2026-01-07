/**
 * create-plugin command - Create a new plugin
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { loadConfig } from '../utils/config-loader'

interface CreatePluginOptions {
  slots?: string
  author?: string
  description?: string
}

function validatePluginName(name: string): void {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error('Plugin name can only contain lowercase letters, numbers, and hyphens, and must start with a letter')
  }
}

export async function createPlugin(name: string, options: CreatePluginOptions = {}): Promise<void> {
  try {
    console.log('[INFO] Plugin generator starting')
    
    const config = loadConfig()
    const pluginsDir = resolve(process.cwd(), config.pluginsDir || './plugins')
    const pluginDir = join(pluginsDir, name)
    
    if (existsSync(pluginDir)) {
      throw new Error(`Plugin "${name}" already exists`)
    }
    
    validatePluginName(name)
    console.log('[OK] Plugin name validation passed')
    
    // Parse options
    const slots = options.slots?.split(',').map(s => s.trim()) || ['content']
    const author = options.author || 'Plugin Developer'
    const description = options.description || `A plugin named ${name}`
    
    // Create directories
    const srcDir = join(pluginDir, 'src')
    mkdirSync(pluginDir, { recursive: true })
    mkdirSync(srcDir, { recursive: true })
    console.log('[INFO] Created plugin directory:', pluginDir)
    
    // Generate component name
    const componentName = name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('') + 'Component'
    
    const validVarName = name.replace(/[^a-zA-Z0-9_]/g, '_') + 'Plugin'
    const displayName = name.charAt(0).toUpperCase() + name.slice(1) + ' Plugin'
    
    // Generate package.json
    const packageJson = {
      name: `plugin-${name}`,
      version: '1.0.0',
      main: 'src/index.tsx',
      private: true
    }
    writeFileSync(join(pluginDir, 'package.json'), JSON.stringify(packageJson, null, 2))
    
    // Generate tsconfig.json
    const tsconfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        jsx: 'react-jsx'
      },
      include: ['src/**/*']
    }
    writeFileSync(join(pluginDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))
    
    // Generate manifest.json
    const manifest = {
      id: name,
      name: displayName,
      version: '1.0.0',
      description: description,
      author: author,
      entry: './src/index.tsx',
      slots: slots,
      enabled: true
    }
    writeFileSync(join(pluginDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    
    // Generate src/index.tsx
    const indexTsx = `import React from 'react';

// Plugin component
const ${componentName}: React.FC = () => {
  return (
    <div style={{
      padding: '1rem',
      background: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '8px',
      margin: '0.5rem 0'
    }}>
      <h3>${displayName}</h3>
      <p>This is an example plugin component.</p>
    </div>
  );
};

// Plugin definition
const ${validVarName} = {
  id: '${name}',
  name: '${displayName}',
  version: '1.0.0',
  component: ${componentName},
  slots: ${JSON.stringify(slots)}
};

// Support multiple export formats
export { ${validVarName} };
export default ${validVarName};
`
    writeFileSync(join(srcDir, 'index.tsx'), indexTsx)
    
    console.log('[OK] Plugin created successfully!')
    console.log(`[INFO] Plugin location: ${pluginDir}`)
    console.log('[INFO] Next steps:')
    console.log(`  1. Edit plugin code: ${join(pluginDir, 'src/index.tsx')}`)
    console.log('  2. Run: slotkit generate-imports')
    console.log('  3. Start dev server: slotkit dev')
    
  } catch (error: any) {
    console.error('[ERROR] Failed to create plugin:', error.message)
    process.exit(1)
  }
}

