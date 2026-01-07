/**
 * 配置层级
 */
export enum ConfigLevel {
  /** 默认配置 */
  Default = 'default',
  /** 用户配置 */
  User = 'user',
  /** 工作区配置 */
  Workspace = 'workspace',
  /** 插件配置 */
  Plugin = 'plugin'
}

/**
 * 配置模式（用于验证）
 */
export interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  default?: any
  required?: boolean
  enum?: any[]
  properties?: Record<string, ConfigSchema>
  items?: ConfigSchema
  validate?: (value: any) => boolean | string
}

/**
 * 配置变更事件
 */
export interface ConfigChangeEvent {
  key: string
  oldValue: any
  newValue: any
  level: ConfigLevel
}

/**
 * 配置管理器接口
 */
export interface ConfigManager {
  // 注册配置模式
  registerSchema(key: string, schema: ConfigSchema): void
  
  // 获取配置
  get<T>(key: string, defaultValue?: T): T
  getAll(level?: ConfigLevel): Record<string, any>
  
  // 设置配置
  set(key: string, value: any, level?: ConfigLevel): Promise<void>
  update(updates: Record<string, any>, level?: ConfigLevel): Promise<void>
  
  // 删除配置
  delete(key: string, level?: ConfigLevel): Promise<void>
  
  // 重置配置
  reset(key?: string, level?: ConfigLevel): Promise<void>
  
  // 监听配置变更
  onChange(key: string, callback: (event: ConfigChangeEvent) => void): () => void
  onAnyChange(callback: (event: ConfigChangeEvent) => void): () => void
  
  // 验证配置
  validate(key: string, value: any): boolean | string
  
  // 导入/导出配置
  export(level?: ConfigLevel): Record<string, any>
  import(config: Record<string, any>, level?: ConfigLevel): Promise<void>
}
