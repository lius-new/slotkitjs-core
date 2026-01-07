# SlotKit 文档索引

本文档提供 SlotKit 插件系统的完整文档索引。

## 📚 文档结构

```
packages/slotkitjs-core/
├── docs/                          # 文档目录
│   ├── README.md                  # 文档导航
│   ├── API.md                     # API 参考文档
│   └── GUIDE.md                   # 使用指南
├── examples/                      # 示例项目
│   ├── README.md                  # 示例索引
│   ├── simple-service-plugin/     # 简单服务插件示例
│   ├── event-communication/       # 事件通信示例
│   └── extension-points/          # 扩展点使用示例
└── DOCUMENTATION.md               # 本文件
```

## 📖 文档清单

### 核心文档

✅ **[docs/README.md](./docs/README.md)** - 文档导航和快速开始
- 文档结构概览
- 快速开始指南
- 学习路径建议
- 核心概念介绍

✅ **[docs/API.md](./docs/API.md)** - 完整的 API 参考
- 服务容器 (Service Container) API
- 事件总线 (Event Bus) API
- 扩展点注册表 (Extension Registry) API
- 钩子系统 (Hook System) API
- 管道系统 (Pipeline System) API
- 依赖管理器 (Dependency Manager) API
- 配置管理器 (Configuration Manager) API
- 资源注册表 (Resource Registry) API
- 插件上下文 (Plugin Context) API

✅ **[docs/GUIDE.md](./docs/GUIDE.md)** - 插件开发指南
- 快速开始
- 创建插件
- 使用服务容器
- 使用事件总线
- 定义扩展点
- 使用钩子系统
- 管理依赖
- 最佳实践

### 示例项目

✅ **[examples/README.md](./examples/README.md)** - 示例项目索引
- 示例列表
- 运行说明
- 学习路径

✅ **[examples/simple-service-plugin/](./examples/simple-service-plugin/)** - 简单服务插件示例
- 展示如何创建和使用服务插件
- 包含完整的可运行代码
- 详细的 README 说明

✅ **[examples/event-communication/](./examples/event-communication/)** - 事件通信示例
- 展示插件间如何通过事件通信
- 演示事件发布和订阅
- 展示订阅选项（优先级、防抖、过滤等）

✅ **[examples/extension-points/](./examples/extension-points/)** - 扩展点使用示例
- 展示如何定义扩展点
- 演示插件如何贡献到扩展点
- 展示应用如何使用贡献

## 🎯 按需求查找文档

### 我想了解基本概念
👉 阅读 [docs/README.md](./docs/README.md) 的核心概念部分

### 我想创建第一个插件
👉 阅读 [docs/GUIDE.md](./docs/GUIDE.md) 的"创建插件"部分
👉 查看 [examples/simple-service-plugin/](./examples/simple-service-plugin/)

### 我想了解如何使用服务容器
👉 阅读 [docs/GUIDE.md](./docs/GUIDE.md) 的"使用服务容器"部分
👉 查看 [docs/API.md](./docs/API.md) 的服务容器 API
👉 运行 [examples/simple-service-plugin/](./examples/simple-service-plugin/)

### 我想了解插件间如何通信
👉 阅读 [docs/GUIDE.md](./docs/GUIDE.md) 的"使用事件总线"部分
👉 查看 [docs/API.md](./docs/API.md) 的事件总线 API
👉 运行 [examples/event-communication/](./examples/event-communication/)

### 我想让我的应用可扩展
👉 阅读 [docs/GUIDE.md](./docs/GUIDE.md) 的"定义扩展点"部分
👉 查看 [docs/API.md](./docs/API.md) 的扩展点注册表 API
👉 运行 [examples/extension-points/](./examples/extension-points/)

### 我想查找特定 API
👉 查看 [docs/API.md](./docs/API.md) 的目录，找到对应的 API 部分

### 我想了解最佳实践
👉 阅读 [docs/GUIDE.md](./docs/GUIDE.md) 的"最佳实践"部分

## 📋 文档完成度

### 任务 13.1: 编写 API 文档 ✅
- [x] 服务容器 API
- [x] 事件总线 API
- [x] 扩展点系统 API
- [x] 钩子系统 API
- [x] 管道系统 API
- [x] 依赖管理器 API
- [x] 配置管理器 API
- [x] 资源注册表 API
- [x] 插件上下文 API

### 任务 13.2: 编写使用指南 ✅
- [x] 如何创建插件
- [x] 如何使用服务容器
- [x] 如何使用事件总线
- [x] 如何定义扩展点
- [x] 如何使用钩子系统
- [x] 如何管理依赖
- [x] 最佳实践

### 任务 13.3: 创建示例项目 ✅
- [x] 简单服务插件示例
- [x] 事件通信示例
- [x] 扩展点使用示例

## 🚀 开始使用

1. **安装依赖**
   ```bash
   npm install @slotkitjs/core @slotkitjs/react @slotkitjs/types
   ```

2. **阅读文档**
   - 从 [docs/README.md](./docs/README.md) 开始
   - 按照学习路径逐步学习

3. **运行示例**
   ```bash
   cd examples/simple-service-plugin
   npm install
   npm run dev
   ```

4. **创建自己的插件**
   - 参考 [docs/GUIDE.md](./docs/GUIDE.md)
   - 参考示例项目的代码

## 📞 获取帮助

- 查看 [docs/GUIDE.md](./docs/GUIDE.md) 的最佳实践部分
- 运行示例项目了解实际用法
- 查看 [docs/API.md](./docs/API.md) 了解详细的 API 信息

---

**文档版本**: 1.0.0  
**最后更新**: 2024

所有文档和示例已完成！🎉
