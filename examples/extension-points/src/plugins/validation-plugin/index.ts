import type { Plugin, PluginContext } from '@slotkitjs/types'
import type { ExtensionRegistry } from '@slotkitjs/core'

/**
 * 验证插件
 * 贡献多个验证器到验证器扩展点
 */
const validationPlugin: Plugin = {
  id: 'validation-plugin',
  name: '验证插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext, extensionRegistry: ExtensionRegistry) => {
    console.log('✓ 验证插件正在挂载...')
    
    // 贡献 email 验证器
    extensionRegistry.contribute('validators', {
      contributorId: context.pluginId,
      value: {
        type: 'email',
        description: '验证电子邮件地址格式',
        validate: (value: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return emailRegex.test(value)
        }
      }
    })
    
    // 贡献 url 验证器
    extensionRegistry.contribute('validators', {
      contributorId: context.pluginId,
      value: {
        type: 'url',
        description: '验证 URL 格式',
        validate: (value: string) => {
          try {
            new URL(value)
            return true
          } catch {
            return false
          }
        }
      }
    })
    
    // 贡献 phone 验证器
    extensionRegistry.contribute('validators', {
      contributorId: context.pluginId,
      value: {
        type: 'phone',
        description: '验证电话号码格式（简单版）',
        validate: (value: string) => {
          const phoneRegex = /^\+?[\d\s-()]+$/
          return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10
        }
      }
    })
    
    // 贡献 required 验证器
    extensionRegistry.contribute('validators', {
      contributorId: context.pluginId,
      value: {
        type: 'required',
        description: '验证值不为空',
        validate: (value: any) => {
          if (value === null || value === undefined) return false
          if (typeof value === 'string') return value.trim().length > 0
          return true
        }
      }
    })
    
    console.log('✅ 验证插件挂载完成 - 已贡献 4 个验证器')
  },
  
  onUnmount: async (context: PluginContext, extensionRegistry: ExtensionRegistry) => {
    console.log('👋 验证插件正在卸载...')
    // 移除所有贡献
    extensionRegistry.removeAllContributions(context.pluginId)
  }
}

export default validationPlugin
