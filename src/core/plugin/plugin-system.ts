import type { Plugin, PluginManifest } from '../types/plugin'
import { ServiceContainerImpl } from '../container/service-container'
import { EventBusImpl } from '../event/event-bus'
import { pluginRegistry } from './registry/plugin-registry'
import { PluginLifecycleManager } from './lifecycle-manager'
import { infoLog, errorLog } from '../utils'

/**
 * 插件系统
 * 协调服务容器、事件总线和插件生命周期管理
 */
export class PluginSystem {
  private serviceContainer: ServiceContainerImpl
  private eventBus: EventBusImpl
  private lifecycleManager: PluginLifecycleManager
  private initialized = false

  constructor() {
    this.serviceContainer = new ServiceContainerImpl()
    this.eventBus = new EventBusImpl()
    this.lifecycleManager = new PluginLifecycleManager(
      this.serviceContainer,
      this.eventBus,
      pluginRegistry
    )
  }

  /**
   * 初始化插件系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    infoLog('Initializing plugin system', { operation: 'plugin-system' })

    // 发出系统准备事件
    this.eventBus.emit('system:ready', {})

    this.initialized = true
    infoLog('Plugin system initialized', { operation: 'plugin-system' })
  }

  /**
   * 注册并挂载插件
   */
  async registerAndMountPlugin(plugin: Plugin, manifest: PluginManifest): Promise<void> {
    try {
      // 注册插件到注册表
      pluginRegistry.register(plugin)

      // 挂载插件（调用生命周期钩子）
      await this.lifecycleManager.mountPlugin(plugin, manifest)

      infoLog(`Plugin ${plugin.id} registered and mounted`, {
        pluginId: plugin.id,
        operation: 'plugin-system'
      })
    } catch (error) {
      errorLog(`Failed to register and mount plugin ${plugin.id}`, {
        pluginId: plugin.id,
        operation: 'plugin-system'
      }, error as Error)
      throw error
    }
  }

  /**
   * 卸载并注销插件
   */
  async unmountAndUnregisterPlugin(pluginId: string): Promise<void> {
    try {
      const plugin = pluginRegistry.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`)
      }

      // 卸载插件（调用生命周期钩子并清理资源）
      await this.lifecycleManager.unmountPlugin(plugin)

      // 从注册表注销插件
      pluginRegistry.unregister(pluginId)

      infoLog(`Plugin ${pluginId} unmounted and unregistered`, {
        pluginId,
        operation: 'plugin-system'
      })
    } catch (error) {
      errorLog(`Failed to unmount and unregister plugin ${pluginId}`, {
        pluginId,
        operation: 'plugin-system'
      }, error as Error)
      throw error
    }
  }

  /**
   * 获取服务容器
   */
  getServiceContainer(): ServiceContainerImpl {
    return this.serviceContainer
  }

  /**
   * 获取事件总线
   */
  getEventBus(): EventBusImpl {
    return this.eventBus
  }

  /**
   * 获取生命周期管理器
   */
  getLifecycleManager(): PluginLifecycleManager {
    return this.lifecycleManager
  }

  /**
   * 关闭插件系统
   */
  async shutdown(): Promise<void> {
    infoLog('Shutting down plugin system', { operation: 'plugin-system' })

    // 发出系统关闭事件
    this.eventBus.emit('system:shutdown', {})

    // 清理所有插件
    await this.lifecycleManager.dispose()

    // 清理服务容器
    this.serviceContainer.dispose()

    // 清理事件总线
    this.eventBus.clear()

    this.initialized = false
    infoLog('Plugin system shut down', { operation: 'plugin-system' })
  }
}

// 创建全局插件系统实例
export const pluginSystem = new PluginSystem()
