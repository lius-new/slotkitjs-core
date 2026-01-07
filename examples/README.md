# SlotKit 示例项目

本目录包含 SlotKit 插件系统的示例项目，展示如何使用各种功能。

## 示例列表

1. **[简单服务插件](./simple-service-plugin/)** - 展示如何创建和使用服务插件
2. **[事件通信](./event-communication/)** - 展示插件间如何通过事件通信
3. **[扩展点使用](./extension-points/)** - 展示如何定义和使用扩展点

## 运行示例

每个示例都是独立的项目，可以单独运行：

```bash
cd examples/simple-service-plugin
npm install
npm run dev
```

## 学习路径

建议按以下顺序学习示例：

1. 从 **简单服务插件** 开始，了解基本的插件结构和服务注册
2. 学习 **事件通信**，了解插件间如何解耦通信
3. 最后学习 **扩展点使用**，了解如何构建可扩展的系统

## 更多资源

- [API 文档](../docs/API.md)
- [使用指南](../docs/GUIDE.md)
- [设计文档](../../../.kiro/specs/plugin-decoupling/design.md)
