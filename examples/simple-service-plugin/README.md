# 简单服务插件示例

本示例展示如何创建一个提供服务的插件，以及如何在其他插件中使用该服务。

## 概述

本示例包含两个插件：

1. **auth-plugin** - 提供认证服务
2. **dashboard-plugin** - 使用认证服务

## 项目结构

```
simple-service-plugin/
├── src/
│   ├── plugins/
│   │   ├── auth-plugin/
│   │   │   ├── manifest.json
│   │   │   ├── auth-service.ts
│   │   │   └── index.ts
│   │   └── dashboard-plugin/
│   │       ├── manifest.json
│   │       └── index.ts
│   ├── types/
│   │   └── contracts.ts
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

### 1. 定义服务契约

首先定义服务接口（契约），这样消费者只需要知道接口，不需要知道实现：

```typescript
// src/types/contracts.ts
export interface IAuthService {
  login(username: string, password: string): Promise<boolean>
  logout(): Promise<void>
  isAuthenticated(): boolean
  getUser(): { username: string } | null
}
```

### 2. 实现服务

在服务提供插件中实现接口：

```typescript
// src/plugins/auth-plugin/auth-service.ts
import type { IAuthService } from '../../types/contracts'

export class AuthService implements IAuthService {
  private user: { username: string } | null = null
  
  async login(username: string, password: string): Promise<boolean> {
    // 简单的模拟登录
    if (password === 'password') {
      this.user = { username }
      return true
    }
    return false
  }
  
  async logout(): Promise<void> {
    this.user = null
  }
  
  isAuthenticated(): boolean {
    return this.user !== null
  }
  
  getUser(): { username: string } | null {
    return this.user
  }
}
```

### 3. 注册服务

在插件的 `onMount` 钩子中注册服务：

```typescript
// src/plugins/auth-plugin/index.ts
import type { Plugin, PluginContext } from '@slotkitjs/types'
import { AuthService } from './auth-service'

const authPlugin: Plugin = {
  id: 'auth-plugin',
  name: '认证插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 创建服务实例
    const authService = new AuthService()
    
    // 注册服务
    context.services.register({
      id: 'auth-service',
      interface: 'IAuthService',
      implementation: authService,
      scope: 'singleton',
      providedBy: context.pluginId
    })
    
    context.logger.info('认证服务已注册')
  }
}

export default authPlugin
```

### 4. 使用服务

在消费插件中通过服务容器获取服务：

```typescript
// src/plugins/dashboard-plugin/index.ts
import type { Plugin, PluginContext } from '@slotkitjs/types'
import type { IAuthService } from '../../types/contracts'

const dashboardPlugin: Plugin = {
  id: 'dashboard-plugin',
  name: '仪表板插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 获取认证服务
    const authService = context.services.get<IAuthService>('IAuthService')
    
    if (!authService) {
      context.logger.warn('认证服务不可用')
      return
    }
    
    // 使用服务
    const isAuth = authService.isAuthenticated()
    context.logger.info(`用户认证状态: ${isAuth}`)
    
    // 模拟登录
    const success = await authService.login('admin', 'password')
    if (success) {
      const user = authService.getUser()
      context.logger.info(`用户已登录: ${user?.username}`)
    }
  }
}

export default dashboardPlugin
```

### 5. 声明依赖

在消费插件的清单中声明服务依赖：

```json
{
  "id": "dashboard-plugin",
  "name": "仪表板插件",
  "version": "1.0.0",
  "dependencies": {
    "services": [
      {
        "interface": "IAuthService",
        "optional": false
      }
    ]
  }
}
```

## 学到的内容

1. ✅ 如何定义服务契约接口
2. ✅ 如何实现服务
3. ✅ 如何在插件中注册服务
4. ✅ 如何在其他插件中使用服务
5. ✅ 如何声明服务依赖
6. ✅ 如何处理服务不可用的情况

## 下一步

- 查看 [事件通信示例](../event-communication/) 了解插件间如何通过事件通信
- 查看 [API 文档](../../docs/API.md) 了解更多服务容器 API
