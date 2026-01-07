import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { ExtensionRegistryImpl } from '../extension-registry'
import type { ExtensionPoint, Contribution } from '../types'

describe('ExtensionRegistry Property Tests', () => {
  let registry: ExtensionRegistryImpl

  beforeEach(() => {
    registry = new ExtensionRegistryImpl()
  })

  // Feature: plugin-decoupling, Property 21: 布局包装
  // 对于任何在清单中声明布局要求的页面插件，当页面被渲染时，则插件系统应该用指定的布局组件包装页面组件。
  it('属性 21: 页面插件应该能够声明并获取布局包装', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // pagePluginId
        fc.string({ minLength: 1 }), // layoutId
        fc.record({
          component: fc.constant('PageComponent'),
          layoutId: fc.string({ minLength: 1 })
        }), // page contribution value
        (pagePluginId, layoutId, pageValue) => {
          const registry = new ExtensionRegistryImpl()

          // 注册页面扩展点
          registry.registerExtensionPoint({
            id: 'pages',
            name: 'Pages',
            description: '页面扩展点',
            multiple: true
          })

          // 页面插件贡献到扩展点，声明布局要求
          const contributionValue = {
            ...pageValue,
            layoutId: layoutId
          }

          registry.contribute('pages', {
            contributorId: pagePluginId,
            value: contributionValue
          })

          // 获取贡献
          const contributions = registry.getContributions<any>('pages')

          // 验证贡献存在且包含布局要求
          expect(contributions).toHaveLength(1)
          expect(contributions[0].contributorId).toBe(pagePluginId)
          expect(contributions[0].value.layoutId).toBe(layoutId)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: plugin-decoupling, Property 22: 布局选择
  // 对于任何指定布局 ID 的页面插件，当有多个布局可用时，则插件系统应该使用清单中指定的布局。
  it('属性 22: 当有多个布局可用时，应该选择指定的布局', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // pagePluginId
        fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 5 }), // available layoutIds
        fc.integer({ min: 0, max: 4 }), // index of selected layout
        (pagePluginId, layoutIds, selectedIndex) => {
          // 确保 selectedIndex 在有效范围内
          const actualSelectedIndex = selectedIndex % layoutIds.length
          const selectedLayoutId = layoutIds[actualSelectedIndex]

          const registry = new ExtensionRegistryImpl()

          // 注册布局扩展点
          registry.registerExtensionPoint({
            id: 'layouts',
            name: 'Layouts',
            description: '布局扩展点',
            multiple: true
          })

          // 注册页面扩展点
          registry.registerExtensionPoint({
            id: 'pages',
            name: 'Pages',
            description: '页面扩展点',
            multiple: true
          })

          // 多个布局插件贡献到布局扩展点
          layoutIds.forEach((layoutId, index) => {
            registry.contribute('layouts', {
              contributorId: `layout-plugin-${index}`,
              value: {
                id: layoutId,
                component: `Layout${index}Component`
              }
            })
          })

          // 页面插件贡献到页面扩展点，指定布局
          registry.contribute('pages', {
            contributorId: pagePluginId,
            value: {
              component: 'PageComponent',
              layoutId: selectedLayoutId
            }
          })

          // 获取页面贡献
          const pageContributions = registry.getContributions<any>('pages')
          expect(pageContributions).toHaveLength(1)

          const pageContribution = pageContributions[0]
          const requestedLayoutId = pageContribution.value.layoutId

          // 获取所有可用的布局
          const layoutContributions = registry.getContributions<any>('layouts')
          expect(layoutContributions.length).toBeGreaterThanOrEqual(layoutIds.length)

          // 查找匹配的布局
          const matchingLayout = layoutContributions.find(
            (layout: any) => layout.value.id === requestedLayoutId
          )

          // 验证能够找到指定的布局
          expect(matchingLayout).toBeDefined()
          expect(matchingLayout?.value.id).toBe(selectedLayoutId)
        }
      ),
      { numRuns: 100 }
    )
  })

  // 额外的属性测试：注册的扩展点应该可被发现
  it('属性: 任何注册的扩展点都应该可被发现', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          description: fc.option(fc.string(), { nil: undefined }),
          multiple: fc.boolean()
        }),
        (extensionPoint) => {
          const registry = new ExtensionRegistryImpl()

          registry.registerExtensionPoint(extensionPoint)

          // 验证扩展点可被发现
          expect(registry.hasExtensionPoint(extensionPoint.id)).toBe(true)

          const allPoints = registry.getExtensionPoints()
          const found = allPoints.find(p => p.id === extensionPoint.id)
          expect(found).toBeDefined()
          expect(found?.name).toBe(extensionPoint.name)
        }
      ),
      { numRuns: 100 }
    )
  })

  // 额外的属性测试：贡献应该按优先级排序
  it('属性: 贡献应该按优先级降序返回', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // extensionPointId
        fc.array(
          fc.record({
            contributorId: fc.string({ minLength: 1 }),
            priority: fc.integer({ min: -100, max: 100 }),
            value: fc.anything()
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (extensionPointId, contributions) => {
          // 确保 contributorId 唯一
          const uniqueContributions = contributions.filter(
            (c, index, self) =>
              self.findIndex(x => x.contributorId === c.contributorId) === index
          )

          if (uniqueContributions.length < 2) {
            return // 跳过这个测试用例
          }

          const registry = new ExtensionRegistryImpl()

          registry.registerExtensionPoint({
            id: extensionPointId,
            name: 'Test Extension Point',
            multiple: true
          })

          // 添加所有贡献
          uniqueContributions.forEach(contribution => {
            registry.contribute(extensionPointId, contribution)
          })

          // 获取贡献
          const retrieved = registry.getContributions(extensionPointId)

          // 验证贡献按优先级降序排列
          for (let i = 0; i < retrieved.length - 1; i++) {
            const currentPriority = retrieved[i].priority ?? 0
            const nextPriority = retrieved[i + 1].priority ?? 0
            expect(currentPriority).toBeGreaterThanOrEqual(nextPriority)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // 额外的属性测试：移除贡献者的所有贡献
  it('属性: removeAllContributions 应该移除贡献者的所有贡献', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // contributorId
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }), // extensionPointIds
        fc.anything(), // value
        (contributorId, extensionPointIds, value) => {
          const registry = new ExtensionRegistryImpl()

          // 注册多个扩展点
          extensionPointIds.forEach(id => {
            registry.registerExtensionPoint({
              id,
              name: `Extension Point ${id}`,
              multiple: true
            })
          })

          // 同一个贡献者贡献到多个扩展点
          extensionPointIds.forEach(id => {
            registry.contribute(id, {
              contributorId,
              value
            })
          })

          // 验证贡献存在
          extensionPointIds.forEach(id => {
            const contributions = registry.getContributions(id)
            expect(contributions.length).toBeGreaterThan(0)
          })

          // 移除该贡献者的所有贡献
          registry.removeAllContributions(contributorId)

          // 验证所有贡献都被移除
          extensionPointIds.forEach(id => {
            const contribution = registry.getContribution(id, contributorId)
            expect(contribution).toBeNull()
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  // 额外的属性测试：禁用的贡献不应该被返回
  it('属性: 禁用的贡献不应该在 getContributions 中返回', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // extensionPointId
        fc.array(
          fc.record({
            contributorId: fc.string({ minLength: 1 }),
            enabled: fc.boolean(),
            value: fc.anything()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (extensionPointId, contributions) => {
          // 确保 contributorId 唯一
          const uniqueContributions = contributions.filter(
            (c, index, self) =>
              self.findIndex(x => x.contributorId === c.contributorId) === index
          )

          const registry = new ExtensionRegistryImpl()

          registry.registerExtensionPoint({
            id: extensionPointId,
            name: 'Test Extension Point',
            multiple: true
          })

          // 添加所有贡献
          uniqueContributions.forEach(contribution => {
            registry.contribute(extensionPointId, contribution)
          })

          // 获取贡献
          const retrieved = registry.getContributions(extensionPointId)

          // 验证只返回启用的贡献
          const enabledCount = uniqueContributions.filter(c => c.enabled !== false).length
          expect(retrieved).toHaveLength(enabledCount)

          // 验证所有返回的贡献都是启用的
          retrieved.forEach(contribution => {
            expect(contribution.enabled).toBe(true)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  // 额外的属性测试：单一贡献扩展点不应该接受多个贡献
  it('属性: multiple=false 的扩展点应该拒绝多个贡献', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // extensionPointId
        fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 5 }), // contributorIds
        fc.anything(), // value
        (extensionPointId, contributorIds, value) => {
          const registry = new ExtensionRegistryImpl()

          registry.registerExtensionPoint({
            id: extensionPointId,
            name: 'Single Contribution Extension Point',
            multiple: false
          })

          // 第一个贡献应该成功
          registry.contribute(extensionPointId, {
            contributorId: contributorIds[0],
            value
          })

          // 第二个贡献应该失败
          expect(() => {
            registry.contribute(extensionPointId, {
              contributorId: contributorIds[1],
              value
            })
          }).toThrow()
        }
      ),
      { numRuns: 100 }
    )
  })
})
