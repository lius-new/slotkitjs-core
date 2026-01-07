/**
 * 钩子类型
 */
export enum HookType {
  /** 执行操作，不返回值 */
  Action = 'action',
  /** 转换数据，返回修改后的值 */
  Filter = 'filter'
}

/**
 * Action 钩子回调
 */
export type ActionHook = (...args: any[]) => void | Promise<void>

/**
 * Filter 钩子回调
 */
export type FilterHook<T = any> = (value: T, ...args: any[]) => T | Promise<T>

/**
 * 钩子描述符
 */
export interface HookDescriptor {
  /** 钩子 ID */
  id: string
  /** 钩子名称 */
  name: string
  /** 钩子类型 */
  type: HookType
  /** 回调函数 */
  callback: ActionHook | FilterHook
  /** 优先级 */
  priority?: number
  /** 提供者（插件 ID） */
  providedBy?: string
}

/**
 * 钩子系统接口
 */
export interface HookSystem {
  // 注册钩子
  addAction(name: string, callback: ActionHook, priority?: number): () => void
  addFilter<T>(name: string, callback: FilterHook<T>, priority?: number): () => void
  
  // 执行钩子
  doAction(name: string, ...args: any[]): Promise<void>
  applyFilters<T>(name: string, value: T, ...args: any[]): Promise<T>
  
  // 移除钩子
  removeHook(name: string, hookId: string): void
  removeAllHooks(name: string): void
  
  // 检查钩子
  hasHook(name: string): boolean
  getHooks(name: string): HookDescriptor[]
}
