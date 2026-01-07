import type { Plugin, PluginContext } from '@slotkitjs/types'
import type { UserLoginEvent, UserLogoutEvent, DataUpdateEvent } from '../../types/events'

/**
 * 日志插件
 * 监听所有事件并记录日志
 */
const loggerPlugin: Plugin = {
  id: 'logger-plugin',
  name: '日志插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    console.log('📝 日志插件正在挂载...')
    
    // 订阅用户登录事件
    context.events.on<UserLoginEvent>('user:login', (event) => {
      const { username, timestamp } = event.payload
      const time = new Date(timestamp).toLocaleTimeString()
      console.log(`  📝 [日志] ${time} - 用户登录: ${username}`)
    })
    
    // 订阅用户登出事件
    context.events.on<UserLogoutEvent>('user:logout', (event) => {
      const { userId, reason, timestamp } = event.payload
      const time = new Date(timestamp).toLocaleTimeString()
      console.log(`  📝 [日志] ${time} - 用户登出: ${userId} (原因: ${reason})`)
    })
    
    // 订阅数据更新事件
    context.events.on<DataUpdateEvent>('data:update', (event) => {
      const { entityType, entityId, action } = event.payload
      console.log(`  📝 [日志] 数据${action}: ${entityType}#${entityId}`)
    })
    
    console.log('✅ 日志插件挂载完成 - 正在监听事件...')
  },
  
  onUnmount: async (context: PluginContext) => {
    console.log('👋 日志插件正在卸载...')
    // 事件总线会自动清理订阅
  }
}

export default loggerPlugin
