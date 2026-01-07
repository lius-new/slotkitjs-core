import { describe, it, expect, beforeEach } from 'vitest'
import { ServiceContainerImpl, CircularDependencyError, ServiceNotFoundError } from '../service-container'
import { ServiceScope } from '../types'

describe('ServiceContainer Unit Tests', () => {
  let container: ServiceContainerImpl

  beforeEach(() => {
    container = new ServiceContainerImpl()
  })

  describe('服务注册', () => {
    it('应该注册和解析单例服务', () => {
      class TestService {
        value = 'test'
      }

      container.registerSingleton('TestService', TestService)
      
      const instance = container.resolve<TestService>('TestService')
      expect(instance).toBeInstanceOf(TestService)
      expect(instance.value).toBe('test')
    })

    it('应该注册和解析瞬态服务', () => {
      class TestService {
        id = Math.random()
      }

      container.registerTransient('TestService', TestService)
      
      const instance1 = container.resolve<TestService>('TestService')
      const instance2 = container.resolve<TestService>('TestService')
      
      expect(instance1).toBeInstanceOf(TestService)
      expect(instance2).toBeInstanceOf(TestService)
      expect(instance1).not.toBe(instance2)
    })

    it('应该注册和解析工厂服务', () => {
      const mockService = { value: 'factory' }
      
      container.registerFactory('TestService', () => mockService)
      
      const instance = container.resolve('TestService')
      expect(instance).toBe(mockService)
    })

    it('应该注册和解析实例', () => {
      const mockService = { value: 'instance' }
      
      container.registerInstance('TestService', mockService)
      
      const instance = container.resolve('TestService')
      expect(instance).toBe(mockService)
    })
  })

  describe('Singleton 作用域', () => {
    it('应该返回相同的实例', () => {
      class TestService {
        id = Math.random()
      }

      container.registerSingleton('TestService', TestService)
      
      const instance1 = container.resolve<TestService>('TestService')
      const instance2 = container.resolve<TestService>('TestService')
      
      expect(instance1).toBe(instance2)
      expect(instance1.id).toBe(instance2.id)
    })

    it('应该在父容器和子容器之间共享实例', () => {
      class TestService {
        id = Math.random()
      }

      container.registerSingleton('TestService', TestService)
      
      const parentInstance = container.resolve<TestService>('TestService')
      
      const childContainer = container.createScope()
      const childInstance = childContainer.resolve<TestService>('TestService')
      
      expect(parentInstance).toBe(childInstance)
    })
  })

  describe('Transient 作用域', () => {
    it('应该每次返回新实例', () => {
      class TestService {
        id = Math.random()
      }

      container.registerTransient('TestService', TestService)
      
      const instance1 = container.resolve<TestService>('TestService')
      const instance2 = container.resolve<TestService>('TestService')
      
      expect(instance1).not.toBe(instance2)
      expect(instance1.id).not.toBe(instance2.id)
    })
  })

  describe('Scoped 作用域', () => {
    it('应该在同一作用域内返回相同实例', () => {
      class TestService {
        id = Math.random()
      }

      container.register({
        id: 'TestService',
        interface: 'TestService',
        scope: ServiceScope.Scoped,
        implementation: TestService
      })
      
      const scopedContainer = container.createScope()
      
      const instance1 = scopedContainer.resolve<TestService>('TestService')
      const instance2 = scopedContainer.resolve<TestService>('TestService')
      
      expect(instance1).toBe(instance2)
    })

    it('应该在不同作用域返回不同实例', () => {
      class TestService {
        id = Math.random()
      }

      container.register({
        id: 'TestService',
        interface: 'TestService',
        scope: ServiceScope.Scoped,
        implementation: TestService
      })
      
      const scope1 = container.createScope()
      const scope2 = container.createScope()
      
      const instance1 = scope1.resolve<TestService>('TestService')
      const instance2 = scope2.resolve<TestService>('TestService')
      
      expect(instance1).not.toBe(instance2)
      expect(instance1.id).not.toBe(instance2.id)
    })
  })

  describe('循环依赖检测', () => {
    it('应该检测直接循环依赖', () => {
      class ServiceA {
        constructor(public b: any) {}
      }

      container.register({
        id: 'ServiceA',
        interface: 'ServiceA',
        scope: ServiceScope.Singleton,
        implementation: ServiceA,
        dependencies: ['ServiceA']
      })

      expect(() => container.resolve('ServiceA')).toThrow(CircularDependencyError)
    })

    it('应该检测间接循环依赖', () => {
      class ServiceA {
        constructor(public b: any) {}
      }

      class ServiceB {
        constructor(public a: any) {}
      }

      container.register({
        id: 'ServiceA',
        interface: 'ServiceA',
        scope: ServiceScope.Singleton,
        implementation: ServiceA,
        dependencies: ['ServiceB']
      })

      container.register({
        id: 'ServiceB',
        interface: 'ServiceB',
        scope: ServiceScope.Singleton,
        implementation: ServiceB,
        dependencies: ['ServiceA']
      })

      expect(() => container.resolve('ServiceA')).toThrow(CircularDependencyError)
    })

    it('应该在循环依赖错误中包含完整的依赖链', () => {
      class ServiceA {
        constructor(public b: any) {}
      }

      class ServiceB {
        constructor(public c: any) {}
      }

      class ServiceC {
        constructor(public a: any) {}
      }

      container.register({
        id: 'ServiceA',
        interface: 'ServiceA',
        scope: ServiceScope.Singleton,
        implementation: ServiceA,
        dependencies: ['ServiceB']
      })

      container.register({
        id: 'ServiceB',
        interface: 'ServiceB',
        scope: ServiceScope.Singleton,
        implementation: ServiceB,
        dependencies: ['ServiceC']
      })

      container.register({
        id: 'ServiceC',
        interface: 'ServiceC',
        scope: ServiceScope.Singleton,
        implementation: ServiceC,
        dependencies: ['ServiceA']
      })

      try {
        container.resolve('ServiceA')
        expect.fail('应该抛出 CircularDependencyError')
      } catch (error) {
        expect(error).toBeInstanceOf(CircularDependencyError)
        expect((error as Error).message).toContain('ServiceA')
        expect((error as Error).message).toContain('ServiceB')
        expect((error as Error).message).toContain('ServiceC')
      }
    })
  })

  describe('依赖注入', () => {
    it('应该注入依赖到构造函数', () => {
      class ServiceA {
        value = 'A'
      }

      class ServiceB {
        constructor(public serviceA: ServiceA) {}
      }

      container.registerInstance('ServiceA', new ServiceA())
      container.register({
        id: 'ServiceB',
        interface: 'ServiceB',
        scope: ServiceScope.Singleton,
        implementation: ServiceB,
        dependencies: ['ServiceA']
      })

      const serviceB = container.resolve<ServiceB>('ServiceB')
      expect(serviceB.serviceA).toBeInstanceOf(ServiceA)
      expect(serviceB.serviceA.value).toBe('A')
    })

    it('应该注入多个依赖', () => {
      class ServiceA {
        value = 'A'
      }

      class ServiceB {
        value = 'B'
      }

      class ServiceC {
        constructor(
          public serviceA: ServiceA,
          public serviceB: ServiceB
        ) {}
      }

      container.registerInstance('ServiceA', new ServiceA())
      container.registerInstance('ServiceB', new ServiceB())
      container.register({
        id: 'ServiceC',
        interface: 'ServiceC',
        scope: ServiceScope.Singleton,
        implementation: ServiceC,
        dependencies: ['ServiceA', 'ServiceB']
      })

      const serviceC = container.resolve<ServiceC>('ServiceC')
      expect(serviceC.serviceA.value).toBe('A')
      expect(serviceC.serviceB.value).toBe('B')
    })
  })

  describe('服务查询', () => {
    it('has 应该对已注册的服务返回 true', () => {
      container.registerInstance('TestService', {})
      expect(container.has('TestService')).toBe(true)
    })

    it('has 应该对未注册的服务返回 false', () => {
      expect(container.has('NonExistent')).toBe(false)
    })

    it('isRegistered 应该对已注册的服务返回 true', () => {
      container.registerInstance('TestService', {})
      expect(container.isRegistered('TestService')).toBe(true)
    })

    it('tryResolve 应该对不存在的服务返回 null', () => {
      const result = container.tryResolve('NonExistent')
      expect(result).toBeNull()
    })

    it('resolve 应该对不存在的服务抛出错误', () => {
      expect(() => container.resolve('NonExistent')).toThrow(ServiceNotFoundError)
    })
  })

  describe('resolveAll', () => {
    it('应该返回所有匹配的服务', () => {
      const service1 = { id: 1 }
      const service2 = { id: 2 }

      container.registerInstance('TestService', service1)
      
      const childContainer = container.createScope()
      childContainer.registerInstance('TestService', service2)

      const services = childContainer.resolveAll('TestService')
      expect(services).toHaveLength(2)
      expect(services).toContain(service1)
      expect(services).toContain(service2)
    })

    it('应该对不存在的服务返回空数组', () => {
      const services = container.resolveAll('NonExistent')
      expect(services).toEqual([])
    })
  })

  describe('服务替换', () => {
    it('应该替换已注册的服务', () => {
      const original = { value: 'original' }
      const replacement = { value: 'replacement' }

      container.registerInstance('TestService', original)
      expect(container.resolve('TestService')).toBe(original)

      container.replace('TestService', replacement)
      expect(container.resolve('TestService')).toBe(replacement)
    })

    it('应该注册新服务如果不存在', () => {
      const service = { value: 'new' }
      
      container.replace('TestService', service)
      expect(container.resolve('TestService')).toBe(service)
    })
  })

  describe('元数据', () => {
    it('应该返回服务元数据', () => {
      const metadata = {
        version: '1.0.0',
        providedBy: 'test-plugin',
        tags: ['test']
      }

      container.register({
        id: 'TestService',
        interface: 'TestService',
        scope: ServiceScope.Singleton,
        implementation: class {},
        metadata
      })

      const descriptor = container.getMetadata('TestService')
      expect(descriptor).toBeDefined()
      expect(descriptor?.metadata).toEqual(metadata)
    })

    it('应该对不存在的服务返回 undefined', () => {
      const descriptor = container.getMetadata('NonExistent')
      expect(descriptor).toBeUndefined()
    })
  })

  describe('清理', () => {
    it('应该清理所有服务', () => {
      container.registerInstance('Service1', {})
      container.registerInstance('Service2', {})

      expect(container.has('Service1')).toBe(true)
      expect(container.has('Service2')).toBe(true)

      container.dispose()

      expect(container.has('Service1')).toBe(false)
      expect(container.has('Service2')).toBe(false)
    })
  })

  describe('Symbol 作为服务标识符', () => {
    it('应该支持 Symbol 作为服务 ID', () => {
      const serviceId = Symbol('TestService')
      const service = { value: 'test' }

      container.registerInstance(serviceId, service)
      
      const resolved = container.resolve(serviceId)
      expect(resolved).toBe(service)
    })

    it('应该支持 Symbol 在依赖注入中', () => {
      const serviceAId = Symbol('ServiceA')
      const serviceBId = Symbol('ServiceB')

      class ServiceA {
        value = 'A'
      }

      class ServiceB {
        constructor(public serviceA: ServiceA) {}
      }

      container.registerInstance(serviceAId, new ServiceA())
      container.register({
        id: 'ServiceB',
        interface: serviceBId,
        scope: ServiceScope.Singleton,
        implementation: ServiceB,
        dependencies: [serviceAId]
      })

      const serviceB = container.resolve<ServiceB>(serviceBId)
      expect(serviceB.serviceA.value).toBe('A')
    })
  })
})
