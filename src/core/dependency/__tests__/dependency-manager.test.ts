import { describe, it, expect, beforeEach } from 'vitest'
import { DependencyManager } from '../dependency-manager'
import { VersionValidator } from '../version-validator'
import type { PluginManifest } from '../../types/plugin'

describe('DependencyManager', () => {
  let manager: DependencyManager

  beforeEach(() => {
    manager = new DependencyManager()
  })

  describe('buildGraph', () => {
    it('应该从清单构建依赖图', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b']
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      const graph = manager.buildGraph(manifests)

      expect(graph.nodes.size).toBe(2)
      expect(graph.nodes.has('plugin-a')).toBe(true)
      expect(graph.nodes.has('plugin-b')).toBe(true)
      expect(graph.edges.get('plugin-a')).toEqual(new Set(['plugin-b']))
      expect(graph.edges.get('plugin-b')).toEqual(new Set())
    })

    it('应该处理空清单数组', () => {
      const graph = manager.buildGraph([])

      expect(graph.nodes.size).toBe(0)
      expect(graph.edges.size).toBe(0)
    })
  })

  describe('validate', () => {
    it('应该验证有效的依赖图', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b']
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      const graph = manager.buildGraph(manifests)
      const result = manager.validate(graph)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测缺失依赖', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-missing']
        }
      ]

      const graph = manager.buildGraph(manifests)
      const result = manager.validate(graph)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('missing-dependency')
      expect(result.errors[0].pluginId).toBe('plugin-a')
      expect(result.errors[0].details).toContain('plugin-missing')
    })

    it('应该检测循环依赖', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b']
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-a']
        }
      ]

      const graph = manager.buildGraph(manifests)
      const result = manager.validate(graph)

      expect(result.valid).toBe(false)
      const circularErrors = result.errors.filter(e => e.type === 'circular-dependency')
      expect(circularErrors.length).toBeGreaterThan(0)
    })

    it('应该检测复杂的循环依赖', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b']
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-c']
        },
        {
          id: 'plugin-c',
          name: 'Plugin C',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-a']
        }
      ]

      const graph = manager.buildGraph(manifests)
      const result = manager.validate(graph)

      expect(result.valid).toBe(false)
      const circularErrors = result.errors.filter(e => e.type === 'circular-dependency')
      expect(circularErrors.length).toBeGreaterThan(0)
    })
  })

  describe('resolveLoadOrder', () => {
    it('应该按拓扑顺序解析加载顺序', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b', 'plugin-c']
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-c']
        },
        {
          id: 'plugin-c',
          name: 'Plugin C',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      const graph = manager.buildGraph(manifests)
      const loadOrder = manager.resolveLoadOrder(graph)

      // plugin-c 应该最先加载（没有依赖）
      // plugin-b 应该在 plugin-c 之后
      // plugin-a 应该最后加载（依赖其他两个）
      expect(loadOrder.indexOf('plugin-c')).toBeLessThan(loadOrder.indexOf('plugin-b'))
      expect(loadOrder.indexOf('plugin-b')).toBeLessThan(loadOrder.indexOf('plugin-a'))
      expect(loadOrder.indexOf('plugin-c')).toBeLessThan(loadOrder.indexOf('plugin-a'))
    })

    it('应该处理没有依赖的插件', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      const graph = manager.buildGraph(manifests)
      const loadOrder = manager.resolveLoadOrder(graph)

      expect(loadOrder).toHaveLength(2)
      expect(loadOrder).toContain('plugin-a')
      expect(loadOrder).toContain('plugin-b')
    })

    it('应该处理循环依赖而不崩溃', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b']
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-a']
        }
      ]

      const graph = manager.buildGraph(manifests)
      
      // 不应该抛出错误
      expect(() => manager.resolveLoadOrder(graph)).not.toThrow()
    })
  })

  describe('canLoad', () => {
    it('应该在所有依赖已加载时返回 true', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b']
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      manager.buildGraph(manifests)
      const loadedPlugins = new Set(['plugin-b'])

      expect(manager.canLoad('plugin-a', loadedPlugins)).toBe(true)
    })

    it('应该在依赖未加载时返回 false', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b']
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      manager.buildGraph(manifests)
      const loadedPlugins = new Set<string>()

      expect(manager.canLoad('plugin-a', loadedPlugins)).toBe(false)
    })

    it('应该在没有依赖时返回 true', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      manager.buildGraph(manifests)
      const loadedPlugins = new Set<string>()

      expect(manager.canLoad('plugin-a', loadedPlugins)).toBe(true)
    })
  })

  describe('getMissingDependencies', () => {
    it('应该返回所有缺失的依赖', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b', 'plugin-c']
        }
      ]

      manager.buildGraph(manifests)
      const missing = manager.getMissingDependencies('plugin-a')

      expect(missing).toHaveLength(2)
      expect(missing).toContain('plugin-b')
      expect(missing).toContain('plugin-c')
    })

    it('应该在没有缺失依赖时返回空数组', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: ['plugin-b']
        },
        {
          id: 'plugin-b',
          name: 'Plugin B',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      manager.buildGraph(manifests)
      const missing = manager.getMissingDependencies('plugin-a')

      expect(missing).toHaveLength(0)
    })

    it('应该在插件没有依赖时返回空数组', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      manager.buildGraph(manifests)
      const missing = manager.getMissingDependencies('plugin-a')

      expect(missing).toHaveLength(0)
    })
  })

  describe('validateVersions', () => {
    it('应该返回有效的验证结果', () => {
      const manifests: PluginManifest[] = [
        {
          id: 'plugin-a',
          name: 'Plugin A',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          entry: './index.js',
          slots: [],
          enabled: true,
          dependencies: []
        }
      ]

      const graph = manager.buildGraph(manifests)
      const result = manager.validateVersions(graph)

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })
})

