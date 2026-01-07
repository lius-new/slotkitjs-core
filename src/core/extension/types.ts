/**
 * 扩展点定义
 */
export interface ExtensionPoint<T = any> {
  /** 扩展点 ID */
  id: string
  /** 扩展点名称 */
  name: string
  /** 描述 */
  description?: string
  /** JSON Schema 用于验证贡献 */
  schema?: any
  /** 是否允许多个贡献 */
  multiple?: boolean
  /** 类型占位符（用于类型推断） */
  _type?: T
}

/**
 * 贡献描述符
 */
export interface Contribution<T = any> {
  /** 扩展点 ID */
  extensionPointId: string
  /** 贡献者 ID（插件 ID） */
  contributorId: string
  /** 贡献值 */
  value: T
  /** 优先级 */
  priority?: number
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 扩展点注册表接口
 */
export interface ExtensionRegistry {
  // 注册扩展点
  registerExtensionPoint<T>(point: ExtensionPoint<T>): void
  
  // 贡献到扩展点
  contribute<T>(extensionPointId: string, contribution: Omit<Contribution<T>, 'extensionPointId'>): void
  
  // 获取贡献
  getContributions<T>(extensionPointId: string): Contribution<T>[]
  getContribution<T>(extensionPointId: string, contributorId: string): Contribution<T> | null
  
  // 检查扩展点
  hasExtensionPoint(id: string): boolean
  getExtensionPoints(): ExtensionPoint[]
  
  // 移除贡献
  removeContribution(extensionPointId: string, contributorId: string): void
  removeAllContributions(contributorId: string): void
}
