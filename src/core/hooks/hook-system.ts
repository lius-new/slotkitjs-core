import { HookType, ActionHook, FilterHook, HookDescriptor, HookSystem } from './types'

/**
 * 钩子系统实现
 */
export class HookSystemImpl implements HookSystem {
  private hooks: Map<string, HookDescriptor[]> = new Map()
  private nextHookId = 0

  /**
   * 添加 Action 钩子
   */
  addAction(name: string, callback: ActionHook, priority: number = 10): () => void {
    const hookId = `hook-${this.nextHookId++}`
    
    const descriptor: HookDescriptor = {
      id: hookId,
      name,
      type: HookType.Action,
      callback,
      priority
    }

    this.addHookDescriptor(name, descriptor)

    // 返回取消订阅函数
    return () => this.removeHook(name, hookId)
  }

  /**
   * 添加 Filter 钩子
   */
  addFilter<T>(name: string, callback: FilterHook<T>, priority: number = 10): () => void {
    const hookId = `hook-${this.nextHookId++}`
    
    const descriptor: HookDescriptor = {
      id: hookId,
      name,
      type: HookType.Filter,
      callback,
      priority
    }

    this.addHookDescriptor(name, descriptor)

    // 返回取消订阅函数
    return () => this.removeHook(name, hookId)
  }

  /**
   * 执行 Action 钩子
   */
  async doAction(name: string, ...args: any[]): Promise<void> {
    const hooks = this.getHooks(name)
    
    for (const hook of hooks) {
      if (hook.type === HookType.Action) {
        try {
          await hook.callback(...args)
        } catch (error) {
          console.error(`Error in action hook ${hook.id} for ${name}:`, error)
          // 继续执行其他钩子
        }
      }
    }
  }

  /**
   * 应用 Filter 钩子
   */
  async applyFilters<T>(name: string, value: T, ...args: any[]): Promise<T> {
    const hooks = this.getHooks(name)
    let result = value
    
    for (const hook of hooks) {
      if (hook.type === HookType.Filter) {
        try {
          result = await (hook.callback as FilterHook<T>)(result, ...args)
        } catch (error) {
          console.error(`Error in filter hook ${hook.id} for ${name}:`, error)
          // 继续使用当前值
        }
      }
    }
    
    return result
  }

  /**
   * 移除钩子
   */
  removeHook(name: string, hookId: string): void {
    const hooks = this.hooks.get(name)
    if (!hooks) return

    const index = hooks.findIndex(h => h.id === hookId)
    if (index !== -1) {
      hooks.splice(index, 1)
    }

    // 如果没有钩子了，删除整个条目
    if (hooks.length === 0) {
      this.hooks.delete(name)
    }
  }

  /**
   * 移除所有钩子
   */
  removeAllHooks(name: string): void {
    this.hooks.delete(name)
  }

  /**
   * 检查是否有钩子
   */
  hasHook(name: string): boolean {
    const hooks = this.hooks.get(name)
    return hooks !== undefined && hooks.length > 0
  }

  /**
   * 获取钩子列表（按优先级排序）
   */
  getHooks(name: string): HookDescriptor[] {
    const hooks = this.hooks.get(name)
    if (!hooks) return []

    // 返回按优先级降序排序的副本
    return [...hooks].sort((a, b) => {
      const priorityA = a.priority ?? 10
      const priorityB = b.priority ?? 10
      return priorityB - priorityA // 降序：高优先级在前
    })
  }

  /**
   * 添加钩子描述符（内部方法）
   */
  private addHookDescriptor(name: string, descriptor: HookDescriptor): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, [])
    }
    
    this.hooks.get(name)!.push(descriptor)
  }
}
