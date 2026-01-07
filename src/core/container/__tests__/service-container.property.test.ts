import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { ServiceContainerImpl } from '../service-container'
import { ServiceScope } from '../types'

describe('ServiceContainer Property Tests', () => {
  let container: ServiceContainerImpl

  beforeEach(() => {
    container = new ServiceContainerImpl()
  })

  /**
   * Feature: plugin-decoupling, Property 1: 服务注册和发现
   * 对于任何服务定义，当插件注册该服务时，则任何其他插件都应该能够通过服务注册表使用接口名称发现和检索该服务。
   * Validates: Requirements 1.2
   */
  it('属性 1: 任何注册的服务都应该可被发现', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          interface: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          value: fc.anything()
        }),
        (serviceData) => {
          const container = new ServiceContainerImpl()
          
          // 注册服务
          container.registerInstance(serviceData.interface, serviceData.value)
          
          // 应该能够解析服务
          const retrieved = container.tryResolve(serviceData.interface)
          expect(retrieved).toBe(serviceData.value)
          
          // has 应该返回 true
          expect(container.has(serviceData.interface)).toBe(true)
          expect(container.isRegistered(serviceData.interface)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: plugin-decoupling, Property 2: 服务缺失处理
   * 对于任何请求服务的插件，当该服务不可用时，则服务注册表应该返回 null 而不抛出错误，允许插件优雅地处理缺失。
   * Validates: Requirements 1.3
   */
  it('属性 2: 请求不存在的服务应该返回 null', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (interfaceName) => {
          const container = new ServiceContainerImpl()
          
          // 尝试解析不存在的服务
          const retrieved = container.tryResolve(interfaceName)
          
          // 应该返回 null 而不是抛出错误
          expect(retrieved).toBeNull()
          
          // has 应该返回 false
          expect(container.has(interfaceName)).toBe(false)
          expect(container.isRegistered(interfaceName)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: plugin-decoupling, Property 3: 服务依赖注入
   * 对于任何声明服务依赖的插件清单，当插件被加载时，则插件系统应该验证这些依赖存在并将它们注入到插件上下文中。
   * Validates: Requirements 1.4
   */
  it('属性 3: 服务依赖应该被正确注入', () => {
    fc.assert(
      fc.property(
        fc.record({
          serviceAValue: fc.integer(),
          serviceBValue: fc.string()
        }),
        (data) => {
          const container = new ServiceContainerImpl()
          
          // 注册依赖服务
          container.registerInstance('ServiceA', data.serviceAValue)
          container.registerInstance('ServiceB', data.serviceBValue)
          
          // 创建一个依赖这两个服务的类
          class DependentService {
            constructor(
              public serviceA: number,
              public serviceB: string
            ) {}
          }
          
          // 注册依赖服务
          container.register({
            id: 'DependentService',
            interface: 'DependentService',
            scope: ServiceScope.Singleton,
            implementation: DependentService,
            dependencies: ['ServiceA', 'ServiceB']
          })
          
          // 解析依赖服务
          const dependent = container.resolve<DependentService>('DependentService')
          
          // 验证依赖被正确注入
          expect(dependent.serviceA).toBe(data.serviceAValue)
          expect(dependent.serviceB).toBe(data.serviceBValue)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 额外属性测试: Singleton 作用域应该返回相同实例
   */
  it('属性: Singleton 服务应该始终返回相同实例', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (interfaceName) => {
          const container = new ServiceContainerImpl()
          
          class TestService {
            id = Math.random()
          }
          
          container.registerSingleton(interfaceName, TestService)
          
          const instance1 = container.resolve(interfaceName)
          const instance2 = container.resolve(interfaceName)
          
          // 应该是同一个实例
          expect(instance1).toBe(instance2)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 额外属性测试: Transient 作用域应该返回不同实例
   */
  it('属性: Transient 服务应该每次返回新实例', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (interfaceName) => {
          const container = new ServiceContainerImpl()
          
          class TestService {
            id = Math.random()
          }
          
          container.registerTransient(interfaceName, TestService)
          
          const instance1 = container.resolve(interfaceName)
          const instance2 = container.resolve(interfaceName)
          
          // 应该是不同的实例
          expect(instance1).not.toBe(instance2)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 额外属性测试: 工厂函数应该被正确调用
   */
  it('属性: 工厂函数应该接收容器并返回服务', () => {
    fc.assert(
      fc.property(
        fc.record({
          interfaceName: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          value: fc.anything()
        }),
        (data) => {
          const container = new ServiceContainerImpl()
          
          let factoryCalled = false
          let receivedContainer: any = null
          
          container.registerFactory(
            data.interfaceName,
            (c) => {
              factoryCalled = true
              receivedContainer = c
              return data.value
            }
          )
          
          const result = container.resolve(data.interfaceName)
          
          // 工厂应该被调用
          expect(factoryCalled).toBe(true)
          // 应该接收到容器
          expect(receivedContainer).toBe(container)
          // 应该返回正确的值
          expect(result).toBe(data.value)
        }
      ),
      { numRuns: 100 }
    )
  })
})
