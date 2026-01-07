# SlotKit 文档

欢迎使用 SlotKit 插件系统文档！

## 📚 文档导航

### 入门指南

- **[使用指南 (GUIDE.md)](./GUIDE.md)** - 完整的插件开发指南
  - 快速开始
  - 创建插件
  - 使用服务容器
  - 使用事件总线
  - 定义扩展点
  - 最佳实践

### API 参考

- **[API 文档 (API.md)](./API.md)** - 完整的 API 参考
  - 服务容器 API
  - 事件总线 API
  - 扩展点注册表 API
  - 钩子系统 API
  - 管道系统 API
  - 依赖管理器 API
  - 配置管理器 API
  - 资源注册表 API
  - 插件上下文 API

### 示例项目

- **[示例项目 (../examples/)](../examples/)** - 实际可运行的示例
  - [简单服务插件](../examples/simple-service-plugin/) - 服务注册和使用
  - [事件通信](../examples/event-communication/) - 插件间事件通信
  - [扩展点使用](../examples/extension-points/) - 定义和使用扩展点

## 🚀 快速开始

### 安装

```bash
npm install @slotkitjs/core @slotkitjs/react @slotkitjs/types
```

### 创建第一个插件

```typescript
import type { Plugin, PluginContext } from '@slotkitjs/types'

const myPlugin: Plugin = {
  id: 'my-plugin',
  name: '我的插件',
  version: '1.0.0',
  
  onMount: async (context: PluginContext) => {
    context.logger.info('插件已挂载')
  }
}

export default myPlugin
```

## 📖 学习路径

建议按以下顺序学习：

1. **阅读使用指南** - 了解基本概念和使用方法
2. **查看示例项目** - 通过实际代码理解如何使用
3. **参考 API 文档** - 深入了解各个 API 的详细信息

## 🔑 核心概念

### 服务容器

提供依赖注入功能，管理服务的注册、解析和生命周期。

```typescript
// 注册服务
context.services.register({
  id: 'my-service',
  interface: 'IMyService',
  implementation: new MyService()
})

// 使用服务
const service = context.services.get<IMyService>('IMyService')
```

### 事件总线

提供插件间的解耦通信。

```typescript
// 发出事件
context.events.emit('user:login', { userId: '123' })

// 订阅事件
context.events.on('user:login', (event) => {
  console.log('用户登录:', event.payload.userId)
})
```

### 扩展点

允许应用定义可扩展的点，插件可以贡献功能。

```typescript
// 定义扩展点
extensionRegistry.registerExtensionPoint({
  id: 'commands',
  name: 'Commands',
  multiple: true
})

// 贡献到扩展点
extensionRegistry.contribute('commands', {
  contributorId: 'my-plugin',
  value: { id: 'hello', handler: () => console.log('Hello!') }
})
```

## 💡 设计原则

SlotKit 遵循以下设计原则：

1. **提供机制，而非策略** - 库提供通用的扩展机制，具体实现由应用决定
2. **最小化核心** - 核心库只提供必要的基础设施
3. **高度可扩展** - 通过扩展点系统，应用可以定义自己的扩展点
4. **松耦合** - 插件之间通过抽象接口和事件通信
5. **类型安全** - 充分利用 TypeScript 的类型系统

## 🤝 贡献

欢迎贡献！请查看项目的贡献指南。

## 📄 许可证

MIT License

---

**需要帮助？** 查看 [使用指南](./GUIDE.md) 或 [示例项目](../examples/)
