# 扩展点使用示例

本示例展示如何定义扩展点以及插件如何贡献到扩展点。

## 概述

本示例包含：

1. **应用层** - 定义扩展点（commands, validators）
2. **command-plugin** - 贡献命令到扩展点
3. **validation-plugin** - 贡献验证器到扩展点

## 项目结构

```
extension-points/
├── src/
│   ├── app/
│   │   ├── command-registry.ts
│   │   └── validation-registry.ts
│   ├── plugins/
│   │   ├── command-plugin/
│   │   │   ├── manifest.json
│   │   │   └── index.ts
│   │   └── validation-plugin/
│   │       ├── manifest.json
│   │       └── index.ts
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

### 1. 定义扩展点

应用层定义可扩展的点：

```typescript
// src/app/command-registry.ts
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
      description: { type: 'string' },
      handler: { type: 'function' }
    }
  }
})
```

### 2. 插件贡献到扩展点

插件通过扩展点注册表贡献功能：

```typescript
// src/plugins/command-plugin/index.ts
const commandPlugin: Plugin = {
  id: 'command-plugin',
  name: '命令插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    // 贡献 hello 命令
    extensionRegistry.contribute('commands', {
      contributorId: context.pluginId,
      value: {
        id: 'hello',
        label: '打招呼',
        description: '向用户打招呼',
        handler: (name: string) => {
          console.log(`👋 Hello, ${name}!`)
        }
      },
      priority: 10
    })
    
    // 贡献 goodbye 命令
    extensionRegistry.contribute('commands', {
      contributorId: context.pluginId,
      value: {
        id: 'goodbye',
        label: '再见',
        description: '向用户道别',
        handler: (name: string) => {
          console.log(`👋 Goodbye, ${name}!`)
        }
      }
    })
  }
}
```

### 3. 应用使用贡献

应用获取并使用所有贡献：

```typescript
// src/app/command-registry.ts
export class CommandRegistry {
  private commands = new Map<string, Function>()
  
  constructor(private extensionRegistry: ExtensionRegistry) {
    this.loadCommands()
  }
  
  private loadCommands() {
    // 获取所有命令贡献
    const contributions = this.extensionRegistry.getContributions('commands')
    
    // 注册命令
    contributions.forEach(contrib => {
      if (contrib.enabled !== false) {
        this.commands.set(contrib.value.id, contrib.value.handler)
        console.log(`✅ 注册命令: ${contrib.value.id} - ${contrib.value.label}`)
      }
    })
  }
  
  execute(commandId: string, ...args: any[]) {
    const command = this.commands.get(commandId)
    if (command) {
      command(...args)
    } else {
      console.error(`❌ 命令不存在: ${commandId}`)
    }
  }
  
  listCommands() {
    return Array.from(this.commands.keys())
  }
}
```

### 4. 在清单中声明贡献

插件也可以在清单中声明贡献：

```json
{
  "id": "command-plugin",
  "name": "命令插件",
  "version": "1.0.0",
  "contributes": {
    "commands": [
      {
        "id": "hello",
        "label": "打招呼",
        "description": "向用户打招呼"
      },
      {
        "id": "goodbye",
        "label": "再见",
        "description": "向用户道别"
      }
    ]
  }
}
```

### 5. 验证器扩展点示例

```typescript
// 定义验证器扩展点
extensionRegistry.registerExtensionPoint({
  id: 'validators',
  name: 'Validators',
  description: '数据验证器扩展点',
  multiple: true,
  schema: {
    type: 'object',
    required: ['type', 'validate'],
    properties: {
      type: { type: 'string' },
      validate: { type: 'function' }
    }
  }
})

// 插件贡献验证器
extensionRegistry.contribute('validators', {
  contributorId: 'validation-plugin',
  value: {
    type: 'email',
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    }
  }
})

// 应用使用验证器
const validators = extensionRegistry.getContributions('validators')
const emailValidator = validators.find(v => v.value.type === 'email')
if (emailValidator) {
  const isValid = emailValidator.value.validate('test@example.com')
  console.log('Email valid:', isValid)
}
```

## 扩展点模式

### 常见扩展点类型

1. **命令扩展点** - 注册可执行的命令
2. **视图扩展点** - 注册 UI 组件
3. **验证器扩展点** - 注册数据验证器
4. **中间件扩展点** - 注册请求处理中间件
5. **菜单扩展点** - 注册菜单项
6. **快捷键扩展点** - 注册键盘快捷键

### 扩展点设计原则

1. **单一职责** - 每个扩展点只负责一种类型的扩展
2. **明确契约** - 使用 schema 定义贡献的结构
3. **验证贡献** - 验证贡献是否符合 schema
4. **优先级支持** - 允许贡献指定优先级
5. **启用/禁用** - 支持动态启用/禁用贡献

## 学到的内容

1. ✅ 如何定义扩展点
2. ✅ 如何贡献到扩展点
3. ✅ 如何获取和使用贡献
4. ✅ 如何在清单中声明贡献
5. ✅ 如何使用 schema 验证贡献
6. ✅ 扩展点的设计模式

## 优势

- **高度可扩展**: 应用可以定义任意扩展点
- **类型安全**: 通过 schema 验证贡献
- **解耦**: 应用和插件通过扩展点通信
- **灵活**: 支持优先级、启用/禁用等特性

## 下一步

- 查看 [API 文档](../../docs/API.md) 了解更多扩展点 API
- 查看 [使用指南](../../docs/GUIDE.md) 了解最佳实践
