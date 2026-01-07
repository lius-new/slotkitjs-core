import type { Plugin, PluginContext } from '@slotkitjs/types'
import type { UserLoginEvent, UserLogoutEvent, DataUpdateEvent } from '../../types/events'

/**
 * 用户插件
 * 管理用户操作并发出相关事件
 */
const userPlugin: Plugin = {
  id: 'user-plugin',
  name: '用户插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    console.log('👤 用户插件正在挂载...')
    
    // 模拟用户登录（1秒后）
    setTimeout(() => {
      console.log('\n🔑 模拟用户登录...')
      context.events.emit<UserLoginEvent>('user:login', {
        userId: '123',
        username: 'admin',
        timestamp: Date.now()
      })
    }, 1000)
    
    // 模拟数据更新（2秒后）
    setTimeout(() => {
      console.log('\n📝 模拟数据更新...')
      context.events.emit<DataUpdateEvent>('data:update', {
        entityType: 'user',
        entityId: '123',
        action: 'update',
        data: { email: 'admin@example.com' }
      })
    }, 2000)
    
    // 模拟用户登出（3秒后）
    setTimeout(() => {
      console.log('\n👋 模拟用户登出...')
      context.events.emit<UserLogoutEvent>('user:logout', {
        userId: '123',
        reason: 'user',
        timestamp: Date.now()
      })
    }, 3000)
    
    console.log('✅ 用户插件挂载完成')
  },
  
  onUnmount: async (context: PluginContext) => {
    console.log('👋 用户插件正在卸载...')
  }
}

export default userPlugin
