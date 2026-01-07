import type { PluginContext, Plugin, PluginManifest } from '../types/plugin'
import type { ServiceContainer } from '../container/types'
import type { EventBus } from '../event/types'
import type { PluginRegistry } from '../types/plugin'
import { debugLog, infoLog, warnLog, errorLog } from '../utils'

/**
 * 插件上下文实现
 * 为插件提供对系统服务的访问
 */
export class PluginContextImpl implements PluginContext {
  pluginId: string
  manifest: PluginManifest
  
  services: {
    get<T>(interfaceName: string | symbol): T | null
    getAll<T>(interfaceName: string | symbol): T[]
    register<T>(descriptor: any): void
    onAvailable(interfaceName: string | symbol, callback: (service: any) => void): () => void
  }
  
  events: {
    emit<T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): void
    emitAsync<T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): Promise<void>
    on<T>(eventType: string, callback: (event: any) => void | Promise<void>, options?: any): () => void
    once<T>(eventType: string, callback: (event: any) => void | Promise<void>): () => void
  }
  
  plugins: {
    get(pluginId: string): Plugin | undefined
    getAll(): Plugin[]
    getBySlot(slotName: string): Plugin[]
  }
  
  logger: {
    debug(message: string, data?: any): void
    info(message: string, data?: any): void
    warn(message: string, data?: any): void
    error(message: string, error?: Error): void
  }

  private serviceAvailabilityCallbacks: Map<string | symbol, Array<(service: any) => void>> = new Map()

  constructor(
    pluginId: string,
    manifest: PluginManifest,
    private serviceContainer: ServiceContainer,
    private eventBus: EventBus,
    private pluginRegistry: PluginRegistry
  ) {
    this.pluginId = pluginId
    this.manifest = manifest

    // 设置事件总线的当前插件 ID
    this.eventBus.setCurrentPluginId?.(pluginId)

    // 实现服务访问
    this.services = {
      get: <T>(interfaceName: string | symbol): T | null => {
        return this.serviceContainer.tryResolve<T>(interfaceName)
      },

      getAll: <T>(interfaceName: string | symbol): T[] => {
        return this.serviceContainer.resolveAll<T>(interfaceName)
      },

      register: <T>(descriptor: any): void => {
        // 添加 providedBy 元数据
        const enhancedDescriptor = {
          ...descriptor,
          metadata: {
            ...descriptor.metadata,
            providedBy: pluginId
          }
        }
        this.serviceContainer.register(enhancedDescriptor)
        
        // 通知等待此服务的回调
        const callbacks = this.serviceAvailabilityCallbacks.get(descriptor.interface)
        if (callbacks) {
          const service = this.serviceContainer.tryResolve(descriptor.interface)
          if (service) {
            callbacks.forEach(callback => {
              try {
                callback(service)
              } catch (error) {
                this.logger.error('Service availability callback error', error as Error)
              }
            })
          }
        }
      },

      onAvailable: (interfaceName: string | symbol, callback: (service: any) => void): (() => void) => {
        // 检查服务是否已经可用
        const service = this.serviceContainer.tryResolve(interfaceName)
        if (service) {
          // 立即调用回调
          try {
            callback(service)
          } catch (error) {
            this.logger.error('Service availability callback error', error as Error)
          }
          // 返回空的取消订阅函数
          return () => {}
        }

        // 服务尚未可用，注册回调
        if (!this.serviceAvailabilityCallbacks.has(interfaceName)) {
          this.serviceAvailabilityCallbacks.set(interfaceName, [])
        }
        this.serviceAvailabilityCallbacks.get(interfaceName)!.push(callback)

        // 返回取消订阅函数
        return () => {
          const callbacks = this.serviceAvailabilityCallbacks.get(interfaceName)
          if (callbacks) {
            const index = callbacks.indexOf(callback)
            if (index !== -1) {
              callbacks.splice(index, 1)
            }
          }
        }
      }
    }

    // 实现事件通信
    this.events = {
      emit: <T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): void => {
        this.eventBus.emit(eventType, payload, options)
      },

      emitAsync: async <T>(eventType: string, payload: T, options?: { priority?: number; metadata?: Record<string, any> }): Promise<void> => {
        await this.eventBus.emitAsync(eventType, payload, options)
      },

      on: <T>(eventType: string, callback: (event: any) => void | Promise<void>, options?: any): (() => void) => {
        return this.eventBus.on(eventType, callback, options)
      },

      once: <T>(eventType: string, callback: (event: any) => void | Promise<void>): (() => void) => {
        return this.eventBus.once(eventType, callback)
      }
    }

    // 实现插件注册表访问（只读）
    this.plugins = {
      get: (pluginId: string): Plugin | undefined => {
        return this.pluginRegistry.getPlugin(pluginId)
      },

      getAll: (): Plugin[] => {
        // 获取所有已加载的插件
        return Array.from(this.pluginRegistry.getPluginsByState?.('loaded') || [])
      },

      getBySlot: (slotName: string): Plugin[] => {
        return this.pluginRegistry.getPluginsForSlot(slotName)
      }
    }

    // 实现日志记录
    this.logger = {
      debug: (message: string, data?: any): void => {
        debugLog(message, { pluginId, ...data })
      },

      info: (message: string, data?: any): void => {
        infoLog(message, { pluginId, ...data })
      },

      warn: (message: string, data?: any): void => {
        warnLog(message, { pluginId, ...data })
      },

      error: (message: string, error?: Error): void => {
        errorLog(message, { pluginId }, error)
      }
    }
  }

  /**
   * 清理上下文资源
   */
  dispose(): void {
    // 清理所有事件订阅
    this.eventBus.offAll(this.pluginId)
    
    // 清理服务可用性回调
    this.serviceAvailabilityCallbacks.clear()
  }
}
