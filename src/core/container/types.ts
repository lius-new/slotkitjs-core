/**
 * 服务作用域
 */
export enum ServiceScope {
  /** 全局单例 - 整个应用生命周期内只创建一次 */
  Singleton = 'singleton',
  /** 瞬态 - 每次请求都创建新实例 */
  Transient = 'transient',
  /** 作用域 - 在特定作用域内单例 */
  Scoped = 'scoped'
}

/**
 * 服务描述符
 */
export interface ServiceDescriptor<T = any> {
  /** 服务唯一标识符 */
  id: string
  /** 服务接口标识符（可以是字符串或 Symbol） */
  interface: string | symbol
  /** 服务作用域 */
  scope: ServiceScope
  /** 工厂函数 */
  factory?: (container: ServiceContainer) => T
  /** 实现类 */
  implementation?: new (...args: any[]) => T
  /** 实例（用于直接注册实例） */
  instance?: T
  /** 依赖项 */
  dependencies?: Array<string | symbol>
  /** 元数据 */
  metadata?: {
    version?: string
    providedBy?: string
    tags?: string[]
    [key: string]: any
  }
}

/**
 * 服务容器接口
 */
export interface ServiceContainer {
  // 注册服务
  register<T>(descriptor: ServiceDescriptor<T>): void
  registerSingleton<T>(id: string | symbol, implementation: new (...args: any[]) => T): void
  registerTransient<T>(id: string | symbol, implementation: new (...args: any[]) => T): void
  registerFactory<T>(id: string | symbol, factory: (container: ServiceContainer) => T, scope?: ServiceScope): void
  registerInstance<T>(id: string | symbol, instance: T): void
  
  // 解析服务
  resolve<T>(id: string | symbol): T
  tryResolve<T>(id: string | symbol): T | null
  resolveAll<T>(id: string | symbol): T[]
  
  // 检查服务
  has(id: string | symbol): boolean
  isRegistered(id: string | symbol): boolean
  
  // 创建子容器（用于作用域）
  createScope(): ServiceContainer
  
  // 服务替换（用于测试）
  replace<T>(id: string | symbol, implementation: T): void
  
  // 获取服务元数据
  getMetadata(id: string | symbol): ServiceDescriptor | undefined
  
  // 清理
  dispose(): void
}
