import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { DependencyManager } from '../dependency-manager'
import type { PluginManifest } from '../../types/plugin'

describe('DependencyManager Property Tests', () => {
  /**
   * Feature: plugin-decoupling, Property 16: 依赖加载顺序
   * 对于任何具有依赖关系的插件集合，当插件被加载时，则插件系统应该在依赖插件之前加载依赖项，遵循拓扑排序的顺序。
   * Validates: Requirements 5.1
   */
  it('属性 16: 依赖应该在依赖者之前加载', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
            name: fc.string(),
            version: fc.string(),
            description: fc.string(),
            author: fc.string(),
            entry: fc.string(),
            slots: fc.array(fc.string()),
            enabled: fc.boolean(),
            dependencies: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (manifests) => {
          // 确保 ID 唯一
          const uniqueManifests = Array.from(
            new Map(manifests.map(m => [m.id, m])).values()
          )

          if (uniqueManifests.length === 0) return

          const manager = new DependencyManager()
          const graph = manager.buildGraph(uniqueManifests)
          
          // 只测试没有循环依赖的情况
          const validation = manager.validate(graph)
          const hasCycles = validation.errors.some(e => e.type === 'circular-dependency')
          
          if (hasCycles) return // 跳过有循环依赖的情况

          const loadOrder = manager.resolveLoadOrder(graph)
          
          // 验证：对于每个插件，其所有依赖都应该在它之前出现
          for (let i = 0; i < loadOrder.length; i++) {
            const pluginId = loadOrder[i]
            const deps = graph.edges.get(pluginId) || new Set()
            
            for (const dep of deps) {
              if (graph.nodes.has(dep)) {
                const depIndex = loadOrder.indexOf(dep)
                // 依赖应该在当前插件之前
                expect(depIndex).toBeLessThan(i)
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: plugin-decoupling, Property 17: 缺失依赖防止
   * 对于任何缺少必需依赖的插件，当插件系统尝试加载该插件时，则加载应该失败并记录清晰的错误消息。
   * Validates: Requirements 5.2
   */
  it('属性 17: 缺失依赖应该被检测', () => {
    fc.assert(
      fc.property(
        fc.record({
          pluginId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          missingDep: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)
        }).filter(data => data.pluginId !== data.missingDep),
        (data) => {
          const manifest: PluginManifest = {
            id: data.pluginId,
            name: 'Test Plugin',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            entry: './index.js',
            slots: [],
            enabled: true,
            dependencies: [data.missingDep]
          }

          const manager = new DependencyManager()
          const graph = manager.buildGraph([manifest])
          const validation = manager.validate(graph)

          // 应该检测到缺失依赖
          expect(validation.valid).toBe(false)
          expect(validation.errors).toHaveLength(1)
          expect(validation.errors[0].type).toBe('missing-dependency')
          expect(validation.errors[0].pluginId).toBe(data.pluginId)
          expect(validation.errors[0].details).toContain(data.missingDep)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: plugin-decoupling, Property 18: 循环依赖检测
   * 对于任何形成循环依赖的插件集合，当插件系统验证依赖图时，则它应该检测循环并拒绝配置并提供诊断信息。
   * Validates: Requirements 5.3
   */
  it('属性 18: 循环依赖应该被检测', () => {
    fc.assert(
      fc.property(
        fc.record({
          pluginA: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          pluginB: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)
        }).filter(data => data.pluginA !== data.pluginB),
        (data) => {
          // 创建循环依赖: A -> B -> A
          const manifests: PluginManifest[] = [
            {
              id: data.pluginA,
              name: 'Plugin A',
              version: '1.0.0',
              description: 'Test',
              author: 'Test',
              entry: './index.js',
              slots: [],
              enabled: true,
              dependencies: [data.pluginB]
            },
            {
              id: data.pluginB,
              name: 'Plugin B',
              version: '1.0.0',
              description: 'Test',
              author: 'Test',
              entry: './index.js',
              slots: [],
              enabled: true,
              dependencies: [data.pluginA]
            }
          ]

          const manager = new DependencyManager()
          const graph = manager.buildGraph(manifests)
          const validation = manager.validate(graph)

          // 应该检测到循环依赖
          expect(validation.valid).toBe(false)
          const circularErrors = validation.errors.filter(e => e.type === 'circular-dependency')
          expect(circularErrors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: plugin-decoupling, Property 19: 可选依赖处理
   * 对于任何具有可选依赖的插件，当这些可选依赖不可用时，则插件系统仍应成功加载插件。
   * Validates: Requirements 5.4
   * 
   * 注意：当前 PluginManifest 不支持可选依赖标记
   * 此测试验证基本行为：插件可以在没有所有依赖的情况下出现在加载顺序中
   */
  it('属性 19: 可选依赖处理（基础验证）', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (pluginId) => {
          const manifest: PluginManifest = {
            id: pluginId,
            name: 'Test Plugin',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            entry: './index.js',
            slots: [],
            enabled: true,
            dependencies: [] // 没有依赖
          }

          const manager = new DependencyManager()
          const graph = manager.buildGraph([manifest])
          const loadOrder = manager.resolveLoadOrder(graph)

          // 插件应该出现在加载顺序中
          expect(loadOrder).toContain(pluginId)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: plugin-decoupling, Property 20: 版本兼容性验证
   * 对于任何声明具有版本约束的依赖的插件，当插件系统验证依赖时，则它应该检查版本兼容性，如果版本不兼容则阻止加载。
   * Validates: Requirements 5.5
   * 
   * 注意：当前 PluginManifest 不支持版本约束
   * 此测试验证 validateVersions 方法存在并返回有效结果
   */
  it('属性 20: 版本兼容性验证（基础验证）', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            version: fc.string()
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (plugins) => {
          const manifests: PluginManifest[] = plugins.map(p => ({
            id: p.id,
            name: p.id,
            version: p.version,
            description: 'Test',
            author: 'Test',
            entry: './index.js',
            slots: [],
            enabled: true,
            dependencies: []
          }))

          const manager = new DependencyManager()
          const graph = manager.buildGraph(manifests)
          const validation = manager.validateVersions(graph)

          // 应该返回有效的验证结果
          expect(validation).toHaveProperty('valid')
          expect(validation).toHaveProperty('errors')
          expect(Array.isArray(validation.errors)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 额外属性测试: canLoad 应该正确检查依赖
   */
  it('属性: canLoad 应该验证所有依赖已加载', () => {
    fc.assert(
      fc.property(
        fc.record({
          pluginId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          depId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)
        }).filter(data => data.pluginId !== data.depId),
        (data) => {
          const manifests: PluginManifest[] = [
            {
              id: data.pluginId,
              name: 'Plugin',
              version: '1.0.0',
              description: 'Test',
              author: 'Test',
              entry: './index.js',
              slots: [],
              enabled: true,
              dependencies: [data.depId]
            },
            {
              id: data.depId,
              name: 'Dependency',
              version: '1.0.0',
              description: 'Test',
              author: 'Test',
              entry: './index.js',
              slots: [],
              enabled: true,
              dependencies: []
            }
          ]

          const manager = new DependencyManager()
          manager.buildGraph(manifests)

          // 依赖未加载时，不能加载插件
          expect(manager.canLoad(data.pluginId, new Set())).toBe(false)

          // 依赖已加载时，可以加载插件
          expect(manager.canLoad(data.pluginId, new Set([data.depId]))).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 额外属性测试: getMissingDependencies 应该返回所有缺失的依赖
   */
  it('属性: getMissingDependencies 应该识别所有缺失依赖', () => {
    fc.assert(
      fc.property(
        fc.record({
          pluginId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          missingDeps: fc.array(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 3 }
          )
        }),
        (data) => {
          // 确保依赖 ID 唯一且不等于插件 ID
          const uniqueDeps = Array.from(new Set(data.missingDeps))
            .filter(dep => dep !== data.pluginId)

          if (uniqueDeps.length === 0) return

          const manifest: PluginManifest = {
            id: data.pluginId,
            name: 'Plugin',
            version: '1.0.0',
            description: 'Test',
            author: 'Test',
            entry: './index.js',
            slots: [],
            enabled: true,
            dependencies: uniqueDeps
          }

          const manager = new DependencyManager()
          manager.buildGraph([manifest])

          const missing = manager.getMissingDependencies(data.pluginId)

          // 所有依赖都应该被识别为缺失
          expect(missing.length).toBe(uniqueDeps.length)
          for (const dep of uniqueDeps) {
            expect(missing).toContain(dep)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
