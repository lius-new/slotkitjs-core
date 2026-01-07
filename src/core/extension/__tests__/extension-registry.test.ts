import { describe, it, expect, beforeEach } from 'vitest'
import { ExtensionRegistryImpl } from '../extension-registry'
import type { ExtensionPoint, Contribution } from '../types'

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistryImpl

  beforeEach(() => {
    registry = new ExtensionRegistryImpl()
  })

  describe('扩展点注册', () => {
    it('应该成功注册扩展点', () => {
      const extensionPoint: ExtensionPoint = {
        id: 'test-extension',
        name: 'Test Extension',
        description: 'A test extension point',
        multiple: true
      }

      registry.registerExtensionPoint(extensionPoint)

      expect(registry.hasExtensionPoint('test-extension')).toBe(true)
    })

    it('应该拒绝重复注册相同 ID 的扩展点', () => {
      const extensionPoint: ExtensionPoint = {
        id: 'test-extension',
        name: 'Test Extension',
        multiple: true
      }

      registry.registerExtensionPoint(extensionPoint)

      expect(() => {
        registry.registerExtensionPoint(extensionPoint)
      }).toThrow('扩展点已存在: test-extension')
    })

    it('应该返回所有注册的扩展点', () => {
      const point1: ExtensionPoint = {
        id: 'extension-1',
        name: 'Extension 1',
        multiple: true
      }

      const point2: ExtensionPoint = {
        id: 'extension-2',
        name: 'Extension 2',
        multiple: false
      }

      registry.registerExtensionPoint(point1)
      registry.registerExtensionPoint(point2)

      const allPoints = registry.getExtensionPoints()
      expect(allPoints).toHaveLength(2)
      expect(allPoints.find(p => p.id === 'extension-1')).toBeDefined()
      expect(allPoints.find(p => p.id === 'extension-2')).toBeDefined()
    })
  })

  describe('贡献验证', () => {
    beforeEach(() => {
      registry.registerExtensionPoint({
        id: 'test-extension',
        name: 'Test Extension',
        multiple: true
      })
    })

    it('应该成功添加贡献', () => {
      registry.contribute('test-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test' }
      })

      const contributions = registry.getContributions('test-extension')
      expect(contributions).toHaveLength(1)
      expect(contributions[0].contributorId).toBe('plugin-1')
      expect(contributions[0].value).toEqual({ data: 'test' })
    })

    it('应该拒绝向不存在的扩展点贡献', () => {
      expect(() => {
        registry.contribute('non-existent', {
          contributorId: 'plugin-1',
          value: { data: 'test' }
        })
      }).toThrow('扩展点不存在: non-existent')
    })

    it('应该拒绝同一贡献者重复贡献', () => {
      registry.contribute('test-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test1' }
      })

      expect(() => {
        registry.contribute('test-extension', {
          contributorId: 'plugin-1',
          value: { data: 'test2' }
        })
      }).toThrow('贡献者 plugin-1 已经贡献到扩展点 test-extension')
    })

    it('应该为贡献设置默认值', () => {
      registry.contribute('test-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test' }
      })

      const contributions = registry.getContributions('test-extension')
      expect(contributions[0].priority).toBe(0)
      expect(contributions[0].enabled).toBe(true)
    })

    it('应该拒绝向 multiple=false 的扩展点添加多个贡献', () => {
      registry.registerExtensionPoint({
        id: 'single-extension',
        name: 'Single Extension',
        multiple: false
      })

      registry.contribute('single-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test1' }
      })

      expect(() => {
        registry.contribute('single-extension', {
          contributorId: 'plugin-2',
          value: { data: 'test2' }
        })
      }).toThrow('扩展点 single-extension 不允许多个贡献')
    })
  })

  describe('多个贡献', () => {
    beforeEach(() => {
      registry.registerExtensionPoint({
        id: 'multi-extension',
        name: 'Multi Extension',
        multiple: true
      })
    })

    it('应该支持多个贡献者', () => {
      registry.contribute('multi-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test1' }
      })

      registry.contribute('multi-extension', {
        contributorId: 'plugin-2',
        value: { data: 'test2' }
      })

      registry.contribute('multi-extension', {
        contributorId: 'plugin-3',
        value: { data: 'test3' }
      })

      const contributions = registry.getContributions('multi-extension')
      expect(contributions).toHaveLength(3)
    })

    it('应该按优先级降序返回贡献', () => {
      registry.contribute('multi-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test1' },
        priority: 10
      })

      registry.contribute('multi-extension', {
        contributorId: 'plugin-2',
        value: { data: 'test2' },
        priority: 50
      })

      registry.contribute('multi-extension', {
        contributorId: 'plugin-3',
        value: { data: 'test3' },
        priority: 30
      })

      const contributions = registry.getContributions('multi-extension')
      expect(contributions[0].contributorId).toBe('plugin-2') // priority 50
      expect(contributions[1].contributorId).toBe('plugin-3') // priority 30
      expect(contributions[2].contributorId).toBe('plugin-1') // priority 10
    })

    it('应该只返回启用的贡献', () => {
      registry.contribute('multi-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test1' },
        enabled: true
      })

      registry.contribute('multi-extension', {
        contributorId: 'plugin-2',
        value: { data: 'test2' },
        enabled: false
      })

      registry.contribute('multi-extension', {
        contributorId: 'plugin-3',
        value: { data: 'test3' },
        enabled: true
      })

      const contributions = registry.getContributions('multi-extension')
      expect(contributions).toHaveLength(2)
      expect(contributions.find(c => c.contributorId === 'plugin-2')).toBeUndefined()
    })

    it('应该能够获取特定贡献者的贡献', () => {
      registry.contribute('multi-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test1' }
      })

      registry.contribute('multi-extension', {
        contributorId: 'plugin-2',
        value: { data: 'test2' }
      })

      const contribution = registry.getContribution('multi-extension', 'plugin-1')
      expect(contribution).not.toBeNull()
      expect(contribution?.contributorId).toBe('plugin-1')
      expect(contribution?.value).toEqual({ data: 'test1' })
    })

    it('对于不存在的贡献应该返回 null', () => {
      const contribution = registry.getContribution('multi-extension', 'non-existent')
      expect(contribution).toBeNull()
    })
  })

  describe('贡献移除', () => {
    beforeEach(() => {
      registry.registerExtensionPoint({
        id: 'test-extension',
        name: 'Test Extension',
        multiple: true
      })

      registry.contribute('test-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test1' }
      })

      registry.contribute('test-extension', {
        contributorId: 'plugin-2',
        value: { data: 'test2' }
      })
    })

    it('应该能够移除特定贡献', () => {
      registry.removeContribution('test-extension', 'plugin-1')

      const contributions = registry.getContributions('test-extension')
      expect(contributions).toHaveLength(1)
      expect(contributions[0].contributorId).toBe('plugin-2')
    })

    it('移除不存在的贡献不应该报错', () => {
      expect(() => {
        registry.removeContribution('test-extension', 'non-existent')
      }).not.toThrow()
    })

    it('应该能够移除贡献者的所有贡献', () => {
      registry.registerExtensionPoint({
        id: 'another-extension',
        name: 'Another Extension',
        multiple: true
      })

      registry.contribute('another-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test3' }
      })

      // plugin-1 现在在两个扩展点都有贡献
      expect(registry.getContributions('test-extension')).toHaveLength(2)
      expect(registry.getContributions('another-extension')).toHaveLength(1)

      // 移除 plugin-1 的所有贡献
      registry.removeAllContributions('plugin-1')

      // 验证 plugin-1 的所有贡献都被移除
      expect(registry.getContribution('test-extension', 'plugin-1')).toBeNull()
      expect(registry.getContribution('another-extension', 'plugin-1')).toBeNull()

      // 验证其他贡献者的贡献仍然存在
      expect(registry.getContributions('test-extension')).toHaveLength(1)
      expect(registry.getContributions('test-extension')[0].contributorId).toBe('plugin-2')
    })
  })

  describe('边缘情况', () => {
    it('对于不存在的扩展点，getContributions 应该返回空数组', () => {
      const contributions = registry.getContributions('non-existent')
      expect(contributions).toEqual([])
    })

    it('对于没有贡献的扩展点，应该返回空数组', () => {
      registry.registerExtensionPoint({
        id: 'empty-extension',
        name: 'Empty Extension',
        multiple: true
      })

      const contributions = registry.getContributions('empty-extension')
      expect(contributions).toEqual([])
    })

    it('应该正确处理优先级为 0 的贡献', () => {
      registry.registerExtensionPoint({
        id: 'test-extension',
        name: 'Test Extension',
        multiple: true
      })

      registry.contribute('test-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test1' },
        priority: 0
      })

      const contributions = registry.getContributions('test-extension')
      expect(contributions).toHaveLength(1)
      expect(contributions[0].priority).toBe(0)
    })

    it('应该正确处理负优先级', () => {
      registry.registerExtensionPoint({
        id: 'test-extension',
        name: 'Test Extension',
        multiple: true
      })

      registry.contribute('test-extension', {
        contributorId: 'plugin-1',
        value: { data: 'test1' },
        priority: -10
      })

      registry.contribute('test-extension', {
        contributorId: 'plugin-2',
        value: { data: 'test2' },
        priority: 5
      })

      const contributions = registry.getContributions('test-extension')
      expect(contributions[0].contributorId).toBe('plugin-2') // priority 5
      expect(contributions[1].contributorId).toBe('plugin-1') // priority -10
    })
  })
})