describe('VersionValidator', () => {
  describe('compareVersions', () => {
    it('应该正确比较版本', () => {
      expect(VersionValidator.compareVersions('1.0.0', '1.0.0')).toBe(0)
      expect(VersionValidator.compareVersions('1.0.1', '1.0.0')).toBe(1)
      expect(VersionValidator.compareVersions('1.0.0', '1.0.1')).toBe(-1)
      expect(VersionValidator.compareVersions('2.0.0', '1.9.9')).toBe(1)
      expect(VersionValidator.compareVersions('1.1.0', '1.0.9')).toBe(1)
    })

    it('应该处理无效版本', () => {
      expect(VersionValidator.compareVersions('invalid', '1.0.0')).toBe(0)
      expect(VersionValidator.compareVersions('1.0.0', 'invalid')).toBe(0)
    })
  })

  describe('satisfies', () => {
    it('应该验证精确匹配', () => {
      expect(VersionValidator.satisfies('1.0.0', '1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('1.0.1', '1.0.0')).toBe(false)
    })

    it('应该验证兼容版本 (^)', () => {
      expect(VersionValidator.satisfies('1.0.0', '^1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('1.0.1', '^1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('1.1.0', '^1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('2.0.0', '^1.0.0')).toBe(false)
      expect(VersionValidator.satisfies('0.9.9', '^1.0.0')).toBe(false)
    })

    it('应该验证近似版本 (~)', () => {
      expect(VersionValidator.satisfies('1.0.0', '~1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('1.0.1', '~1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('1.1.0', '~1.0.0')).toBe(false)
      expect(VersionValidator.satisfies('0.9.9', '~1.0.0')).toBe(false)
    })

    it('应该验证大于等于 (>=)', () => {
      expect(VersionValidator.satisfies('1.0.0', '>=1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('1.0.1', '>=1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('2.0.0', '>=1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('0.9.9', '>=1.0.0')).toBe(false)
    })

    it('应该验证大于 (>)', () => {
      expect(VersionValidator.satisfies('1.0.1', '>1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('1.0.0', '>1.0.0')).toBe(false)
      expect(VersionValidator.satisfies('0.9.9', '>1.0.0')).toBe(false)
    })

    it('应该验证小于等于 (<=)', () => {
      expect(VersionValidator.satisfies('1.0.0', '<=1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('0.9.9', '<=1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('1.0.1', '<=1.0.0')).toBe(false)
    })

    it('应该验证小于 (<)', () => {
      expect(VersionValidator.satisfies('0.9.9', '<1.0.0')).toBe(true)
      expect(VersionValidator.satisfies('1.0.0', '<1.0.0')).toBe(false)
      expect(VersionValidator.satisfies('1.0.1', '<1.0.0')).toBe(false)
    })
  })

  describe('isValidVersion', () => {
    it('应该验证有效版本', () => {
      expect(VersionValidator.isValidVersion('1.0.0')).toBe(true)
      expect(VersionValidator.isValidVersion('0.0.1')).toBe(true)
      expect(VersionValidator.isValidVersion('10.20.30')).toBe(true)
    })

    it('应该拒绝无效版本', () => {
      expect(VersionValidator.isValidVersion('invalid')).toBe(false)
      expect(VersionValidator.isValidVersion('1.0')).toBe(false)
      expect(VersionValidator.isValidVersion('1')).toBe(false)
      expect(VersionValidator.isValidVersion('')).toBe(false)
    })
  })
})
