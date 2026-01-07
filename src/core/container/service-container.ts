import { ServiceContainer, ServiceDescriptor, ServiceScope } from './types'

/**
 * 服务未找到的哨兵值
 */
const NOT_FOUND = Symbol('NOT_FOUND')

/**
 * 循环依赖错误
 */
export class CircularDependencyError extends Error {
  constructor(cycle: string[]) {
    super(`检测到循环依赖: ${cycle.join(' -> ')}`)
    this.name = 'CircularDependencyError'
  }
}

/**
 * 服务未找到错误
 */
export class ServiceNotFoundError extends Error {
  constructor(id: string | symbol) {
    const idStr = typeof id === 'symbol' ? id.toString() : id
    super(`服务未找到: ${idStr}`)
    this.name = 'ServiceNotFoundError'
  }
}

/**
 * 服务容器实现
 */
export class ServiceContainerImpl implements ServiceContainer {
  private descriptors = new Map<string | symbol, ServiceDescriptor>()
  private singletonInstances = new Map<string | symbol, any>()
  private scopedInstances = new Map<string | symbol, any>()
  private resolvingStack: Array<string | symbol> = []
  private parent?: ServiceContainer

  constructor(parent?: ServiceContainer) {
    this.parent = parent
  }

  /**
   * 注册服务
   */
  register<T>(descriptor: ServiceDescriptor<T>): void {
    this.descriptors.set(descriptor.interface, descriptor)
  }

  /**
   * 注册单例服务
   */
  registerSingleton<T>(id: string | symbol, implementation: new (...args: any[]) => T): void {
    this.register({
      id: typeof id === 'symbol' ? id.toString() : id,
      interface: id,
      scope: ServiceScope.Singleton,
      implementation
    })
  }

  /**
   * 注册瞬态服务
   */
  registerTransient<T>(id: string | symbol, implementation: new (...args: any[]) => T): void {
    this.register({
      id: typeof id === 'symbol' ? id.toString() : id,
      interface: id,
      scope: ServiceScope.Transient,
      implementation
    })
  }

  /**
   * 注册工厂服务
   */
  registerFactory<T>(
    id: string | symbol,
    factory: (container: ServiceContainer) => T,
    scope: ServiceScope = ServiceScope.Singleton
  ): void {
    this.register({
      id: typeof id === 'symbol' ? id.toString() : id,
      interface: id,
      scope,
      factory
    })
  }

  /**
   * 注册实例
   */
  registerInstance<T>(id: string | symbol, instance: T): void {
    this.register({
      id: typeof id === 'symbol' ? id.toString() : id,
      interface: id,
      scope: ServiceScope.Singleton,
      instance
    })
    this.singletonInstances.set(id, instance)
  }

  /**
   * 解析服务（如果不存在则抛出错误）
   */
  resolve<T>(id: string | symbol): T {
    const service = this.internalResolve<T>(id)
    if (service === NOT_FOUND) {
      throw new ServiceNotFoundError(id)
    }
    return service as T
  }

  /**
   * 尝试解析服务（如果不存在则返回 null）
   */
  tryResolve<T>(id: string | symbol): T | null {
    const service = this.internalResolve<T>(id)
    return service === NOT_FOUND ? null : (service as T)
  }

  /**
   * 内部解析方法（使用哨兵值表示未找到）
   */
  private internalResolve<T>(id: string | symbol): T | typeof NOT_FOUND {
    // 检查循环依赖
    if (this.resolvingStack.includes(id)) {
      const cycle = [...this.resolvingStack, id]
      throw new CircularDependencyError(
        cycle.map(i => typeof i === 'symbol' ? i.toString() : i)
      )
    }

    // 先检查当前容器的 scoped 实例
    if (this.scopedInstances.has(id)) {
      return this.scopedInstances.get(id) as T
    }

    const descriptor = this.descriptors.get(id)
    
    // 如果当前容器没有描述符，尝试从父容器获取描述符
    if (!descriptor && this.parent) {
      const parentDescriptor = this.parent.getMetadata(id)
      
      // 如果父容器有 Scoped 服务，在当前作用域创建新实例
      if (parentDescriptor && parentDescriptor.scope === ServiceScope.Scoped) {
        return this.resolveScoped<T>(id, parentDescriptor)
      }
      
      // 其他情况从父容器解析
      return this.parent.internalResolve<T>(id)
    }

    if (!descriptor) {
      return NOT_FOUND
    }

    // 如果已经有实例，直接返回
    if (descriptor.instance !== undefined) {
      return descriptor.instance as T
    }

    // 根据作用域处理
    switch (descriptor.scope) {
      case ServiceScope.Singleton:
        return this.resolveSingleton<T>(id, descriptor)
      
      case ServiceScope.Scoped:
        return this.resolveScoped<T>(id, descriptor)
      
      case ServiceScope.Transient:
        return this.createInstance<T>(id, descriptor)
      
      default:
        return NOT_FOUND
    }
  }

