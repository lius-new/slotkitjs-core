/**
 * 事件类型定义
 * 定义应用中使用的所有事件类型
 */

/**
 * 用户登录事件
 */
export interface UserLoginEvent {
  userId: string
  username: string
  timestamp: number
}

/**
 * 用户登出事件
 */
export interface UserLogoutEvent {
  userId: string
  reason: 'user' | 'timeout' | 'error'
  timestamp: number
}

/**
 * 数据更新事件
 */
export interface DataUpdateEvent {
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  data: any
}

/**
 * 系统就绪事件
 */
export interface SystemReadyEvent {
  timestamp: number
  version: string
}
