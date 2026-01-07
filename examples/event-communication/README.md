# 事件通信示例

本示例展示插件如何通过事件总线进行解耦通信。

## 概述

本示例包含三个插件：

1. **user-plugin** - 管理用户操作，发出用户相关事件
2. **logger-plugin** - 监听所有事件并记录日志
3. **notification-plugin** - 监听特定事件并显示通知

## 项目结构

```
event-communication/
├── src/
│   ├── plugins/
│   │   ├── user-plugin/
│   │   │   ├── manifest.json
│   │   │   └── index.ts
│   │   ├── logger-plugin/
│   │   │   ├── manifest.json
│   │   │   └── index.ts
│   │   └── notification-plugin/
│   │       ├── manifest.json
│   │       └── index.ts
│   ├── types/
│   │   └── events.ts
│   └── main.ts
├── package.json
└── tsconfig.json
```

## 运行示例

```bash
npm install
npm run dev
```

## 关键概念

### 1. 定义事件类型

首先定义事件的类型，确保类型安全：

```typescript
// src/types/events.ts
export interface UserLoginEvent {
  userId: string
  username: string
  timestamp: number
}

export interface UserLogoutEvent {
  userId: string
  reason: 'user' | 'timeout' | 'error'
  timestamp: number
}

export interface DataUpdateEvent {
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  data: any
}
```

### 2. 发出事件

在插件中发出事件：

```typescript
// src/plugins/user-plugin/index.ts
const userPlugin: Plugin = {
  id: 'user-plugin',
  name: '用户插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 模拟用户登录
    setTimeout(() => {
      context.events.emit<UserLoginEvent>('user:login', {
        userId: '123',
        username: 'admin',
        timestamp: Date.now()
      })
    }, 1000)
    
    // 模拟用户登出
    setTimeout(() => {
      context.events.emit<UserLogoutEvent>('user:logout', {
        userId: '123',
        reason: 'user',
        timestamp: Date.now()
      })
    }, 3000)
  }
}
```

### 3. 订阅事件

在其他插件中订阅事件：

```typescript
// src/plugins/logger-plugin/index.ts
const loggerPlugin: Plugin = {
  id: 'logger-plugin',
  name: '日志插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 订阅用户登录事件
    context.events.on<UserLoginEvent>('user:login', (event) => {
      console.log(`📝 [日志] 用户登录: ${event.payload.username}`)
    })
    
    // 订阅用户登出事件
    context.events.on<UserLogoutEvent>('user:logout', (event) => {
      console.log(`📝 [日志] 用户登出: ${event.payload.userId}`)
    })
  }
}
```

### 4. 带选项的订阅

使用订阅选项控制事件处理：

```typescript
// src/plugins/notification-plugin/index.ts
const notificationPlugin: Plugin = {
  id: 'notification-plugin',
  name: '通知插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 高优先级订阅
    context.events.on<UserLoginEvent>('user:login', (event) => {
      console.log(`🔔 [通知] 欢迎, ${event.payload.username}!`)
    }, {
      priority: 10  // 高优先级，先执行
    })
    
    // 带防抖的订阅
    context.events.on<DataUpdateEvent>('data:update', (event) => {
      console.log(`🔔 [通知] 数据已更新: ${event.payload.entityType}`)
    }, {
      debounce: 500  // 500ms 防抖
    })
    
    // 一次性订阅
    context.events.once('system:ready', (event) => {
      console.log('🔔 [通知] 系统已就绪!')
    })
  }
}
```

### 5. 事件过滤

只订阅符合条件的事件：

```typescript
// 只订阅重要的数据更新
context.events.on<DataUpdateEvent>('data:update', (event) => {
  console.log('🔔 重要更新:', event.payload)
}, {
  filter: (event) => event.payload.entityType === 'user'
})
```

### 6. 异步事件处理

```typescript
// 异步处理事件
context.events.on<UserLoginEvent>('user:login', async (event) => {
  await sendWelcomeEmail(event.payload.username)
  console.log('📧 欢迎邮件已发送')
}, {
  async: true
})
```

## 事件命名约定

本示例使用以下命名约定：

- `user:*` - 用户相关事件
  - `user:login` - 用户登录
  - `user:logout` - 用户登出
  - `user:update` - 用户信息更新

- `data:*` - 数据相关事件
  - `data:create` - 数据创建
  - `data:update` - 数据更新
  - `data:delete` - 数据删除

- `system:*` - 系统相关事件
  - `system:ready` - 系统就绪
  - `system:error` - 系统错误

## 学到的内容

1. ✅ 如何定义类型安全的事件
2. ✅ 如何发出事件
3. ✅ 如何订阅事件
4. ✅ 如何使用订阅选项（优先级、防抖、过滤等）
5. ✅ 如何处理异步事件
6. ✅ 事件命名的最佳实践

## 优势

- **解耦**: 插件之间不需要直接引用
- **灵活**: 可以动态添加/移除事件监听器
- **可扩展**: 新插件可以轻松订阅现有事件
- **类型安全**: TypeScript 提供完整的类型检查

## 下一步

- 查看 [扩展点使用示例](../extension-points/) 了解如何定义扩展点
- 查看 [API 文档](../../docs/API.md) 了解更多事件总线 API