  /**
   * 解析所有匹配的服务
   */
  resolveAll<T>(id: string | symbol): T[] {
    const services: T[] = []
    
    // 从父容器收集
    if (this.parent) {
      services.push(...this.parent.resolveAll<T>(id))
    }
    
    // 从当前容器收集
    const service = this.tryResolve<T>(id)
    if (service !== null) {
      services.push(service)
    }
    
    return services
  }

  /**
   * 检查服务是否存在
   */
  has(id: string | symbol): boolean {
    return this.descriptors.has(id) || (this.parent?.has(id) ?? false)
  }

  /**
   * 检查服务是否已注册
   */
  isRegistered(id: string | symbol): boolean {
    return this.descriptors.has(id)
  }

  /**
   * 创建作用域容器
   */
  createScope(): ServiceContainer {
    return new ServiceContainerImpl(this)
  }

  /**
   * 替换服务（用于测试）
   */
  replace<T>(id: string | symbol, implementation: T): void {
    const descriptor = this.descriptors.get(id)
    if (descriptor) {
      descriptor.instance = implementation
      this.singletonInstances.set(id, implementation)
      this.scopedInstances.set(id, implementation)
    } else {
      this.registerInstance(id, implementation)
    }
  }

  /**
   * 获取服务元数据
   */
  getMetadata(id: string | symbol): ServiceDescriptor | undefined {
    return this.descriptors.get(id)
  }

  /**
   * 清理容器
   */
  dispose(): void {
    this.descriptors.clear()
    this.singletonInstances.clear()
    this.scopedInstances.clear()
    this.resolvingStack = []
  }

  /**
   * 解析单例服务
   */
  private resolveSingleton<T>(id: string | symbol, descriptor: ServiceDescriptor<T>): T {
    // 检查是否已经创建
    if (this.singletonInstances.has(id)) {
      return this.singletonInstances.get(id) as T
    }

    // 创建实例
    const instance = this.createInstance<T>(id, descriptor)
    this.singletonInstances.set(id, instance)
    return instance
  }

  /**
   * 解析作用域服务
   */
  private resolveScoped<T>(id: string | symbol, descriptor: ServiceDescriptor<T>): T {
    // 检查是否已经在当前作用域创建
    if (this.scopedInstances.has(id)) {
      return this.scopedInstances.get(id) as T
    }

    // 创建实例
    const instance = this.createInstance<T>(id, descriptor)
    this.scopedInstances.set(id, instance)
    return instance
  }

  /**
   * 创建服务实例
   */
  private createInstance<T>(id: string | symbol, descriptor: ServiceDescriptor<T>): T {
    this.resolvingStack.push(id)

    try {
      // 如果有工厂函数，使用工厂函数
      if (descriptor.factory) {
        return descriptor.factory(this)
      }

      // 如果有实现类，创建实例
      if (descriptor.implementation) {
        // 解析依赖
        const dependencies = descriptor.dependencies || []
        const resolvedDeps = dependencies.map(dep => this.resolve(dep))
        return new descriptor.implementation(...resolvedDeps)
      }

      throw new Error(`无法创建服务实例: ${typeof id === 'symbol' ? id.toString() : id}`)
    } finally {
      this.resolvingStack.pop()
    }
  }
}
