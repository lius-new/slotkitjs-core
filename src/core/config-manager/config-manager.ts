import { ConfigLevel, ConfigSchema, ConfigChangeEvent, ConfigManager } from './types'

/**
 * 配置管理器实现
 * 提供分层配置系统，支持配置验证、变更通知和持久化
 */
export class ConfigManagerImpl implements ConfigManager {
  // 存储各层级的配置
  private configs: Map<ConfigLevel, Map<string, any>> = new Map()
  
  // 存储配置模式
  private schemas: Map<string, ConfigSchema> = new Map()
  
  // 存储配置变更监听器
  private listeners: Map<string, Set<(event: ConfigChangeEvent) => void>> = new Map()
  private anyChangeListeners: Set<(event: ConfigChangeEvent) => void> = new Set()

  constructor() {
    // 初始化各层级的配置存储
    Object.values(ConfigLevel).forEach(level => {
      this.configs.set(level, new Map())
    })
  }

  /**
   * 注册配置模式
   */
  registerSchema(key: string, schema: ConfigSchema): void {
    this.schemas.set(key, schema)
    
    // 如果模式有默认值，设置到 Default 层级
    if (schema.default !== undefined) {
      const defaultConfig = this.configs.get(ConfigLevel.Default)!
      if (!defaultConfig.has(key)) {
        defaultConfig.set(key, schema.default)
      }
    }
  }

  /**
   * 获取配置值
   * 按照层级优先级合并：Default < User < Workspace < Plugin
   */
  get<T>(key: string, defaultValue?: T): T {
    // 按优先级从高到低查找
    const levels = [
      ConfigLevel.Plugin,
      ConfigLevel.Workspace,
      ConfigLevel.User,
      ConfigLevel.Default
    ]

    for (const level of levels) {
      const config = this.configs.get(level)!
      if (config.has(key)) {
        return config.get(key) as T
      }
    }

    // 如果都没找到，返回默认值
    return defaultValue as T
  }

  /**
   * 获取指定层级的所有配置
   */
  getAll(level?: ConfigLevel): Record<string, any> {
    if (level) {
      const config = this.configs.get(level)!
      return Object.fromEntries(config.entries())
    }

    // 如果没有指定层级，返回合并后的配置
    const merged: Record<string, any> = {}
    
    // 按优先级从低到高合并
    const levels = [
      ConfigLevel.Default,
      ConfigLevel.User,
      ConfigLevel.Workspace,
      ConfigLevel.Plugin
    ]

    for (const lvl of levels) {
      const config = this.configs.get(lvl)!
      config.forEach((value, key) => {
        merged[key] = value
      })
    }

    return merged
  }

  /**
   * 设置配置值
   */
  async set(key: string, value: any, level: ConfigLevel = ConfigLevel.User): Promise<void> {
    // 验证配置值
    const validationResult = this.validate(key, value)
    if (validationResult !== true) {
      throw new Error(`配置验证失败: ${validationResult}`)
    }

    const config = this.configs.get(level)!
    const oldValue = config.get(key)

    // 设置新值
    config.set(key, value)

    // 触发变更事件
    this.emitChange({
      key,
      oldValue,
      newValue: value,
      level
    })
  }

