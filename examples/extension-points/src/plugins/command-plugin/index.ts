import type { Plugin, PluginContext } from '@slotkitjs/types'
import type { ExtensionRegistry } from '@slotkitjs/core'

/**
 * 命令插件
 * 贡献多个命令到命令扩展点
 */
const commandPlugin: Plugin = {
  id: 'command-plugin',
  name: '命令插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext, extensionRegistry: ExtensionRegistry) => {
    console.log('⚡ 命令插件正在挂载...')
    
    // 贡献 hello 命令
    extensionRegistry.contribute('commands', {
      contributorId: context.pluginId,
      value: {
        id: 'hello',
        label: '打招呼',
        description: '向用户打招呼',
        handler: (name: string = 'World') => {
          console.log(`  👋 Hello, ${name}!`)
        }
      },
      priority: 10
    })
    
    // 贡献 goodbye 命令
    extensionRegistry.contribute('commands', {
      contributorId: context.pluginId,
      value: {
        id: 'goodbye',
        label: '再见',
        description: '向用户道别',
        handler: (name: string = 'World') => {
          console.log(`  👋 Goodbye, ${name}!`)
        }
      },
      priority: 5
    })
    
    // 贡献 info 命令
    extensionRegistry.contribute('commands', {
      contributorId: context.pluginId,
      value: {
        id: 'info',
        label: '信息',
        description: '显示系统信息',
        handler: () => {
          console.log(`  ℹ️  SlotKit 插件系统`)
          console.log(`  📦 版本: 1.0.0`)
          console.log(`  🔌 插件: ${context.pluginId}`)
        }
      }
    })
    
    console.log('✅ 命令插件挂载完成 - 已贡献 3 个命令')
  },
  
  onUnmount: async (context: PluginContext, extensionRegistry: ExtensionRegistry) => {
    console.log('👋 命令插件正在卸载...')
    // 移除所有贡献
    extensionRegistry.removeAllContributions(context.pluginId)
  }
}

export default commandPlugin
