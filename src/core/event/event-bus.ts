import type { EventBus, EventDefinition, EventSubscription, SubscriptionOptions } from './types'

/**
 * 事件总线实现
 * 提供类型安全的、解耦的插件间通信
 */
export class EventBusImpl implements EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map()
  private subscriptionIdCounter = 0
  private currentPluginId = 'system'

  /**
   * 设置当前插件 ID（用于跟踪订阅来源）
   */
  setCurrentPluginId(pluginId: string): void {
    this.currentPluginId = pluginId
  }

  /**
   * 生成唯一的订阅 ID
   */
  private generateSubscriptionId(): string {
    return `sub_${++this.subscriptionIdCounter}_${Date.now()}`
  }

  /**
   * 发出事件（同步）
   */
  emit<T>(
    eventType: string,
    payload: T,
    options?: { priority?: number; metadata?: Record<string, any> }
  ): void {
    const event: EventDefinition<T> = {
      type: eventType,
      payload,
      source: this.currentPluginId,
      timestamp: Date.now(),
      priority: options?.priority,
      metadata: options?.metadata
    }

    const subscriptions = this.subscriptions.get(eventType) || []
    
    // 按优先级排序（降序）
    const sortedSubscriptions = this.sortByPriority(subscriptions)

    for (const subscription of sortedSubscriptions) {
      // 应用过滤器
      if (subscription.options.filter && !subscription.options.filter(event)) {
        continue
      }

      try {
        // 执行回调
        const result = subscription.callback(event)
        
        // 如果返回 Promise，等待它（但不阻塞其他订阅者）
        if (result instanceof Promise) {
          result.catch(error => {
            this.handleSubscriptionError(subscription, error, event)
          })
        }

        // 如果是一次性订阅，移除它
        if (subscription.options.once) {
          this.off(subscription.id)
        }
      } catch (error) {
        // 隔离错误，继续传递给其他订阅者
        this.handleSubscriptionError(subscription, error, event)
      }
    }
  }

  /**
   * 发出事件（异步）
   */
  async emitAsync<T>(
    eventType: string,
    payload: T,
    options?: { priority?: number; metadata?: Record<string, any> }
  ): Promise<void> {
    const event: EventDefinition<T> = {
      type: eventType,
      payload,
      source: this.currentPluginId,
      timestamp: Date.now(),
      priority: options?.priority,
      metadata: options?.metadata
    }

    const subscriptions = this.subscriptions.get(eventType) || []
    
    // 按优先级排序（降序）
    const sortedSubscriptions = this.sortByPriority(subscriptions)

    for (const subscription of sortedSubscriptions) {
      // 应用过滤器
      if (subscription.options.filter && !subscription.options.filter(event)) {
        continue
      }

      try {
        // 执行回调并等待
        await subscription.callback(event)

        // 如果是一次性订阅，移除它
        if (subscription.options.once) {
          this.off(subscription.id)
        }
      } catch (error) {
        // 隔离错误，继续传递给其他订阅者
        this.handleSubscriptionError(subscription, error, event)
      }
    }
  }

  /**
   * 订阅事件
   */
  on<T>(
    eventType: string,
    callback: (event: EventDefinition<T>) => void | Promise<void>,
    options: SubscriptionOptions = {}
  ): () => void {
    const subscriptionId = this.generateSubscriptionId()
    
    // 处理防抖和节流
    let wrappedCallback = callback as (event: EventDefinition) => void | Promise<void>
    
    if (options.debounce) {
      wrappedCallback = this.debounce(callback, options.debounce)
    } else if (options.throttle) {
      wrappedCallback = this.throttle(callback, options.throttle)
    }

    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      callback: wrappedCallback,
      options,
      pluginId: this.currentPluginId
    }

    // 添加订阅
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, [])
    }
    this.subscriptions.get(eventType)!.push(subscription)

    // 返回取消订阅函数
    return () => this.off(subscriptionId)
  }

  /**
   * 订阅事件（一次性）
   */
  once<T>(
    eventType: string,
    callback: (event: EventDefinition<T>) => void | Promise<void>
  ): () => void {
    return this.on(eventType, callback, { once: true })
  }

  /**
   * 取消订阅
   */
  off(subscriptionId: string): void {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId)
      if (index !== -1) {
        subscriptions.splice(index, 1)
        
        // 如果没有订阅了，删除事件类型
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType)
        }
        break
      }
    }
  }

  /**
   * 取消订阅插件的所有监听器
   */
  offAll(pluginId: string): void {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const filtered = subscriptions.filter(sub => sub.pluginId !== pluginId)
      
      if (filtered.length === 0) {
        this.subscriptions.delete(eventType)
      } else {
        this.subscriptions.set(eventType, filtered)
      }
    }
  }

  /**
   * 等待事件（返回 Promise）
   */
  waitFor<T>(eventType: string, timeout?: number): Promise<EventDefinition<T>> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined

      const unsubscribe = this.once<T>(eventType, (event) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        resolve(event)
      })

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe()
          reject(new Error(`等待事件 ${eventType} 超时`))
        }, timeout)
      }
    })
  }

  /**
   * 获取活动订阅
   */
  getSubscriptions(eventType?: string): EventSubscription[] {
    if (eventType) {
      return [...(this.subscriptions.get(eventType) || [])]
    }

    const allSubscriptions: EventSubscription[] = []
    for (const subscriptions of this.subscriptions.values()) {
      allSubscriptions.push(...subscriptions)
    }
    return allSubscriptions
  }

  /**
   * 清除所有订阅
   */
  clear(): void {
    this.subscriptions.clear()
  }

  /**
   * 按优先级排序订阅（降序）
   */
  private sortByPriority(subscriptions: EventSubscription[]): EventSubscription[] {
    return [...subscriptions].sort((a, b) => {
      const priorityA = a.options.priority ?? 0
      const priorityB = b.options.priority ?? 0
      return priorityB - priorityA
    })
  }

  /**
   * 处理订阅错误
   */
  private handleSubscriptionError(
    subscription: EventSubscription,
    error: unknown,
    event: EventDefinition
  ): void {
    console.error(
      `事件处理程序错误 ${event.type} (订阅者: ${subscription.pluginId}):`,
      error
    )
  }

  /**
   * 防抖函数
   */
  private debounce<T>(
    callback: (event: EventDefinition<T>) => void | Promise<void>,
    delay: number
  ): (event: EventDefinition<T>) => void {
    let timeoutId: NodeJS.Timeout | undefined

    return (event: EventDefinition<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        callback(event)
      }, delay)
    }
  }

  /**
   * 节流函数
   */
  private throttle<T>(
    callback: (event: EventDefinition<T>) => void | Promise<void>,
    delay: number
  ): (event: EventDefinition<T>) => void {
    let lastCall = 0

    return (event: EventDefinition<T>) => {
      const now = Date.now()
      
      if (now - lastCall >= delay) {
        lastCall = now
        callback(event)
      }
    }
  }
}
