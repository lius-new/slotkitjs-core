import type { Plugin, PluginContext } from '@slotkitjs/types'
import { AuthService } from './auth-service'

/**
 * 认证插件
 * 提供认证服务给其他插件使用
 */
const authPlugin: Plugin = {
  id: 'auth-plugin',
  name: '认证插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    console.log('🔐 认证插件正在挂载...')
    
    // 创建认证服务实例
    const authService = new AuthService()
    
    // 注册服务到服务容器
    context.services.register({
      id: 'auth-service',
      interface: 'IAuthService',
      implementation: authService,
      scope: 'singleton', // 单例模式，整个应用共享一个实例
      providedBy: context.pluginId
    })
    
    context.logger.info('认证服务已注册')
    console.log('✅ 认证插件挂载完成')
  },
  
  onUnmount: async (context: PluginContext) => {
    console.log('👋 认证插件正在卸载...')
    context.logger.info('认证插件已卸载')
  }
}

export default authPlugin