  /**
   * 批量更新配置
   */
  async update(updates: Record<string, any>, level: ConfigLevel = ConfigLevel.User): Promise<void> {
    // 先验证所有配置
    for (const [key, value] of Object.entries(updates)) {
      const validationResult = this.validate(key, value)
      if (validationResult !== true) {
        throw new Error(`配置验证失败 (${key}): ${validationResult}`)
      }
    }

    // 批量设置
    const config = this.configs.get(level)!
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = config.get(key)
      config.set(key, value)
      
      this.emitChange({
        key,
        oldValue,
        newValue: value,
        level
      })
    }
  }

  /**
   * 删除配置
   */
  async delete(key: string, level: ConfigLevel = ConfigLevel.User): Promise<void> {
    const config = this.configs.get(level)!
    const oldValue = config.get(key)

    if (config.has(key)) {
      config.delete(key)
      
      this.emitChange({
        key,
        oldValue,
        newValue: undefined,
        level
      })
    }
  }

  /**
   * 重置配置
   */
  async reset(key?: string, level?: ConfigLevel): Promise<void> {
    if (key && level) {
      // 重置特定层级的特定配置
      await this.delete(key, level)
    } else if (key) {
      // 重置所有层级的特定配置
      for (const lvl of Object.values(ConfigLevel)) {
        const config = this.configs.get(lvl)!
        if (config.has(key)) {
          await this.delete(key, lvl)
        }
      }
    } else if (level) {
      // 重置特定层级的所有配置
      const config = this.configs.get(level)!
      const keys = Array.from(config.keys())
      for (const k of keys) {
        await this.delete(k, level)
      }
    } else {
      // 重置所有配置（除了 Default 层级）
      for (const lvl of [ConfigLevel.User, ConfigLevel.Workspace, ConfigLevel.Plugin]) {
        const config = this.configs.get(lvl)!
        const keys = Array.from(config.keys())
        for (const k of keys) {
          await this.delete(k, lvl)
        }
      }
    }
  }

  /**
   * 监听特定配置的变更
   */
  onChange(key: string, callback: (event: ConfigChangeEvent) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    
    this.listeners.get(key)!.add(callback)

    // 返回取消订阅函数
    return () => {
      const listeners = this.listeners.get(key)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  /**
   * 监听所有配置的变更
   */
  onAnyChange(callback: (event: ConfigChangeEvent) => void): () => void {
    this.anyChangeListeners.add(callback)

    // 返回取消订阅函数
    return () => {
      this.anyChangeListeners.delete(callback)
    }
  }

  /**
   * 验证配置值
   */
  validate(key: string, value: any): boolean | string {
    const schema = this.schemas.get(key)
    
    // 如果没有模式，默认通过
    if (!schema) {
      return true
    }

    // 检查必填
    if (schema.required && (value === undefined || value === null)) {
      return `配置 ${key} 是必填的`
    }

    // 如果值为 undefined 或 null 且不是必填，通过
    if (value === undefined || value === null) {
      return true
    }

    // 检查类型
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (actualType !== schema.type) {
      return `配置 ${key} 类型错误: 期望 ${schema.type}, 实际 ${actualType}`
    }

    // 检查枚举值
    if (schema.enum && !schema.enum.includes(value)) {
      return `配置 ${key} 值必须是以下之一: ${schema.enum.join(', ')}`
    }

    // 对象类型的属性验证
    if (schema.type === 'object' && schema.properties) {
      for (const [propKey, propSchema] of Object.entries(schema.properties)) {
        const propValue = value[propKey]
        const propValidation = this.validateValue(propValue, propSchema, `${key}.${propKey}`)
        if (propValidation !== true) {
          return propValidation
        }
      }
    }

    // 数组类型的元素验证
    if (schema.type === 'array' && schema.items && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const itemValidation = this.validateValue(value[i], schema.items, `${key}[${i}]`)
        if (itemValidation !== true) {
          return itemValidation
        }
      }
    }

    // 自定义验证函数
    if (schema.validate) {
      const customValidation = schema.validate(value)
      if (customValidation !== true) {
        return customValidation
      }
    }

    return true
  }

  /**
   * 验证单个值（辅助方法）
   */
  private validateValue(value: any, schema: ConfigSchema, path: string): boolean | string {
    // 检查必填
    if (schema.required && (value === undefined || value === null)) {
      return `配置 ${path} 是必填的`
    }

    // 如果值为 undefined 或 null 且不是必填，通过
    if (value === undefined || value === null) {
      return true
    }

    // 检查类型
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (actualType !== schema.type) {
      return `配置 ${path} 类型错误: 期望 ${schema.type}, 实际 ${actualType}`
    }

    // 检查枚举值
    if (schema.enum && !schema.enum.includes(value)) {
      return `配置 ${path} 值必须是以下之一: ${schema.enum.join(', ')}`
    }

    // 自定义验证函数
    if (schema.validate) {
      const customValidation = schema.validate(value)
      if (customValidation !== true) {
        return customValidation
      }
    }

    return true
  }

  /**
   * 导出配置
   */
  export(level?: ConfigLevel): Record<string, any> {
    return this.getAll(level)
  }

  /**
   * 导入配置
   */
  async import(config: Record<string, any>, level: ConfigLevel = ConfigLevel.User): Promise<void> {
    await this.update(config, level)
  }

  /**
   * 触发配置变更事件
   */
  private emitChange(event: ConfigChangeEvent): void {
    // 触发特定配置的监听器
    const listeners = this.listeners.get(event.key)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`配置变更监听器错误 (${event.key}):`, error)
        }
      })
    }

    // 触发所有配置的监听器
    this.anyChangeListeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('配置变更监听器错误:', error)
      }
    })
  }
}
