import { describe, it, expect, beforeEach } from 'vitest'
import { ResourceRegistryImpl } from '../resource-registry'
import type { ResourceDescriptor } from '../types'

describe('ResourceRegistry Unit Tests', () => {
  let registry: ResourceRegistryImpl

  beforeEach(() => {
    registry = new ResourceRegistryImpl()
  })

  describe('资源注册', () => {
    it('应该注册和获取资源', () => {
      const resource = { name: 'Test Component' }
      const descriptor: ResourceDescriptor = {
        id: 'test-component',
        type: 'component',
        value: resource
      }

      registry.register(descriptor)
      
      const retrieved = registry.get('test-component')
      expect(retrieved).toBe(resource)
    })

    it('应该注册带元数据的资源', () => {
      const resource = { name: 'Test Utility' }
      const descriptor: ResourceDescriptor = {
        id: 'test-utility',
        type: 'utility',
        value: resource,
        metadata: {
          version: '1.0.0',
          tags: ['helper', 'test'],
          deprecated: false
        }
      }

      registry.register(descriptor)
      
      const retrieved = registry.get('test-utility')
      expect(retrieved).toBe(resource)
    })

    it('应该覆盖已存在的资源', () => {
      const resource1 = { name: 'First' }
      const resource2 = { name: 'Second' }

      registry.register({
        id: 'test-resource',
        type: 'component',
        value: resource1
      })

      registry.register({
        id: 'test-resource',
        type: 'component',
        value: resource2
      })

      const retrieved = registry.get('test-resource')
      expect(retrieved).toBe(resource2)
    })

    it('应该批量注册资源', () => {
      const descriptors: ResourceDescriptor[] = [
        { id: 'resource-1', type: 'component', value: { name: 'Component 1' } },
        { id: 'resource-2', type: 'utility', value: { name: 'Utility 1' } },
        { id: 'resource-3', type: 'constant', value: 42 }
      ]

      registry.registerBatch(descriptors)

      expect(registry.get('resource-1')).toBe(descriptors[0].value)
      expect(registry.get('resource-2')).toBe(descriptors[1].value)
      expect(registry.get('resource-3')).toBe(descriptors[2].value)
    })
  })

  describe('资源获取', () => {
    it('应该对不存在的资源返回 null', () => {
      const retrieved = registry.get('non-existent')
      expect(retrieved).toBeNull()
    })

    it('应该按类型获取资源', () => {
      registry.register({
        id: 'component-1',
        type: 'component',
        value: { name: 'Component 1' }
      })

      registry.register({
        id: 'component-2',
        type: 'component',
        value: { name: 'Component 2' }
      })

      registry.register({
        id: 'utility-1',
        type: 'utility',
        value: { name: 'Utility 1' }
      })

      const components = registry.getByType('component')
      expect(components).toHaveLength(2)
      expect(components[0]).toEqual({ name: 'Component 1' })
      expect(components[1]).toEqual({ name: 'Component 2' })
    })

    it('应该对不存在的类型返回空数组', () => {
      const resources = registry.getByType('non-existent-type')
      expect(resources).toEqual([])
    })

    it('应该获取所有资源', () => {
      registry.register({
        id: 'resource-1',
        type: 'component',
        value: { name: 'Component 1' }
      })

      registry.register({
        id: 'resource-2',
        type: 'utility',
        value: { name: 'Utility 1' }
      })

      const allResources = registry.getAll()
      expect(allResources).toHaveLength(2)
      expect(allResources[0].id).toBe('resource-1')
      expect(allResources[1].id).toBe('resource-2')
    })

    it('应该对空注册表返回空数组', () => {
      const allResources = registry.getAll()
      expect(allResources).toEqual([])
    })
  })

  describe('资源检查', () => {
    it('has 应该对已注册的资源返回 true', () => {
      registry.register({
        id: 'test-resource',
        type: 'component',
        value: {}
      })

      expect(registry.has('test-resource')).toBe(true)
    })

    it('has 应该对未注册的资源返回 false', () => {
      expect(registry.has('non-existent')).toBe(false)
    })
  })

  describe('资源注销', () => {
    it('应该注销单个资源', () => {
      registry.register({
        id: 'test-resource',
        type: 'component',
        value: {}
      })

      expect(registry.has('test-resource')).toBe(true)

      registry.unregister('test-resource')

      expect(registry.has('test-resource')).toBe(false)
      expect(registry.get('test-resource')).toBeNull()
    })

    it('应该按类型注销资源', () => {
      registry.register({
        id: 'component-1',
        type: 'component',
        value: { name: 'Component 1' }
      })

      registry.register({
        id: 'component-2',
        type: 'component',
        value: { name: 'Component 2' }
      })

      registry.register({
        id: 'utility-1',
        type: 'utility',
        value: { name: 'Utility 1' }
      })

      registry.unregisterByType('component')

      expect(registry.has('component-1')).toBe(false)
      expect(registry.has('component-2')).toBe(false)
      expect(registry.has('utility-1')).toBe(true)
    })

    it('应该处理注销不存在的资源', () => {
      // Should not throw
      expect(() => registry.unregister('non-existent')).not.toThrow()
    })

    it('应该处理注销不存在的类型', () => {
      // Should not throw
      expect(() => registry.unregisterByType('non-existent-type')).not.toThrow()
    })
  })

  describe('资源查询', () => {
    beforeEach(() => {
      registry.register({
        id: 'component-1',
        type: 'component',
        value: { name: 'Component 1' },
        metadata: {
          version: '1.0.0',
          tags: ['ui', 'button']
        }
      })

      registry.register({
        id: 'component-2',
        type: 'component',
        value: { name: 'Component 2' },
        metadata: {
          version: '2.0.0',
          tags: ['ui', 'input']
        }
      })

      registry.register({
        id: 'utility-1',
        type: 'utility',
        value: { name: 'Utility 1' },
        metadata: {
          version: '1.0.0',
          tags: ['helper']
        }
      })

      registry.register({
        id: 'deprecated-component',
        type: 'component',
        value: { name: 'Old Component' },
        metadata: {
          deprecated: true,
          deprecationMessage: 'Use component-2 instead'
        }
      })
    })

    it('应该按类型查询资源', () => {
      const components = registry.query(
        (descriptor) => descriptor.type === 'component'
      )

      expect(components).toHaveLength(3)
      expect(components.every(d => d.type === 'component')).toBe(true)
    })

    it('应该按标签查询资源', () => {
      const uiResources = registry.query(
        (descriptor) => descriptor.metadata?.tags?.includes('ui') ?? false
      )

      expect(uiResources).toHaveLength(2)
      expect(uiResources[0].id).toBe('component-1')
      expect(uiResources[1].id).toBe('component-2')
    })

    it('应该查询非弃用的资源', () => {
      const activeResources = registry.query(
        (descriptor) => !descriptor.metadata?.deprecated
      )

      expect(activeResources).toHaveLength(3)
      expect(activeResources.every(d => !d.metadata?.deprecated)).toBe(true)
    })

    it('应该查询特定版本的资源', () => {
      const v1Resources = registry.query(
        (descriptor) => descriptor.metadata?.version === '1.0.0'
      )

      expect(v1Resources).toHaveLength(2)
      expect(v1Resources[0].id).toBe('component-1')
      expect(v1Resources[1].id).toBe('utility-1')
    })

    it('应该对无匹配结果返回空数组', () => {
      const results = registry.query(
        (descriptor) => descriptor.type === 'non-existent-type'
      )

      expect(results).toEqual([])
    })

    it('应该支持复杂查询', () => {
      const results = registry.query(
        (descriptor) => 
          descriptor.type === 'component' &&
          descriptor.metadata?.tags?.includes('ui') &&
          !descriptor.metadata?.deprecated
      )

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('component-1')
      expect(results[1].id).toBe('component-2')
    })
  })

  describe('类型安全', () => {
    it('应该保持资源的类型', () => {
      interface MyComponent {
        render: () => string
      }

      const component: MyComponent = {
        render: () => 'Hello'
      }

      registry.register({
        id: 'my-component',
        type: 'component',
        value: component
      })

      const retrieved = registry.get<MyComponent>('my-component')
      expect(retrieved?.render()).toBe('Hello')
    })

    it('应该处理不同类型的资源', () => {
      // String resource
      registry.register({
        id: 'string-resource',
        type: 'constant',
        value: 'Hello World'
      })

      // Number resource
      registry.register({
        id: 'number-resource',
        type: 'constant',
        value: 42
      })

      // Object resource
      registry.register({
        id: 'object-resource',
        type: 'config',
        value: { key: 'value' }
      })

      // Function resource
      registry.register({
        id: 'function-resource',
        type: 'utility',
        value: (x: number) => x * 2
      })

      expect(registry.get<string>('string-resource')).toBe('Hello World')
      expect(registry.get<number>('number-resource')).toBe(42)
      expect(registry.get<{ key: string }>('object-resource')).toEqual({ key: 'value' })
      expect(registry.get<(x: number) => number>('function-resource')?.(5)).toBe(10)
    })
  })

  describe('边界情况', () => {
    it('应该处理空字符串 ID', () => {
      registry.register({
        id: '',
        type: 'test',
        value: 'empty-id'
      })

      expect(registry.get('')).toBe('empty-id')
    })

    it('应该处理特殊字符 ID', () => {
      const specialIds = [
        'resource.with.dots',
        'resource-with-dashes',
        'resource_with_underscores',
        'resource/with/slashes',
        'resource:with:colons'
      ]

      specialIds.forEach(id => {
        registry.register({
          id,
          type: 'test',
          value: id
        })

        expect(registry.get(id)).toBe(id)
      })
    })

    it('应该处理 null 和 undefined 值', () => {
      registry.register({
        id: 'null-resource',
        type: 'test',
        value: null
      })

      registry.register({
        id: 'undefined-resource',
        type: 'test',
        value: undefined
      })

      expect(registry.get('null-resource')).toBeNull()
      expect(registry.get('undefined-resource')).toBeUndefined()
    })

    it('应该处理大量资源', () => {
      const count = 1000

      for (let i = 0; i < count; i++) {
        registry.register({
          id: `resource-${i}`,
          type: 'test',
          value: i
        })
      }

      expect(registry.getAll()).toHaveLength(count)
      expect(registry.get('resource-500')).toBe(500)
    })
  })
})
