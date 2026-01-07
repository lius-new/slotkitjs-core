# SlotKit Core API 文档

本文档提供 SlotKit 核心系统的完整 API 参考。

## 目录

- [服务容器 (Service Container)](#服务容器-service-container)
- [事件总线 (Event Bus)](#事件总线-event-bus)
- [扩展点注册表 (Extension Registry)](#扩展点注册表-extension-registry)
- [钩子系统 (Hook System)](#钩子系统-hook-system)
- [管道系统 (Pipeline System)](#管道系统-pipeline-system)
- [依赖管理器 (Dependency Manager)](#依赖管理器-dependency-manager)
- [配置管理器 (Configuration Manager)](#配置管理器-configuration-manager)
- [资源注册表 (Resource Registry)](#资源注册表-resource-registry)
- [插件上下文 (Plugin Context)](#插件上下文-plugin-context)

---

## 服务容器 (Service Container)

服务容器提供依赖注入功能，管理服务的注册、解析和生命周期。

### 类型定义

#### ServiceScope

```typescript
enum ServiceScope {
  Singleton = 'singleton',    // 全局单例
  Transient = 'transient',    // 每次请求创建新实例
  Scoped = 'scoped'           // 作用域内单例
}
```

#### ServiceDescriptor

```typescript
interface ServiceDescriptor<T = any> {
  id: string
  interface: string | symbol
  scope: ServiceScope
  factory?: (container: ServiceContainer) => T
  implementation?: new (...args: any[]) => T
  instance?: T
  dependencies?: Array<string | symbol>
  metadata?: {
    version?: string
    providedBy?: string
    tags?: string[]
    [key: string]: any
  }
}
```

### 接口

#### ServiceContainer

```typescript
interface ServiceContainer {
  // 注册服务
  register<T>(descriptor: ServiceDescriptor<T>): void
  registerSingleton<T>(id: string | symbol, implementation: new (...args: any[]) => T): void
  registerTransient<T>(id: string | symbol, implementation: new (...args: any[]) => T): void
  registerFactory<T>(id: string | symbol, factory: (container: ServiceContainer) => T, scope?: ServiceScope): void
  registerInstance<T>(id: string | symbol, instance: T): void
  
  // 解析服务
  resolve<T>(id: string | symbol): T
  tryResolve<T>(id: string | symbol): T | null
  resolveAll<T>(id: string | symbol): T[]
  
  // 检查服务
  has(id: string | symbol): boolean
  isRegistered(id: string | symbol): boolean
  
  // 创建子容器
  createScope(): ServiceContainer
  
  // 服务替换（用于测试）
  replace<T>(id: string | symbol, implementation: T): void
  
  // 获取服务元数据
  getMetadata(id: string | symbol): ServiceDescriptor | undefined
  
  // 清理
  dispose(): void
}
```

### 使用示例

#### 注册服务

```typescript
import { ServiceContainer, ServiceScope } from '@slotkitjs/core'

// 注册单例服务
container.registerSingleton('IAuthService', AuthService)

// 注册瞬态服务
container.registerTransient('IHttpClient', HttpClient)

// 使用工厂函数注册
container.registerFactory('ICache', (c) => {
  const config = c.resolve('IConfig')
  return new RedisCache(config)
}, ServiceScope.Singleton)

// 注册实例
const logger = new Logger()
container.registerInstance('ILogger', logger)
```

#### 解析服务

```typescript
// 解析服务（如果不存在会抛出错误）
const authService = container.resolve<IAuthService>('IAuthService')

// 尝试解析服务（如果不存在返回 null）
const cacheService = container.tryResolve<ICacheService>('ICacheService')
if (cacheService) {
  // 使用缓存服务
}

// 解析所有实现
const validators = container.resolveAll<IValidator>('IValidator')
```

#### 创建作用域

```typescript
// 创建作用域容器（用于请求作用域等）
const scopedContainer = container.createScope()

// 在作用域内解析服务
const scopedService = scopedContainer.resolve('IScopedService')

// 清理作用域
scopedContainer.dispose()
```

---

## 事件总线 (Event Bus)

事件总线提供类型安全的、解耦的插件间通信机制。

### 类型定义

#### EventDefinition

```typescript
interface EventDefinition<T = any> {
  type: string
  payload: T
  source: string
  timestamp: number
  priority?: number
  metadata?: Record<string, any>
}
```

#### SubscriptionOptions

```typescript
interface SubscriptionOptions {
  priority?: number
  once?: boolean
  filter?: (event: EventDefinition) => boolean
  async?: boolean
  debounce?: number
  throttle?: number
}
```

#### EventSubscription

```typescript
interface EventSubscription {
  id: string
  eventType: string
  callback: (event: EventDefinition) => void | Promise<void>
  options: SubscriptionOptions
  pluginId: string
}
```

### 接口

#### EventBus

```typescript
interface EventBus {
  // 发出事件
  emit<T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): void
  emitAsync<T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): Promise<void>
  
  // 订阅事件
  on<T>(eventType: string, callback: (event: EventDefinition<T>) => void | Promise<void>, options?: SubscriptionOptions): () => void
  once<T>(eventType: string, callback: (event: EventDefinition<T>) => void | Promise<void>): () => void
  
  // 取消订阅
  off(subscriptionId: string): void
  offAll(pluginId: string): void
  
  // 等待事件
  waitFor<T>(eventType: string, timeout?: number): Promise<EventDefinition<T>>
  
  // 获取订阅
  getSubscriptions(eventType?: string): EventSubscription[]
  
  // 清除所有订阅
  clear(): void
}
```

### 使用示例

#### 发出事件

```typescript
import { EventBus } from '@slotkitjs/core'

// 同步发出事件
eventBus.emit('user:login', { userId: '123', timestamp: Date.now() })

// 异步发出事件
await eventBus.emitAsync('data:sync', { records: [...] })

// 带优先级和元数据
eventBus.emit('system:error', { error: 'Something went wrong' }, {
  priority: 10,
  metadata: { severity: 'high' }
})
```

#### 订阅事件

```typescript
// 基本订阅
const unsubscribe = eventBus.on('user:login', (event) => {
  console.log('用户登录:', event.payload.userId)
})

// 带选项的订阅
eventBus.on('data:update', async (event) => {
  await processUpdate(event.payload)
}, {
  priority: 5,
  async: true,
  debounce: 300
})

// 一次性订阅
eventBus.once('system:ready', (event) => {
  console.log('系统已就绪')
})

// 带过滤器的订阅
eventBus.on('message:received', (event) => {
  console.log('重要消息:', event.payload)
}, {
  filter: (event) => event.payload.priority === 'high'
})
```

#### 等待事件

```typescript
// 等待特定事件
try {
  const event = await eventBus.waitFor('user:authenticated', 5000)
  console.log('用户已认证:', event.payload)
} catch (error) {
  console.error('等待超时')
}
```

#### 取消订阅

```typescript
// 使用返回的函数取消订阅
const unsubscribe = eventBus.on('data:change', handler)
unsubscribe()

// 取消插件的所有订阅
eventBus.offAll('my-plugin-id')
```

---

## 扩展点注册表 (Extension Registry)

扩展点注册表管理系统的扩展点和插件的贡献。

### 类型定义

#### ExtensionPoint

```typescript
interface ExtensionPoint<T = any> {
  id: string
  name: string
  description?: string
  schema?: any
  multiple?: boolean
}
```

#### Contribution

```typescript
interface Contribution<T = any> {
  extensionPointId: string
  contributorId: string
  value: T
  priority?: number
  enabled?: boolean
}
```

### 接口

#### ExtensionRegistry

```typescript
interface ExtensionRegistry {
  // 注册扩展点
  registerExtensionPoint<T>(point: ExtensionPoint<T>): void
  
  // 贡献到扩展点
  contribute<T>(extensionPointId: string, contribution: Omit<Contribution<T>, 'extensionPointId'>): void
  
  // 获取贡献
  getContributions<T>(extensionPointId: string): Contribution<T>[]
  getContribution<T>(extensionPointId: string, contributorId: string): Contribution<T> | null
  
  // 检查扩展点
  hasExtensionPoint(id: string): boolean
  getExtensionPoints(): ExtensionPoint[]
  
  // 移除贡献
  removeContribution(extensionPointId: string, contributorId: string): void
  removeAllContributions(contributorId: string): void
}
```

### 使用示例

#### 定义扩展点

```typescript
import { ExtensionRegistry } from '@slotkitjs/core'

// 应用定义扩展点
extensionRegistry.registerExtensionPoint({
  id: 'commands',
  name: 'Commands',
  description: '应用命令扩展点',
  multiple: true,
  schema: {
    type: 'object',
    required: ['id', 'handler'],
    properties: {
      id: { type: 'string' },
      handler: { type: 'function' }
    }
  }
})
```

#### 贡献到扩展点

```typescript
// 插件贡献到扩展点
extensionRegistry.contribute('commands', {
  contributorId: 'my-plugin',
  value: {
    id: 'my-plugin.hello',
    handler: () => console.log('Hello!')
  },
  priority: 10
})
```

#### 获取贡献

```typescript
// 应用获取并使用贡献
const commands = extensionRegistry.getContributions('commands')
commands.forEach(cmd => {
  if (cmd.enabled !== false) {
    registerCommand(cmd.value.id, cmd.value.handler)
  }
})
```

---

## 钩子系统 (Hook System)

钩子系统提供通用的钩子机制，允许在特定点注入逻辑。

### 类型定义

#### HookType

```typescript
enum HookType {
  Action = 'action',
  Filter = 'filter'
}
```

#### ActionHook & FilterHook

```typescript
type ActionHook = (...args: any[]) => void | Promise<void>
type FilterHook<T = any> = (value: T, ...args: any[]) => T | Promise<T>
```

#### HookDescriptor

```typescript
interface HookDescriptor {
  id: string
  name: string
  type: HookType
  callback: ActionHook | FilterHook
  priority?: number
  providedBy?: string
}
```

### 接口

#### HookSystem

```typescript
interface HookSystem {
  // 注册钩子
  addAction(name: string, callback: ActionHook, priority?: number): () => void
  addFilter<T>(name: string, callback: FilterHook<T>, priority?: number): () => void
  
  // 执行钩子
  doAction(name: string, ...args: any[]): Promise<void>
  applyFilters<T>(name: string, value: T, ...args: any[]): Promise<T>
  
  // 移除钩子
  removeHook(name: string, hookId: string): void
  removeAllHooks(name: string): void
  
  // 检查钩子
  hasHook(name: string): boolean
  getHooks(name: string): HookDescriptor[]
}
```

### 使用示例

#### 注册 Action 钩子

```typescript
import { HookSystem } from '@slotkitjs/core'

// 添加 action 钩子
const removeHook = hookSystem.addAction('user:login', async (userId) => {
  console.log('用户登录:', userId)
  await logUserActivity(userId)
}, 10)

// 执行 action 钩子
await hookSystem.doAction('user:login', '123')
```

#### 注册 Filter 钩子

```typescript
// 添加 filter 钩子
hookSystem.addFilter('content:render', (content) => {
  return content.replace(/\[user\]/g, currentUser.name)
}, 5)

// 应用 filter 钩子
const rendered = await hookSystem.applyFilters('content:render', originalContent)
```

---

## 管道系统 (Pipeline System)

管道系统提供通用的管道机制，用于链式处理。

### 类型定义

#### PipelineContext

```typescript
interface PipelineContext<TInput = any, TOutput = any> {
  input: TInput
  output?: TOutput
  state: Map<string, any>
  metadata: Record<string, any>
  abort: () => void
}
```

#### PipelineHandler

```typescript
type PipelineHandler<TInput = any, TOutput = any> = (
  context: PipelineContext<TInput, TOutput>,
  next: () => Promise<void>
) => Promise<void> | void
```

### 接口

#### Pipeline

```typescript
interface Pipeline<TInput = any, TOutput = any> {
  // 注册处理器
  use(handler: PipelineHandler<TInput, TOutput>, options?: { priority?: number; id?: string }): void
  
  // 执行管道
  execute(input: TInput, metadata?: Record<string, any>): Promise<TOutput>
  
  // 管理处理器
  remove(id: string): void
  enable(id: string): void
  disable(id: string): void
  clear(): void
  
  // 获取处理器列表
  getHandlers(): HandlerDescriptor[]
}
```

### 使用示例

#### 创建和使用管道

```typescript
import { PipelineFactory } from '@slotkitjs/core'

// 创建管道
const pipeline = pipelineFactory.create<Request, Response>('http-pipeline')

// 添加处理器
pipeline.use(async (context, next) => {
  console.log('请求:', context.input)
  await next()
  console.log('响应:', context.output)
})

pipeline.use(async (context, next) => {
  // 添加认证头
  context.input.headers['Authorization'] = `Bearer ${token}`
  await next()
}, { priority: 10 })

// 执行管道
const response = await pipeline.execute(request)
```

---

## 依赖管理器 (Dependency Manager)

依赖管理器验证插件依赖并确定加载顺序。

### 类型定义

#### DependencyGraph

```typescript
interface DependencyGraph {
  nodes: Map<string, PluginManifest>
  edges: Map<string, Set<string>>
}
```

#### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean
  errors: Array<{
    type: 'circular-dependency' | 'missing-dependency' | 'version-mismatch'
    pluginId: string
    details: string
  }>
}
```

### 接口

#### DependencyManager

```typescript
interface DependencyManager {
  buildGraph(manifests: PluginManifest[]): DependencyGraph
  validate(graph: DependencyGraph): ValidationResult
  resolveLoadOrder(graph: DependencyGraph): string[]
  canLoad(pluginId: string, loadedPlugins: Set<string>): boolean
  getMissingDependencies(pluginId: string): string[]
}
```

### 使用示例

```typescript
import { DependencyManager } from '@slotkitjs/core'

// 构建依赖图
const graph = dependencyManager.buildGraph(pluginManifests)

// 验证依赖
const result = dependencyManager.validate(graph)
if (!result.valid) {
  result.errors.forEach(error => {
    console.error(`${error.type}: ${error.details}`)
  })
}

// 解析加载顺序
const loadOrder = dependencyManager.resolveLoadOrder(graph)
console.log('加载顺序:', loadOrder)
```

---

## 配置管理器 (Configuration Manager)

配置管理器提供分层配置系统。

### 类型定义

#### ConfigLevel

```typescript
enum ConfigLevel {
  Default = 'default',
  User = 'user',
  Workspace = 'workspace',
  Plugin = 'plugin'
}
```

#### ConfigSchema

```typescript
interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  default?: any
  required?: boolean
  enum?: any[]
  properties?: Record<string, ConfigSchema>
  items?: ConfigSchema
  validate?: (value: any) => boolean | string
}
```

### 接口

#### ConfigManager

```typescript
interface ConfigManager {
  registerSchema(key: string, schema: ConfigSchema): void
  get<T>(key: string, defaultValue?: T): T
  set(key: string, value: any, level?: ConfigLevel): Promise<void>
  onChange(key: string, callback: (event: ConfigChangeEvent) => void): () => void
  validate(key: string, value: any): boolean | string
}
```

### 使用示例

```typescript
import { ConfigManager, ConfigLevel } from '@slotkitjs/core'

// 注册配置模式
configManager.registerSchema('cache.ttl', {
  type: 'number',
  default: 60000,
  validate: (value) => value > 0 || '必须大于 0'
})

// 获取配置
const cacheTTL = configManager.get<number>('cache.ttl')

// 设置配置
await configManager.set('cache.ttl', 120000, ConfigLevel.User)

// 监听配置变更
configManager.onChange('cache.ttl', (event) => {
  console.log(`配置变更: ${event.oldValue} -> ${event.newValue}`)
})
```

---

## 资源注册表 (Resource Registry)

资源注册表提供通用的资源注册和访问机制。

### 类型定义

#### ResourceDescriptor

```typescript
interface ResourceDescriptor<T = any> {
  id: string
  type: string
  value: T
  metadata?: {
    version?: string
    deprecated?: boolean
    deprecationMessage?: string
    tags?: string[]
    [key: string]: any
  }
}
```

### 接口

#### ResourceRegistry

```typescript
interface ResourceRegistry {
  register<T>(descriptor: ResourceDescriptor<T>): void
  get<T>(id: string): T | null
  getByType<T>(type: string): T[]
  has(id: string): boolean
  unregister(id: string): void
}
```

### 使用示例

```typescript
import { ResourceRegistry } from '@slotkitjs/react'

// 注册资源
resourceRegistry.register({
  id: 'Button',
  type: 'component',
  value: ButtonComponent,
  metadata: {
    version: '1.0.0',
    tags: ['ui', 'button']
  }
})

// 获取资源
const Button = resourceRegistry.get('Button')

// 按类型获取
const components = resourceRegistry.getByType('component')
```

---

## 插件上下文 (Plugin Context)

插件上下文为插件提供对系统服务的访问。

### 接口

#### PluginContext

```typescript
interface PluginContext {
  pluginId: string
  manifest: PluginManifest
  
  services: {
    get<T>(interfaceName: string): T | null
    register<T>(definition: ServiceDefinition<T>): void
  }
  
  events: {
    emit<T>(eventType: string, payload: T): void
    on<T>(eventType: string, callback: (event: EventDefinition<T>) => void): () => void
  }
  
  logger: {
    debug(message: string, data?: any): void
    info(message: string, data?: any): void
    warn(message: string, data?: any): void
    error(message: string, error?: Error): void
  }
}
```

### 使用示例

```typescript
const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 访问服务
    const authService = context.services.get<IAuthService>('IAuthService')
    
    // 订阅事件
    context.events.on('user:login', (event) => {
      context.logger.info('用户登录', event.payload)
    })
    
    // 注册服务
    context.services.register({
      id: 'my-service',
      interface: 'IMyService',
      implementation: new MyService()
    })
  }
}
```
