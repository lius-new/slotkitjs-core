import type { Plugin, PluginManifest, PluginRegistry } from '../types/plugin'
import type { ServiceContainer } from '../container/types'
import type { EventBus } from '../event/types'
import { PluginContextImpl } from './plugin-context'
import { infoLog, warnLog, errorLog } from '../utils'

/**
 * 插件生命周期管理器
 * 负责插件的加载、卸载和生命周期钩子调用
 */
export class PluginLifecycleManager {
  private pluginContexts = new Map<string, PluginContextImpl>()
  private mountedPlugins = new Set<string>()

  constructor(
    private serviceContainer: ServiceContainer,
    private eventBus: EventBus,
    private pluginRegistry: PluginRegistry
  ) {}

  /**
   * 挂载插件（调用 onMount 钩子）
   */
  async mountPlugin(plugin: Plugin, manifest: PluginManifest): Promise<void> {
    if (this.mountedPlugins.has(plugin.id)) {
      warnLog(`Plugin ${plugin.id} is already mounted`, { pluginId: plugin.id })
      return
    }

    try {
      // 创建插件上下文
      const context = new PluginContextImpl(
        plugin.id,
        manifest,
        this.serviceContainer,
        this.eventBus,
        this.pluginRegistry
      )
      this.pluginContexts.set(plugin.id, context)

      // 发出插件即将激活事件
      this.eventBus.emit('plugin:will-activate', { pluginId: plugin.id })

      // 调用 onMount 钩子
      if (plugin.onMount) {
        await plugin.onMount(context)
        infoLog(`Plugin ${plugin.id} onMount hook executed`, { pluginId: plugin.id })
      }

      this.mountedPlugins.add(plugin.id)

      // 发出插件已激活事件
      this.eventBus.emit('plugin:did-activate', { pluginId: plugin.id })

      infoLog(`Plugin ${plugin.id} mounted successfully`, { pluginId: plugin.id })
    } catch (error) {
      errorLog(`Failed to mount plugin ${plugin.id}`, { pluginId: plugin.id }, error as Error)
      
      // 发出插件错误事件
      this.eventBus.emit('plugin:error', {
        pluginId: plugin.id,
        error: error instanceof Error ? error.message : String(error)
      })

      // 调用 onError 钩子
      if (plugin.onError && error instanceof Error) {
        try {
          plugin.onError(error)
        } catch (hookError) {
          errorLog(`Plugin ${plugin.id} onError hook failed`, { pluginId: plugin.id }, hookError as Error)
        }
      }

      throw error
    }
  }

  /**
   * 卸载插件（调用 onUnmount 钩子并清理资源）
   */
  async unmountPlugin(plugin: Plugin): Promise<void> {
    if (!this.mountedPlugins.has(plugin.id)) {
      warnLog(`Plugin ${plugin.id} is not mounted`, { pluginId: plugin.id })
      return
    }

    try {
      const context = this.pluginContexts.get(plugin.id)
      if (!context) {
        warnLog(`Plugin context not found for ${plugin.id}`, { pluginId: plugin.id })
        return
      }

      // 发出插件即将停用事件
      this.eventBus.emit('plugin:will-deactivate', { pluginId: plugin.id })

      // 调用 onUnmount 钩子
      if (plugin.onUnmount) {
        await plugin.onUnmount(context)
        infoLog(`Plugin ${plugin.id} onUnmount hook executed`, { pluginId: plugin.id })
      }

      // 清理插件上下文（自动清理事件订阅等）
      context.dispose()
      this.pluginContexts.delete(plugin.id)
      this.mountedPlugins.delete(plugin.id)

      // 发出插件已停用事件
      this.eventBus.emit('plugin:did-deactivate', { pluginId: plugin.id })

      infoLog(`Plugin ${plugin.id} unmounted successfully`, { pluginId: plugin.id })
    } catch (error) {
      errorLog(`Failed to unmount plugin ${plugin.id}`, { pluginId: plugin.id }, error as Error)
      
      // 发出插件错误事件
      this.eventBus.emit('plugin:error', {
        pluginId: plugin.id,
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  }

  /**
   * 通知插件配置变更
   */
  async notifyConfigChange(
    plugin: Plugin,
    key: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    if (!this.mountedPlugins.has(plugin.id)) {
      return
    }

    const context = this.pluginContexts.get(plugin.id)
    if (!context) {
      return
    }

    try {
      // 发出配置变更事件
      this.eventBus.emit('plugin:config-change', {
        pluginId: plugin.id,
        key,
        oldValue,
        newValue
      })

      // 调用 onConfigChange 钩子
      if (plugin.onConfigChange) {
        await plugin.onConfigChange(context, key, oldValue, newValue)
        infoLog(`Plugin ${plugin.id} onConfigChange hook executed`, {
          pluginId: plugin.id,
          key
        })
      }
    } catch (error) {
      errorLog(`Failed to notify config change for plugin ${plugin.id}`, {
        pluginId: plugin.id,
        key
      }, error as Error)
    }
  }

  /**
   * 获取插件上下文
   */
  getPluginContext(pluginId: string): PluginContextImpl | undefined {
    return this.pluginContexts.get(pluginId)
  }

  /**
   * 检查插件是否已挂载
   */
  isPluginMounted(pluginId: string): boolean {
    return this.mountedPlugins.has(pluginId)
  }

  /**
   * 获取所有已挂载的插件 ID
   */
  getMountedPluginIds(): string[] {
    return Array.from(this.mountedPlugins)
  }

  /**
   * 清理所有插件
   */
  async dispose(): Promise<void> {
    const pluginIds = Array.from(this.mountedPlugins)
    
    for (const pluginId of pluginIds) {
      const plugin = this.pluginRegistry.getPlugin(pluginId)
      if (plugin) {
        try {
          await this.unmountPlugin(plugin)
        } catch (error) {
          errorLog(`Failed to unmount plugin ${pluginId} during dispose`, {
            pluginId
          }, error as Error)
        }
      }
    }

    this.pluginContexts.clear()
    this.mountedPlugins.clear()
  }
}
