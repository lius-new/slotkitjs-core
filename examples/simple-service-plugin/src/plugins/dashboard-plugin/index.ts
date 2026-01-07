import type { Plugin, PluginContext } from '@slotkitjs/types'
import type { IAuthService } from '../../types/contracts'

/**
 * 仪表板插件
 * 使用认证服务来检查用户状态
 */
const dashboardPlugin: Plugin = {
  id: 'dashboard-plugin',
  name: '仪表板插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    console.log('📊 仪表板插件正在挂载...')
    
    // 从服务容器获取认证服务
    const authService = context.services.get<IAuthService>('IAuthService')
    
    if (!authService) {
      context.logger.warn('认证服务不可用，无法继续')
      console.log('⚠️  认证服务不可用')
      return
    }
    
    console.log('✅ 成功获取认证服务')
    
    // 检查当前认证状态
    const isAuth = authService.isAuthenticated()
    console.log(`📌 当前认证状态: ${isAuth ? '已认证' : '未认证'}`)
    
    if (!isAuth) {
      // 模拟用户登录
      console.log('🔑 尝试登录...')
      const success = await authService.login('admin', 'password')
      
      if (success) {
        const user = authService.getUser()
        console.log(`👤 欢迎, ${user?.username}!`)
        context.logger.info(`用户 ${user?.username} 已登录`)
      } else {
        console.log('❌ 登录失败')
      }
    } else {
      const user = authService.getUser()
      console.log(`👤 当前用户: ${user?.username}`)
    }
    
    console.log('✅ 仪表板插件挂载完成')
  },
  
  onUnmount: async (context: PluginContext) => {
    console.log('👋 仪表板插件正在卸载...')
    
    // 登出用户
    const authService = context.services.get<IAuthService>('IAuthService')
    if (authService && authService.isAuthenticated()) {
      await authService.logout()
    }
    
    context.logger.info('仪表板插件已卸载')
  }
}

export default dashboardPlugin
