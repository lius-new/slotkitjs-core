# @slotkitjs/core

### 一个动态且隔离的插件系统框架

`@slotkitjs/core` 是 SlotKit 的核心包，提供了一个完全动态、完全隔离的插件系统框架，支持插件的独立开发和部署。

### 特性

- **完全动态**：新插件只需添加到 `plugins` 目录即可自动发现
- **完全隔离**：每个插件独立开发，互不影响
- **零配置**：开发者只需运行 `slotkit dev` 或 `slotkit build`
- **智能生成**：只在需要时重新生成导入映射
- **类型安全**：完整的 TypeScript 支持
- **插槽系统**：支持插件在指定位置渲染
- **CLI 工具**：内置的命令行工具用于插件管理

### 安装

```bash
npm install @slotkitjs/core
# 或
yarn add @slotkitjs/core
# 或
pnpm add @slotkitjs/core
```

### 快速开始

```typescript
import { pluginLoader, pluginRegistry } from '@slotkitjs/core'

// 加载所有插件
const plugins = await pluginLoader.loadAllPlugins()

// 注册插件
plugins.forEach(plugin => {
  pluginRegistry.register(plugin)
})

// 获取特定插槽的插件
const contentPlugins = pluginRegistry.getPluginsForSlot('content')
```

### CLI 使用

安装后，你可以使用 `slotkit` 命令：

```bash
# 启动开发服务器
slotkit dev

# 构建项目
slotkit build

# 生成插件导入映射
slotkit generate-imports

# 创建新插件
slotkit create-plugin my-plugin --slots content,sidebar

# 列出所有插件
slotkit list

# 启用插件
slotkit enable my-plugin

# 禁用插件
slotkit disable my-plugin
```

### 核心概念

#### 插件

插件是一个可以动态加载的自包含模块：

```typescript
interface Plugin {
  id: string
  name: string
  version: string
  component: PluginComponent
  slots?: string[]
}
```

#### 插件注册表

插件注册表管理所有已加载的插件，并提供基于插槽的查询：

```typescript
// 注册插件
pluginRegistry.register(plugin)

// 通过 ID 获取插件
const plugin = pluginRegistry.getPlugin('my-plugin')

// 获取插槽的插件
const plugins = pluginRegistry.getPluginsForSlot('content')

// 订阅注册表变化
pluginRegistry.subscribe((event) => {
  console.log('注册表事件:', event)
})
```

#### 插件加载器

插件加载器发现并加载插件：

```typescript
// 加载所有插件
const plugins = await pluginLoader.loadAllPlugins()

// 检查插件是否已加载
const isLoaded = pluginLoader.isPluginLoaded('my-plugin')

// 获取已加载的插件
const plugin = pluginLoader.getLoadedPlugin('my-plugin')
```

### 配置

在项目根目录创建 `slotkit.config.ts` 文件：

```typescript
import { defineConfig } from '@slotkitjs/core'

export default defineConfig({
  pluginsDir: './plugins',
  outputDir: './src/core/plugin/loader/plugin-imports.generated.ts',
  pluginsBasePath: './plugins'
})
```

### API 参考

#### PluginLoader

- `loadAllPlugins(): Promise<Plugin[]>` - 加载所有发现的插件
- `getLoadedPlugin(pluginId: string): Plugin | undefined` - 获取已加载的插件
- `getAllLoadedPlugins(): Plugin[]` - 获取所有已加载的插件
- `isPluginLoaded(pluginId: string): boolean` - 检查插件是否已加载

#### PluginRegistry

- `register(plugin: Plugin): void` - 注册插件
- `unregister(pluginId: string): void` - 注销插件
- `getPlugin(pluginId: string): Plugin | undefined` - 通过 ID 获取插件
- `getPluginsForSlot(slotName: string): Plugin[]` - 获取插槽的插件
- `subscribe(listener: PluginRegistryListener): () => void` - 订阅注册表事件

### 开发

```bash
# 克隆仓库
git clone <repository-url>
cd slotkitjs-core

# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式（监听）
pnpm dev
```

### 许可证

MIT

