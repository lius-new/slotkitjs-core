import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConfigManagerImpl } from '../config-manager'
import { ConfigLevel } from '../types'

describe('ConfigManager', () => {
  let configManager: ConfigManagerImpl

  beforeEach(() => {
    configManager = new ConfigManagerImpl()
  })

  describe('配置层级合并', () => {
    it('应该按优先级合并配置: Default < User < Workspace < Plugin', () => {
      // 设置不同层级的配置
      configManager.set('test.key', 'default', ConfigLevel.Default)
      configManager.set('test.key', 'user', ConfigLevel.User)
      configManager.set('test.key', 'workspace', ConfigLevel.Workspace)
      configManager.set('test.key', 'plugin', ConfigLevel.Plugin)

      // Plugin 层级优先级最高
      expect(configManager.get('test.key')).toBe('plugin')
    })

    it('应该在高优先级层级不存在时回退到低优先级', () => {
      configManager.set('test.key', 'default', ConfigLevel.Default)
      configManager.set('test.key', 'user', ConfigLevel.User)

      expect(configManager.get('test.key')).toBe('user')

      // 删除 User 层级的配置
      configManager.delete('test.key', ConfigLevel.User)

      // 应该回退到 Default
      expect(configManager.get('test.key')).toBe('default')
    })

    it('应该返回默认值当配置不存在时', () => {
      expect(configManager.get('nonexistent', 'fallback')).toBe('fallback')
    })

    it('getAll 应该返回合并后的配置', () => {
      configManager.set('key1', 'value1', ConfigLevel.Default)
      configManager.set('key2', 'value2', ConfigLevel.User)
      configManager.set('key1', 'override', ConfigLevel.Workspace)

      const all = configManager.getAll()

      expect(all).toEqual({
        key1: 'override', // Workspace 覆盖 Default
        key2: 'value2'
      })
    })

    it('getAll 应该返回指定层级的配置', () => {
      configManager.set('key1', 'value1', ConfigLevel.Default)
      configManager.set('key2', 'value2', ConfigLevel.User)

      const userConfig = configManager.getAll(ConfigLevel.User)

      expect(userConfig).toEqual({
        key2: 'value2'
      })
    })
  })

  describe('配置验证', () => {
    it('应该验证配置类型', () => {
      configManager.registerSchema('test.number', {
        type: 'number',
        required: true
      })

      const result = configManager.validate('test.number', 'not a number')
      expect(result).toContain('类型错误')
    })

    it('应该验证必填字段', () => {
      configManager.registerSchema('test.required', {
        type: 'string',
        required: true
      })

      const result = configManager.validate('test.required', null)
      expect(result).toContain('必填')
    })

    it('应该验证枚举值', () => {
      configManager.registerSchema('test.enum', {
        type: 'string',
        enum: ['option1', 'option2', 'option3']
      })

      const result = configManager.validate('test.enum', 'invalid')
      expect(result).toContain('必须是以下之一')
    })

    it('应该使用自定义验证函数', () => {
      configManager.registerSchema('test.custom', {
        type: 'number',
        validate: (value) => value > 0 || '必须大于 0'
      })

      expect(configManager.validate('test.custom', -1)).toBe('必须大于 0')
      expect(configManager.validate('test.custom', 5)).toBe(true)
    })

    it('应该验证对象属性', () => {
      configManager.registerSchema('test.object', {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          age: { type: 'number' }
        }
      })

      const result = configManager.validate('test.object', { age: 25 })
      expect(result).toContain('必填')
    })

    it('应该验证数组元素', () => {
      configManager.registerSchema('test.array', {
        type: 'array',
        items: { type: 'number' }
      })

      const result = configManager.validate('test.array', [1, 2, 'three'])
      expect(result).toContain('类型错误')
    })

    it('应该在设置无效配置时抛出错误', async () => {
      configManager.registerSchema('test.validated', {
        type: 'number',
        required: true
      })

      await expect(
        configManager.set('test.validated', 'invalid')
      ).rejects.toThrow('配置验证失败')
    })

    it('应该允许未注册模式的配置', () => {
      expect(configManager.validate('unregistered.key', 'any value')).toBe(true)
    })
  })

  describe('配置变更通知', () => {
    it('应该在配置变更时触发 onChange 监听器', async () => {
      const callback = vi.fn()
      configManager.onChange('test.key', callback)

      await configManager.set('test.key', 'new value')

      expect(callback).toHaveBeenCalledWith({
        key: 'test.key',
        oldValue: undefined,
        newValue: 'new value',
        level: ConfigLevel.User
      })
    })

    it('应该在任何配置变更时触发 onAnyChange 监听器', async () => {
      const callback = vi.fn()
      configManager.onAnyChange(callback)

      await configManager.set('key1', 'value1')
      await configManager.set('key2', 'value2')

      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('应该允许取消订阅', async () => {
      const callback = vi.fn()
      const unsubscribe = configManager.onChange('test.key', callback)

      await configManager.set('test.key', 'value1')
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()

      await configManager.set('test.key', 'value2')
      expect(callback).toHaveBeenCalledTimes(1) // 不应该再次调用
    })

    it('应该在监听器抛出错误时继续执行其他监听器', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error')
      })
      const successCallback = vi.fn()

      configManager.onChange('test.key', errorCallback)
      configManager.onChange('test.key', successCallback)

      await configManager.set('test.key', 'value')

      expect(errorCallback).toHaveBeenCalled()
      expect(successCallback).toHaveBeenCalled()
    })

    it('应该在 update 时为每个配置触发变更事件', async () => {
      const callback = vi.fn()
      configManager.onAnyChange(callback)

      await configManager.update({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      })

      expect(callback).toHaveBeenCalledTimes(3)
    })
  })

  describe('配置操作', () => {
    it('应该设置和获取配置', async () => {
      await configManager.set('test.key', 'test value')
      expect(configManager.get('test.key')).toBe('test value')
    })

    it('应该批量更新配置', async () => {
      await configManager.update({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      })

      expect(configManager.get('key1')).toBe('value1')
      expect(configManager.get('key2')).toBe('value2')
      expect(configManager.get('key3')).toBe('value3')
    })

    it('应该删除配置', async () => {
      await configManager.set('test.key', 'value')
      expect(configManager.get('test.key')).toBe('value')

      await configManager.delete('test.key')
      expect(configManager.get('test.key')).toBeUndefined()
    })

    it('应该重置特定配置', async () => {
      await configManager.set('test.key', 'user value', ConfigLevel.User)
      await configManager.set('test.key', 'workspace value', ConfigLevel.Workspace)

      await configManager.reset('test.key', ConfigLevel.User)

      expect(configManager.get('test.key')).toBe('workspace value')
    })

    it('应该重置所有层级的特定配置', async () => {
      await configManager.set('test.key', 'user value', ConfigLevel.User)
      await configManager.set('test.key', 'workspace value', ConfigLevel.Workspace)

      await configManager.reset('test.key')

      expect(configManager.get('test.key')).toBeUndefined()
    })

    it('应该重置特定层级的所有配置', async () => {
      await configManager.set('key1', 'value1', ConfigLevel.User)
      await configManager.set('key2', 'value2', ConfigLevel.User)
      await configManager.set('key3', 'value3', ConfigLevel.Workspace)

      await configManager.reset(undefined, ConfigLevel.User)

      expect(configManager.get('key1')).toBeUndefined()
      expect(configManager.get('key2')).toBeUndefined()
      expect(configManager.get('key3')).toBe('value3')
    })

    it('应该重置所有配置（除了 Default）', async () => {
      await configManager.set('key1', 'default', ConfigLevel.Default)
      await configManager.set('key2', 'user', ConfigLevel.User)
      await configManager.set('key3', 'workspace', ConfigLevel.Workspace)

      await configManager.reset()

      expect(configManager.get('key1')).toBe('default')
      expect(configManager.get('key2')).toBeUndefined()
      expect(configManager.get('key3')).toBeUndefined()
    })
  })

  describe('配置模式', () => {
    it('应该在注册模式时设置默认值', () => {
      configManager.registerSchema('test.default', {
        type: 'string',
        default: 'default value'
      })

      expect(configManager.get('test.default')).toBe('default value')
    })

    it('应该不覆盖已存在的默认配置', () => {
      configManager.set('test.existing', 'existing value', ConfigLevel.Default)

      configManager.registerSchema('test.existing', {
        type: 'string',
        default: 'new default'
      })

      expect(configManager.get('test.existing')).toBe('existing value')
    })
  })

  describe('导入导出', () => {
    it('应该导出配置', async () => {
      await configManager.set('key1', 'value1', ConfigLevel.User)
      await configManager.set('key2', 'value2', ConfigLevel.User)

      const exported = configManager.export(ConfigLevel.User)

      expect(exported).toEqual({
        key1: 'value1',
        key2: 'value2'
      })
    })

    it('应该导出合并后的配置', async () => {
      await configManager.set('key1', 'default', ConfigLevel.Default)
      await configManager.set('key2', 'user', ConfigLevel.User)

      const exported = configManager.export()

      expect(exported).toEqual({
        key1: 'default',
        key2: 'user'
      })
    })

    it('应该导入配置', async () => {
      await configManager.import({
        key1: 'value1',
        key2: 'value2'
      }, ConfigLevel.User)

      expect(configManager.get('key1')).toBe('value1')
      expect(configManager.get('key2')).toBe('value2')
    })

    it('应该在导入时验证配置', async () => {
      configManager.registerSchema('validated.key', {
        type: 'number',
        required: true
      })

      await expect(
        configManager.import({
          'validated.key': 'invalid'
        })
      ).rejects.toThrow('配置验证失败')
    })
  })
})
