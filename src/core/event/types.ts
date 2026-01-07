/**
 * 事件定义
 */
export interface EventDefinition<T = any> {
  /** 事件类型 */
  type: string
  /** 事件负载 */
  payload: T
  /** 发出事件的插件 ID */
  source: string
  /** 时间戳 */
  timestamp: number
  /** 优先级 */
  priority?: number
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 事件订阅选项
 */
export interface SubscriptionOptions {
  /** 优先级（数字越大优先级越高） */
  priority?: number
  /** 是否只触发一次 */
  once?: boolean
  /** 事件过滤器 */
  filter?: (event: EventDefinition) => boolean
  /** 是否异步处理 */
  async?: boolean
  /** 防抖延迟（毫秒） */
  debounce?: number
  /** 节流延迟（毫秒） */
  throttle?: number
}

/**
 * 事件订阅
 */
export interface EventSubscription {
  /** 订阅 ID */
  id: string
  /** 事件类型 */
  eventType: string
  /** 回调函数 */
  callback: (event: EventDefinition) => void | Promise<void>
  /** 订阅选项 */
  options: SubscriptionOptions
  /** 插件 ID */
  pluginId: string
}

/**
 * 事件总线接口
 */
export interface EventBus {
  // 设置当前插件 ID（用于跟踪订阅来源）
  setCurrentPluginId?(pluginId: string): void
  
  // 发出事件（同步）
  emit<T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): void
  
  // 发出事件（异步）
  emitAsync<T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): Promise<void>
  
  // 订阅事件
  on<T>(eventType: string, callback: (event: EventDefinition<T>) => void | Promise<void>, options?: SubscriptionOptions): () => void
  
  // 订阅事件（一次性）
  once<T>(eventType: string, callback: (event: EventDefinition<T>) => void | Promise<void>): () => void
  
  // 取消订阅
  off(subscriptionId: string): void
  
  // 取消订阅插件的所有监听器
  offAll(pluginId: string): void
  
  // 等待事件（返回 Promise）
  waitFor<T>(eventType: string, timeout?: number): Promise<EventDefinition<T>>
  
  // 获取活动订阅
  getSubscriptions(eventType?: string): EventSubscription[]
  
  // 清除所有订阅
  clear(): void
}
