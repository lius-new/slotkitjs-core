import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PluginSystem } from '../plugin-system'
import { PluginLifecycleManager } from '../lifecycle-manager'
import { ServiceContainerImpl } from '../../container/service-container'
import { EventBusImpl } from '../../event/event-bus'
import { pluginRegistry } from '../registry/plugin-registry'
import type { Plugin, PluginManifest, PluginContext } from '../../types/plugin'

describe('Plugin Lifecycle Integration Tests', () => {
  let pluginSystem: PluginSystem
  let serviceContainer: ServiceContainerImpl
  let eventBus: EventBusImpl
  let lifecycleManager: PluginLifecycleManager

  beforeEach(() => {
    // 创建新的插件系统实例
    pluginSystem = new PluginSystem()
    serviceContainer = pluginSystem.getServiceContainer()
    eventBus = pluginSystem.getEventBus()
    lifecycleManager = pluginSystem.getLifecycleManager()
  })

  describe('插件加载和卸载', () => {
    it('应该成功加载和卸载插件', async () => {
      const onMountSpy = vi.fn()
      const onUnmountSpy = vi.fn()

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null,
        onMount: onMountSpy,
        onUnmount: onUnmountSpy
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      // 初始化插件系统
      await pluginSystem.initialize()

      // 注册并挂载插件
      await pluginSystem.registerAndMountPlugin(plugin, manifest)

      // 验证 onMount 被调用
      expect(onMountSpy).toHaveBeenCalledTimes(1)
      expect(onMountSpy).toHaveBeenCalledWith(expect.objectContaining({
        pluginId: 'test-plugin',
        manifest: expect.objectContaining({ id: 'test-plugin' })
      }))

      // 验证插件已挂载
      expect(lifecycleManager.isPluginMounted('test-plugin')).toBe(true)

      // 卸载插件
      await pluginSystem.unmountAndUnregisterPlugin('test-plugin')

      // 验证 onUnmount 被调用
      expect(onUnmountSpy).toHaveBeenCalledTimes(1)

      // 验证插件已卸载
      expect(lifecycleManager.isPluginMounted('test-plugin')).toBe(false)
    })

    it('应该在插件加载时发出生命周期事件', async () => {
      const willActivateSpy = vi.fn()
      const didActivateSpy = vi.fn()

      eventBus.on('plugin:will-activate', willActivateSpy)
      eventBus.on('plugin:did-activate', didActivateSpy)

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()
      await pluginSystem.registerAndMountPlugin(plugin, manifest)

      expect(willActivateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { pluginId: 'test-plugin' }
        })
      )
      expect(didActivateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { pluginId: 'test-plugin' }
        })
      )
    })

    it('应该在插件卸载时发出生命周期事件', async () => {
      const willDeactivateSpy = vi.fn()
      const didDeactivateSpy = vi.fn()

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()
      
      // 订阅卸载事件（在挂载之前订阅）
      eventBus.on('plugin:will-deactivate', willDeactivateSpy)
      eventBus.on('plugin:did-deactivate', didDeactivateSpy)

      await pluginSystem.registerAndMountPlugin(plugin, manifest)
      await pluginSystem.unmountAndUnregisterPlugin('test-plugin')

      expect(willDeactivateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { pluginId: 'test-plugin' }
        })
      )
      expect(didDeactivateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { pluginId: 'test-plugin' }
        })
      )
    })
  })

  describe('服务注册和访问', () => {
    it('应该允许插件注册和访问服务', async () => {
      let capturedContext: PluginContext | null = null

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null,
        onMount: async (context) => {
          capturedContext = context

          // 注册服务
          context.services.register({
            id: 'test-service',
            interface: 'ITestService',
            scope: 'singleton' as any,
            instance: { value: 'test' }
          })
        }
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()
      await pluginSystem.registerAndMountPlugin(plugin, manifest)

      // 验证服务已注册
      expect(capturedContext).not.toBeNull()
      const service = capturedContext!.services.get<{ value: string }>('ITestService')
      expect(service).toEqual({ value: 'test' })
    })

    it('应该允许插件访问其他插件注册的服务', async () => {
      // 第一个插件注册服务
      const plugin1: Plugin = {
        id: 'plugin-1',
        name: 'Plugin 1',
        version: '1.0.0',
        component: () => null,
        onMount: async (context) => {
          context.services.register({
            id: 'shared-service',
            interface: 'ISharedService',
            scope: 'singleton' as any,
            instance: { data: 'shared' }
          })
        }
      }

      const manifest1: PluginManifest = {
        id: 'plugin-1',
        name: 'Plugin 1',
        version: '1.0.0',
        description: 'Plugin 1',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      // 第二个插件访问服务
      let retrievedService: any = null
      const plugin2: Plugin = {
        id: 'plugin-2',
        name: 'Plugin 2',
        version: '1.0.0',
        component: () => null,
        onMount: async (context) => {
          retrievedService = context.services.get('ISharedService')
        }
      }

      const manifest2: PluginManifest = {
        id: 'plugin-2',
        name: 'Plugin 2',
        version: '1.0.0',
        description: 'Plugin 2',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()
      await pluginSystem.registerAndMountPlugin(plugin1, manifest1)
      await pluginSystem.registerAndMountPlugin(plugin2, manifest2)

      // 验证第二个插件可以访问第一个插件注册的服务
      expect(retrievedService).toEqual({ data: 'shared' })
    })

    it('应该在服务不可用时返回 null', async () => {
      let retrievedService: any = undefined

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null,
        onMount: async (context) => {
          retrievedService = context.services.get('INonExistentService')
        }
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()
      await pluginSystem.registerAndMountPlugin(plugin, manifest)

      expect(retrievedService).toBeNull()
    })
  })

  describe('事件订阅和清理', () => {
    it('应该允许插件订阅和发出事件', async () => {
      const eventHandler = vi.fn()
      let capturedContext: PluginContext | null = null

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null,
        onMount: async (context) => {
          capturedContext = context
          // 订阅事件
          context.events.on('test:event', eventHandler)
        }
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()
      await pluginSystem.registerAndMountPlugin(plugin, manifest)

      // 发出事件
      capturedContext!.events.emit('test:event', { message: 'hello' })

      // 验证事件处理器被调用
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test:event',
          payload: { message: 'hello' }
        })
      )
    })

    it('应该在插件卸载时自动清理事件订阅', async () => {
      const eventHandler = vi.fn()

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null,
        onMount: async (context) => {
          context.events.on('test:event', eventHandler)
        }
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()
      await pluginSystem.registerAndMountPlugin(plugin, manifest)

      // 卸载插件
      await pluginSystem.unmountAndUnregisterPlugin('test-plugin')

      // 发出事件
      eventBus.emit('test:event', { message: 'hello' })

      // 验证事件处理器没有被调用（因为订阅已被清理）
      expect(eventHandler).not.toHaveBeenCalled()
    })

    it('应该允许插件之间通过事件通信', async () => {
      const receivedMessages: string[] = []

      // 发送者插件
      let senderContext: PluginContext | null = null
      const senderPlugin: Plugin = {
        id: 'sender-plugin',
        name: 'Sender Plugin',
        version: '1.0.0',
        component: () => null,
        onMount: async (context) => {
          senderContext = context
        }
      }

      // 接收者插件
      const receiverPlugin: Plugin = {
        id: 'receiver-plugin',
        name: 'Receiver Plugin',
        version: '1.0.0',
        component: () => null,
        onMount: async (context) => {
          context.events.on<{ text: string }>('message:sent', (event) => {
            receivedMessages.push(event.payload.text)
          })
        }
      }

      const senderManifest: PluginManifest = {
        id: 'sender-plugin',
        name: 'Sender Plugin',
        version: '1.0.0',
        description: 'Sender',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      const receiverManifest: PluginManifest = {
        id: 'receiver-plugin',
        name: 'Receiver Plugin',
        version: '1.0.0',
        description: 'Receiver',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()
      await pluginSystem.registerAndMountPlugin(receiverPlugin, receiverManifest)
      await pluginSystem.registerAndMountPlugin(senderPlugin, senderManifest)

      // 发送消息
      senderContext!.events.emit('message:sent', { text: 'Hello from sender!' })

      // 验证接收者收到消息
      expect(receivedMessages).toEqual(['Hello from sender!'])
    })
  })

  describe('配置变更通知', () => {
    it('应该在配置变更时调用 onConfigChange 钩子', async () => {
      const onConfigChangeSpy = vi.fn()

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null,
        onConfigChange: onConfigChangeSpy
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()
      await pluginSystem.registerAndMountPlugin(plugin, manifest)

      // 通知配置变更
      await lifecycleManager.notifyConfigChange(plugin, 'theme', 'light', 'dark')

      // 验证钩子被调用
      expect(onConfigChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ pluginId: 'test-plugin' }),
        'theme',
        'light',
        'dark'
      )
    })
  })

  describe('错误处理', () => {
    it('应该在 onMount 失败时调用 onError 钩子', async () => {
      const onErrorSpy = vi.fn()
      const mountError = new Error('Mount failed')

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null,
        onMount: async () => {
          throw mountError
        },
        onError: onErrorSpy
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()

      // 尝试挂载插件（应该失败）
      await expect(
        pluginSystem.registerAndMountPlugin(plugin, manifest)
      ).rejects.toThrow('Mount failed')

      // 验证 onError 被调用
      expect(onErrorSpy).toHaveBeenCalledWith(mountError)
    })

    it('应该在插件错误时发出 plugin:error 事件', async () => {
      const errorEventSpy = vi.fn()
      eventBus.on('plugin:error', errorEventSpy)

      const plugin: Plugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        component: () => null,
        onMount: async () => {
          throw new Error('Mount failed')
        }
      }

      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test',
        entry: './index.js',
        slots: [],
        enabled: true,
        dependencies: []
      }

      await pluginSystem.initialize()

      // 尝试挂载插件（应该失败）
      await expect(
        pluginSystem.registerAndMountPlugin(plugin, manifest)
      ).rejects.toThrow('Mount failed')

      // 验证错误事件被发出
      expect(errorEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            pluginId: 'test-plugin',
            error: 'Mount failed'
          })
        })
      )
    })
  })
})
