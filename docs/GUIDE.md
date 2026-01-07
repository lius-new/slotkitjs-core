# SlotKit 插件开发指南

本指南将帮助您了解如何使用 SlotKit 构建解耦的、可扩展的插件系统。

## 目录

- [快速开始](#快速开始)
- [创建插件](#创建插件)
- [使用服务容器](#使用服务容器)
- [使用事件总线](#使用事件总线)
- [定义扩展点](#定义扩展点)
- [使用钩子系统](#使用钩子系统)
- [管理依赖](#管理依赖)
- [最佳实践](#最佳实践)

---

## 快速开始

### 安装

```bash
npm install @slotkitjs/core @slotkitjs/react @slotkitjs/types
```

### 基本设置

```typescript
import { PluginSystem } from '@slotkitjs/core'

// 创建插件系统实例
const pluginSystem = new PluginSystem({
  // 配置选项
})

// 加载插件
await pluginSystem.loadPlugins([
  './plugins/my-plugin'
])

// 启动系统
await pluginSystem.start()
```

---

## 创建插件

### 插件结构

一个标准的插件包含以下文件：

```
my-plugin/
├── manifest.json       # 插件清单
├── src/
│   └── index.ts       # 插件入口
├── package.json
└── tsconfig.json
```

### 插件清单 (manifest.json)

```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "description": "这是一个示例插件",
  "author": "Your Name",
  "license": "MIT",
  "entry": "./dist/index.js",
  "activationEvents": ["onStartup"],
  "dependencies": {
    "plugins": [],
    "services": []
  },
  "contributes": {},
  "metadata": {
    "category": "general",
    "tags": ["example"]
  }
}
```

### 插件入口 (src/index.ts)

```typescript
import type { Plugin, PluginContext } from '@slotkitjs/types'

const myPlugin: Plugin = {
  id: 'my-plugin',
  name: '我的插件',
  version: '1.0.0',
  
  // 插件挂载时调用
  onMount: async (context: PluginContext) => {
    context.logger.info('插件已挂载')
    
    // 初始化逻辑
  },
  
  // 插件卸载时调用
  onUnmount: async (context: PluginContext) => {
    context.logger.info('插件已卸载')
    
    // 清理逻辑
  }
}

export default myPlugin
```

---

## 使用服务容器

服务容器是 SlotKit 的核心功能之一，它提供依赖注入能力。

### 注册服务

#### 方式 1：在插件中注册服务

```typescript
import type { Plugin, PluginContext } from '@slotkitjs/types'
import type { IAuthService } from '@slotkitjs/types/contracts'

class AuthService implements IAuthService {
  private token: string | null = null
  
  async login(credentials: LoginCredentials): Promise<void> {
    // 登录逻辑
    this.token = 'generated-token'
  }
  
  isAuthenticated(): boolean {
    return this.token !== null
  }
  
  getToken(): string | null {
    return this.token
  }
}

const authPlugin: Plugin = {
  id: 'auth-plugin',
  name: '认证插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 注册服务
    context.services.register({
      id: 'auth-service',
      interface: 'IAuthService',
      implementation: new AuthService(),
      scope: 'singleton',
      providedBy: context.pluginId
    })
    
    context.logger.info('认证服务已注册')
  }
}

export default authPlugin
```

#### 方式 2：使用服务容器直接注册

```typescript
import { ServiceScope } from '@slotkitjs/core'

// 注册单例服务
container.registerSingleton('IAuthService', AuthService)

// 注册瞬态服务（每次解析创建新实例）
container.registerTransient('IHttpClient', HttpClient)

// 使用工厂函数注册
container.registerFactory('ICache', (c) => {
  const config = c.resolve('IConfig')
  return new RedisCache(config)
}, ServiceScope.Singleton)
```

### 使用服务

```typescript
const consumerPlugin: Plugin = {
  id: 'consumer-plugin',
  name: '消费者插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 获取服务
    const authService = context.services.get<IAuthService>('IAuthService')
    
    if (!authService) {
      context.logger.warn('认证服务不可用')
      return
    }
    
    // 使用服务
    if (authService.isAuthenticated()) {
      context.logger.info('用户已认证')
    }
  }
}
```

### 服务作用域

SlotKit 支持三种服务作用域：

1. **Singleton（单例）**：整个应用生命周期内只有一个实例
2. **Transient（瞬态）**：每次解析都创建新实例
3. **Scoped（作用域）**：在特定作用域内是单例

```typescript
// Singleton - 全局共享
container.registerSingleton('IAuthService', AuthService)

// Transient - 每次都是新实例
container.registerTransient('ILogger', Logger)

// Scoped - 在作用域内共享
container.registerFactory('IDbContext', 
  (c) => new DbContext(),
  ServiceScope.Scoped
)

// 创建作用域
const scope = container.createScope()
const dbContext1 = scope.resolve('IDbContext')
const dbContext2 = scope.resolve('IDbContext')
// dbContext1 === dbContext2 (在同一作用域内)

scope.dispose() // 清理作用域
```

---

## 使用事件总线

事件总线提供插件间的解耦通信。

### 发出事件

```typescript
const publisherPlugin: Plugin = {
  id: 'publisher-plugin',
  name: '发布者插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 同步发出事件
    context.events.emit('user:login', {
      userId: '123',
      timestamp: Date.now()
    })
    
    // 异步发出事件
    await context.events.emitAsync('data:sync', {
      records: [...]
    })
    
    context.logger.info('事件已发出')
  }
}
```

### 订阅事件

```typescript
const subscriberPlugin: Plugin = {
  id: 'subscriber-plugin',
  name: '订阅者插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 基本订阅
    const unsubscribe = context.events.on('user:login', (event) => {
      context.logger.info('用户登录:', event.payload.userId)
    })
    
    // 带选项的订阅
    context.events.on('data:update', async (event) => {
      await processUpdate(event.payload)
    }, {
      priority: 5,        // 优先级
      async: true,        // 异步处理
      debounce: 300       // 防抖
    })
    
    // 一次性订阅
    context.events.once('system:ready', (event) => {
      context.logger.info('系统已就绪')
    })
    
    // 带过滤器的订阅
    context.events.on('message:received', (event) => {
      context.logger.info('重要消息:', event.payload)
    }, {
      filter: (event) => event.payload.priority === 'high'
    })
  }
}
```

### 事件命名约定

建议使用以下命名约定：

- `namespace:action` - 例如：`user:login`, `data:update`
- 使用小写字母和连字符
- 保持简洁和描述性

常见事件命名空间：

- `system:*` - 系统级事件
- `plugin:*` - 插件生命周期事件
- `user:*` - 用户相关事件
- `data:*` - 数据相关事件
- `ui:*` - UI 相关事件

### 等待事件

```typescript
// 等待特定事件（带超时）
try {
  const event = await context.events.waitFor('user:authenticated', 5000)
  context.logger.info('用户已认证:', event.payload)
} catch (error) {
  context.logger.error('等待超时')
}
```

---

## 定义扩展点

扩展点系统允许应用定义可扩展的点，插件可以贡献到这些点。

### 应用定义扩展点

```typescript
import { ExtensionRegistry } from '@slotkitjs/core'

// 定义命令扩展点
extensionRegistry.registerExtensionPoint({
  id: 'commands',
  name: 'Commands',
  description: '应用命令扩展点',
  multiple: true,  // 允许多个贡献
  schema: {
    type: 'object',
    required: ['id', 'handler'],
    properties: {
      id: { type: 'string' },
      label: { type: 'string' },
      handler: { type: 'function' }
    }
  }
})

// 定义视图扩展点
extensionRegistry.registerExtensionPoint({
  id: 'views',
  name: 'Views',
  description: '应用视图扩展点',
  multiple: true,
  schema: {
    type: 'object',
    required: ['id', 'component'],
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      component: { type: 'function' },
      icon: { type: 'string' }
    }
  }
})
```

### 插件贡献到扩展点

```typescript
const contributorPlugin: Plugin = {
  id: 'contributor-plugin',
  name: '贡献者插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 贡献命令
    extensionRegistry.contribute('commands', {
      contributorId: context.pluginId,
      value: {
        id: 'my-plugin.hello',
        label: '打招呼',
        handler: () => {
          console.log('Hello from plugin!')
        }
      },
      priority: 10
    })
    
    // 贡献视图
    extensionRegistry.contribute('views', {
      contributorId: context.pluginId,
      value: {
        id: 'my-plugin.view',
        title: '我的视图',
        component: MyViewComponent,
        icon: 'icon-view'
      }
    })
  }
}
```

### 应用使用贡献

```typescript
// 获取所有命令贡献
const commands = extensionRegistry.getContributions('commands')

// 注册命令
commands.forEach(cmd => {
  if (cmd.enabled !== false) {
    registerCommand(cmd.value.id, cmd.value.handler)
  }
})

// 渲染视图
const views = extensionRegistry.getContributions('views')
views.forEach(view => {
  renderView(view.value)
})
```

### 在清单中声明贡献

```json
{
  "id": "my-plugin",
  "contributes": {
    "commands": [
      {
        "id": "my-plugin.hello",
        "label": "打招呼",
        "handler": "handleHello"
      }
    ],
    "views": [
      {
        "id": "my-plugin.view",
        "title": "我的视图",
        "component": "MyViewComponent"
      }
    ]
  }
}
```

---

## 使用钩子系统

钩子系统允许在特定点注入逻辑。

### Action 钩子

Action 钩子用于执行操作，不返回值。

```typescript
import { HookSystem } from '@slotkitjs/core'

// 添加 action 钩子
hookSystem.addAction('user:login', async (userId) => {
  console.log('用户登录:', userId)
  await logUserActivity(userId)
}, 10) // 优先级

// 执行 action 钩子
await hookSystem.doAction('user:login', '123')
```

### Filter 钩子

Filter 钩子用于转换数据。

```typescript
// 添加 filter 钩子
hookSystem.addFilter('content:render', (content) => {
  // 替换占位符
  return content.replace(/\[user\]/g, currentUser.name)
}, 5)

hookSystem.addFilter('content:render', (content) => {
  // 添加样式
  return `<div class="content">${content}</div>`
}, 10)

// 应用 filter 钩子
const rendered = await hookSystem.applyFilters('content:render', originalContent)
```

### 在插件中使用钩子

```typescript
const hookPlugin: Plugin = {
  id: 'hook-plugin',
  name: '钩子插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 注册 action 钩子
    const removeAction = hookSystem.addAction('app:startup', async () => {
      context.logger.info('应用启动')
    })
    
    // 注册 filter 钩子
    const removeFilter = hookSystem.addFilter('data:process', (data) => {
      return { ...data, processed: true }
    })
    
    // 保存清理函数
    context.onUnmount = () => {
      removeAction()
      removeFilter()
    }
  }
}
```

---

## 管理依赖

### 声明插件依赖

在 `manifest.json` 中声明依赖：

```json
{
  "id": "my-plugin",
  "dependencies": {
    "plugins": [
      {
        "id": "base-plugin",
        "version": "^1.0.0",
        "optional": false
      },
      {
        "id": "optional-plugin",
        "version": ">=2.0.0",
        "optional": true
      }
    ],
    "services": [
      {
        "interface": "IAuthService",
        "optional": false
      },
      {
        "interface": "ICacheService",
        "optional": true
      }
    ]
  }
}
```

### 版本约束

支持 Semver 版本约束：

- `1.0.0` - 精确版本
- `^1.0.0` - 兼容版本（1.x.x）
- `~1.0.0` - 补丁版本（1.0.x）
- `>=1.0.0` - 大于等于
- `<2.0.0` - 小于
- `1.0.0 - 2.0.0` - 范围

### 处理可选依赖

```typescript
const plugin: Plugin = {
  id: 'my-plugin',
  name: '我的插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 必需服务
    const authService = context.services.get<IAuthService>('IAuthService')
    if (!authService) {
      throw new Error('认证服务不可用')
    }
    
    // 可选服务
    const cacheService = context.services.get<ICacheService>('ICacheService')
    if (cacheService) {
      // 使用缓存
      context.logger.info('使用缓存服务')
    } else {
      // 回退方案
      context.logger.warn('缓存服务不可用，使用内存缓存')
    }
  }
}
```

---

## 最佳实践

### 1. 保持插件独立

```typescript
// ❌ 不好：直接导入其他插件
import { AuthService } from '../auth-plugin/auth-service'

// ✅ 好：通过服务容器访问
const authService = context.services.get<IAuthService>('IAuthService')
```

### 2. 使用类型定义包

```typescript
// ✅ 只导入类型，不导入实现
import type { IAuthService } from '@slotkitjs/types/contracts'

// 运行时通过服务容器获取
const authService = context.services.get<IAuthService>('IAuthService')
```

### 3. 优雅处理缺失服务

```typescript
const service = context.services.get<IMyService>('IMyService')

if (!service) {
  // 提供回退方案
  context.logger.warn('服务不可用，使用默认行为')
  return defaultBehavior()
}

// 正常使用服务
return service.doSomething()
```

### 4. 清理资源

```typescript
const plugin: Plugin = {
  id: 'my-plugin',
  
  onMount: async (context: PluginContext) => {
    // 订阅事件
    const unsubscribe = context.events.on('data:change', handler)
    
    // 注册清理函数
    return () => {
      unsubscribe()
      // 其他清理逻辑
    }
  },
  
  onUnmount: async (context: PluginContext) => {
    // 清理逻辑
  }
}
```

### 5. 使用日志记录

```typescript
context.logger.debug('调试信息', { data })
context.logger.info('信息消息')
context.logger.warn('警告消息')
context.logger.error('错误消息', error)
```

### 6. 错误处理

```typescript
try {
  await riskyOperation()
} catch (error) {
  context.logger.error('操作失败', error)
  // 发出错误事件
  context.events.emit('plugin:error', {
    pluginId: context.pluginId,
    error: error.message
  })
}
```

### 7. 配置管理

```typescript
// 注册配置模式
configManager.registerSchema('myPlugin.setting', {
  type: 'string',
  default: 'default-value',
  validate: (value) => typeof value === 'string'
})

// 获取配置
const setting = configManager.get('myPlugin.setting')

// 监听配置变更
configManager.onChange('myPlugin.setting', (event) => {
  // 响应配置变更
})
```

### 8. 测试插件

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockContext } from '@slotkitjs/testing'

describe('MyPlugin', () => {
  let context: PluginContext
  
  beforeEach(() => {
    context = createMockContext()
  })
  
  it('应该正确挂载', async () => {
    await myPlugin.onMount(context)
    
    expect(context.services.get('IMyService')).toBeDefined()
  })
})
```

---

## 下一步

- 查看 [API 文档](./API.md) 了解详细的 API 参考
- 查看 [示例项目](../examples/) 了解实际应用
- 阅读 [架构设计](../../.kiro/specs/plugin-decoupling/design.md) 了解系统设计
