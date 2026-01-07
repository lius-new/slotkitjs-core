import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventBusImpl } from '../event-bus'

describe('EventBus Unit Tests', () => {
  let eventBus: EventBusImpl

  beforeEach(() => {
    eventBus = new EventBusImpl()
  })

  describe('同步事件发布', () => {
    it('应该同步发出事件并传递给订阅者', () => {
      const callback = vi.fn()
      
      eventBus.on('test-event', callback)
      eventBus.emit('test-event', { data: 'test' })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          payload: { data: 'test' }
        })
      )
    })

    it('应该向多个订阅者发出事件', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      eventBus.on('test-event', callback1)
      eventBus.on('test-event', callback2)
      eventBus.on('test-event', callback3)

      eventBus.emit('test-event', 'payload')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
      expect(callback3).toHaveBeenCalledTimes(1)
    })
  })

  describe('异步事件发布', () => {
    it('应该异步发出事件并等待所有订阅者', async () => {
      const callback1 = vi.fn().mockResolvedValue(undefined)
      const callback2 = vi.fn().mockResolvedValue(undefined)

      eventBus.on('test-event', callback1)
      eventBus.on('test-event', callback2)

      await eventBus.emitAsync('test-event', 'payload')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('应该按顺序等待异步订阅者', async () => {
      const order: number[] = []

      eventBus.on('test-event', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        order.push(1)
      })

      eventBus.on('test-event', async () => {
        order.push(2)
      })

      await eventBus.emitAsync('test-event', 'payload')

      expect(order).toEqual([1, 2])
    })
  })

  describe('事件过滤', () => {
    it('应该只向通过过滤器的订阅者发出事件', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.on('test-event', callback1, {
        filter: (event) => event.payload > 5
      })

      eventBus.on('test-event', callback2, {
        filter: (event) => event.payload <= 5
      })

      eventBus.emit('test-event', 3)
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledTimes(1)

      eventBus.emit('test-event', 10)
      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('防抖和节流', () => {
    it('应该对事件进行防抖处理', async () => {
      const callback = vi.fn()

      eventBus.on('test-event', callback, { debounce: 50 })

      // 快速发出多个事件
      eventBus.emit('test-event', 1)
      eventBus.emit('test-event', 2)
      eventBus.emit('test-event', 3)

      // 立即检查 - 不应该被调用
      expect(callback).not.toHaveBeenCalled()

      // 等待防抖延迟
      await new Promise(resolve => setTimeout(resolve, 60))

      // 应该只被调用一次，使用最后一个值
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: 3
        })
      )
    })

    it('应该对事件进行节流处理', async () => {
      const callback = vi.fn()

      eventBus.on('test-event', callback, { throttle: 50 })

      // 快速发出多个事件
      eventBus.emit('test-event', 1)
      eventBus.emit('test-event', 2)
      eventBus.emit('test-event', 3)

      // 应该只调用第一次
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: 1
        })
      )

      // 等待节流延迟
      await new Promise(resolve => setTimeout(resolve, 60))

      // 再次发出事件
      eventBus.emit('test-event', 4)

      // 现在应该被调用第二次
      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: 4
        })
      )
    })
  })

  describe('once 订阅', () => {
    it('应该只触发一次', () => {
      const callback = vi.fn()

      eventBus.once('test-event', callback)

      eventBus.emit('test-event', 1)
      eventBus.emit('test-event', 2)
      eventBus.emit('test-event', 3)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: 1
        })
      )
    })
  })

  describe('取消订阅', () => {
    it('应该通过返回的函数取消订阅', () => {
      const callback = vi.fn()

      const unsubscribe = eventBus.on('test-event', callback)

      eventBus.emit('test-event', 1)
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()

      eventBus.emit('test-event', 2)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('应该通过 off 方法取消订阅', () => {
      const callback = vi.fn()
      let subscriptionId: string | undefined

      eventBus.on('test-event', (event) => {
        subscriptionId = eventBus.getSubscriptions('test-event')[0]?.id
        callback(event)
      })

      eventBus.emit('test-event', 1)
      expect(callback).toHaveBeenCalledTimes(1)

      if (subscriptionId) {
        eventBus.off(subscriptionId)
      }

      eventBus.emit('test-event', 2)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('应该通过 offAll 取消插件的所有订阅', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      eventBus.setCurrentPluginId('plugin-1')
      eventBus.on('event-1', callback1)
      eventBus.on('event-2', callback2)

      eventBus.setCurrentPluginId('plugin-2')
      eventBus.on('event-1', callback3)

      eventBus.emit('event-1', 'test')
      eventBus.emit('event-2', 'test')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
      expect(callback3).toHaveBeenCalledTimes(1)

      // 取消 plugin-1 的所有订阅
      eventBus.offAll('plugin-1')

      eventBus.emit('event-1', 'test')
      eventBus.emit('event-2', 'test')

      // plugin-1 的回调不应该再被调用
      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
      // plugin-2 的回调应该继续被调用
      expect(callback3).toHaveBeenCalledTimes(2)
    })
  })

  describe('waitFor', () => {
    it('应该等待事件并返回', async () => {
      setTimeout(() => {
        eventBus.emit('test-event', { data: 'test' })
      }, 10)

      const event = await eventBus.waitFor('test-event')

      expect(event.type).toBe('test-event')
      expect(event.payload).toEqual({ data: 'test' })
    })

    it('应该在超时时拒绝', async () => {
      await expect(
        eventBus.waitFor('test-event', 10)
      ).rejects.toThrow('等待事件 test-event 超时')
    })
  })

  describe('getSubscriptions', () => {
    it('应该返回特定事件类型的订阅', () => {
      eventBus.on('event-1', () => {})
      eventBus.on('event-1', () => {})
      eventBus.on('event-2', () => {})

      const subscriptions = eventBus.getSubscriptions('event-1')

      expect(subscriptions).toHaveLength(2)
      expect(subscriptions[0].eventType).toBe('event-1')
      expect(subscriptions[1].eventType).toBe('event-1')
    })

    it('应该返回所有订阅', () => {
      eventBus.on('event-1', () => {})
      eventBus.on('event-2', () => {})
      eventBus.on('event-3', () => {})

      const subscriptions = eventBus.getSubscriptions()

      expect(subscriptions).toHaveLength(3)
    })
  })

  describe('clear', () => {
    it('应该清除所有订阅', () => {
      const callback = vi.fn()

      eventBus.on('event-1', callback)
      eventBus.on('event-2', callback)

      eventBus.clear()

      eventBus.emit('event-1', 'test')
      eventBus.emit('event-2', 'test')

      expect(callback).not.toHaveBeenCalled()
      expect(eventBus.getSubscriptions()).toHaveLength(0)
    })
  })

  describe('优先级排序', () => {
    it('应该按优先级降序执行订阅者', () => {
      const order: number[] = []

      eventBus.on('test-event', () => order.push(1), { priority: 1 })
      eventBus.on('test-event', () => order.push(3), { priority: 3 })
      eventBus.on('test-event', () => order.push(2), { priority: 2 })

      eventBus.emit('test-event', 'test')

      expect(order).toEqual([3, 2, 1])
    })

    it('应该将没有优先级的订阅者视为优先级 0', () => {
      const order: number[] = []

      eventBus.on('test-event', () => order.push(1), { priority: 1 })
      eventBus.on('test-event', () => order.push(0))
      eventBus.on('test-event', () => order.push(-1), { priority: -1 })

      eventBus.emit('test-event', 'test')

      expect(order).toEqual([1, 0, -1])
    })
  })

  describe('错误处理', () => {
    it('应该隔离订阅者错误', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn(() => {
        throw new Error('Test error')
      })
      const callback3 = vi.fn()

      eventBus.on('test-event', callback1)
      eventBus.on('test-event', callback2)
      eventBus.on('test-event', callback3)

      // 不应该抛出错误
      expect(() => {
        eventBus.emit('test-event', 'test')
      }).not.toThrow()

      // 所有回调都应该被调用
      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
      expect(callback3).toHaveBeenCalledTimes(1)
    })

    it('应该处理异步订阅者错误', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn().mockRejectedValue(new Error('Test error'))
      const callback3 = vi.fn()

      eventBus.on('test-event', callback1)
      eventBus.on('test-event', callback2)
      eventBus.on('test-event', callback3)

      // 不应该抛出错误
      await expect(
        eventBus.emitAsync('test-event', 'test')
      ).resolves.toBeUndefined()

      // 所有回调都应该被调用
      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
      expect(callback3).toHaveBeenCalledTimes(1)
    })
  })

  describe('插件 ID 跟踪', () => {
    it('应该跟踪事件源', () => {
      let receivedEvent: any

      eventBus.on('test-event', (event) => {
        receivedEvent = event
      })

      eventBus.setCurrentPluginId('test-plugin')
      eventBus.emit('test-event', 'test')

      expect(receivedEvent.source).toBe('test-plugin')
    })

    it('应该跟踪订阅者的插件 ID', () => {
      eventBus.setCurrentPluginId('plugin-1')
      eventBus.on('test-event', () => {})

      eventBus.setCurrentPluginId('plugin-2')
      eventBus.on('test-event', () => {})

      const subscriptions = eventBus.getSubscriptions('test-event')

      expect(subscriptions[0].pluginId).toBe('plugin-1')
      expect(subscriptions[1].pluginId).toBe('plugin-2')
    })
  })
})
