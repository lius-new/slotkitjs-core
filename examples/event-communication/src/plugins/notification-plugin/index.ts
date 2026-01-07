import type { Plugin, PluginContext } from '@slotkitjs/types'
import type { UserLoginEvent, UserLogoutEvent, DataUpdateEvent, SystemReadyEvent } from '../../types/events'

/**
 * 通知插件
 * 监听特定事件并显示通知
 */
const notificationPlugin: Plugin = {
  id: 'notification-plugin',
  name: '通知插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    console.log('🔔 通知插件正在挂载...')
    
    // 高优先级订阅用户登录事件
    context.events.on<UserLoginEvent>('user:login', (event) => {
      const { username } = event.payload
      console.log(`  🔔 [通知] 欢迎, ${username}! 👋`)
    }, {
      priority: 10  // 高优先级，在日志插件之前执行
    })
    
    // 订阅用户登出事件
    context.events.on<UserLogoutEvent>('user:logout', (event) => {
      console.log(`  🔔 [通知] 再见! 👋`)
    })
    
    // 带防抖的数据更新订阅
    context.events.on<DataUpdateEvent>('data:update', (event) => {
      const { entityType } = event.payload
      console.log(`  🔔 [通知] ${entityType} 数据已更新`)
    }, {
      debounce: 500  // 500ms 防抖
    })
    
    // 只订阅用户类型的数据更新
    context.events.on<DataUpdateEvent>('data:update', (event) => {
      console.log(`  🔔 [通知] 重要: 用户数据已更改`)
    }, {
      filter: (event) => event.payload.entityType === 'user',
      priority: 5
    })
    
    // 一次性订阅系统就绪事件
    context.events.once<SystemReadyEvent>('system:ready', (event) => {
      console.log(`  🔔 [通知] 系统已就绪! (版本: ${event.payload.version})`)
    })
    
    console.log('✅ 通知插件挂载完成 - 正在监听事件...')
  },
  
  onUnmount: async (context: PluginContext) => {
    console.log('👋 通知插件正在卸载...')
  }
}

export default notificationPlugin
