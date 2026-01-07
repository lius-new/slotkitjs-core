import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { EventBusImpl } from '../event-bus'
import type { EventDefinition } from '../types'

describe('EventBus Property Tests', () => {
  let eventBus: EventBusImpl

  beforeEach(() => {
    eventBus = new EventBusImpl()
  })

  // Feature: plugin-decoupling, Property 5: 事件传递给所有订阅者
  // 对于任何事件类型和订阅者集合，当插件发出该类型的事件时，则所有订阅的插件都应该接收到具有正确负载的事件。
  it('属性 5: 任何事件都应该传递给所有订阅者', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // eventType
        fc.anything(), // payload
        fc.integer({ min: 1, max: 10 }), // number of subscribers
        (eventType, payload, numSubscribers) => {
          const eventBus = new EventBusImpl()
          const receivedEvents: Array<{ subscriberId: number; event: EventDefinition }> = []

          // 创建多个订阅者
          for (let i = 0; i < numSubscribers; i++) {
            eventBus.setCurrentPluginId(`plugin-${i}`)
            eventBus.on(eventType, (event) => {
              receivedEvents.push({ subscriberId: i, event })
            })
          }

          // 发出事件
          eventBus.setCurrentPluginId('emitter-plugin')
          eventBus.emit(eventType, payload)

          // 验证所有订阅者都收到了事件
          expect(receivedEvents).toHaveLength(numSubscribers)
          
          // 验证每个订阅者收到的事件负载正确
          for (const { event } of receivedEvents) {
            expect(event.type).toBe(eventType)
            expect(event.payload).toEqual(payload)
            expect(event.source).toBe('emitter-plugin')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: plugin-decoupling, Property 7: 事件处理程序错误隔离
  // 对于任何一个订阅者抛出错误的事件订阅者集合，当发出事件时，则错误应该被隔离，所有其他订阅者仍应接收事件。
  it('属性 7: 一个订阅者的错误不应该影响其他订阅者', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // eventType
        fc.anything(), // payload
        fc.integer({ min: 2, max: 10 }), // number of subscribers (at least 2)
        fc.integer({ min: 0, max: 9 }), // index of failing subscriber
        (eventType, payload, numSubscribers, failingIndex) => {
          // 确保 failingIndex 在有效范围内
          const actualFailingIndex = failingIndex % numSubscribers
          
          const eventBus = new EventBusImpl()
          const receivedEvents: number[] = []

          // 创建多个订阅者
          for (let i = 0; i < numSubscribers; i++) {
            eventBus.setCurrentPluginId(`plugin-${i}`)
            eventBus.on(eventType, () => {
              if (i === actualFailingIndex) {
                throw new Error('Subscriber error')
              }
              receivedEvents.push(i)
            })
          }

          // 发出事件
          eventBus.setCurrentPluginId('emitter-plugin')
          eventBus.emit(eventType, payload)

          // 验证除了失败的订阅者外，所有其他订阅者都收到了事件
          expect(receivedEvents).toHaveLength(numSubscribers - 1)
          
          // 验证失败的订阅者没有被记录
          expect(receivedEvents).not.toContain(actualFailingIndex)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: plugin-decoupling, Property 8: 基于优先级的事件传递
  // 对于任何具有不同优先级的事件订阅者集合，当发出事件时，则订阅者应该按降序优先级顺序接收事件（最高优先级优先）。
  it('属性 8: 订阅者应该按优先级降序接收事件', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // eventType
        fc.anything(), // payload
        fc.array(fc.integer({ min: -100, max: 100 }), { minLength: 2, maxLength: 10 }), // priorities
        (eventType, payload, priorities) => {
          const eventBus = new EventBusImpl()
          const receivedOrder: number[] = []

          // 创建具有不同优先级的订阅者
          priorities.forEach((priority, index) => {
            eventBus.setCurrentPluginId(`plugin-${index}`)
            eventBus.on(
              eventType,
              () => {
                receivedOrder.push(priority)
              },
              { priority }
            )
          })

          // 发出事件
          eventBus.setCurrentPluginId('emitter-plugin')
          eventBus.emit(eventType, payload)

          // 验证接收顺序是按优先级降序排列的
          const expectedOrder = [...priorities].sort((a, b) => b - a)
          expect(receivedOrder).toEqual(expectedOrder)
        }
      ),
      { numRuns: 100 }
    )
  })

  // 额外的属性测试：once 订阅应该只触发一次
  it('属性: once 订阅应该只触发一次', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // eventType
        fc.anything(), // payload
        fc.integer({ min: 2, max: 5 }), // number of emits
        (eventType, payload, numEmits) => {
          const eventBus = new EventBusImpl()
          let callCount = 0

          eventBus.once(eventType, () => {
            callCount++
          })

          // 多次发出事件
          for (let i = 0; i < numEmits; i++) {
            eventBus.emit(eventType, payload)
          }

          // 验证回调只被调用一次
          expect(callCount).toBe(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  // 额外的属性测试：过滤器应该正确过滤事件
  it('属性: 过滤器应该正确过滤事件', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // eventType
        fc.array(fc.integer(), { minLength: 1, maxLength: 20 }), // payloads
        fc.integer(), // threshold
        (eventType, payloads, threshold) => {
          const eventBus = new EventBusImpl()
          const receivedPayloads: number[] = []

          // 订阅时使用过滤器
          eventBus.on(
            eventType,
            (event) => {
              receivedPayloads.push(event.payload)
            },
            {
              filter: (event) => event.payload > threshold
            }
          )

          // 发出多个事件
          payloads.forEach(payload => {
            eventBus.emit(eventType, payload)
          })

          // 验证只有满足过滤条件的事件被接收
          const expectedPayloads = payloads.filter(p => p > threshold)
          expect(receivedPayloads).toEqual(expectedPayloads)
        }
      ),
      { numRuns: 100 }
    )
  })

  // 额外的属性测试：offAll 应该移除插件的所有订阅
  it('属性: offAll 应该移除插件的所有订阅', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }), // eventTypes
        fc.string({ minLength: 1 }), // pluginId
        fc.anything(), // payload
        (eventTypes, pluginId, payload) => {
          const eventBus = new EventBusImpl()
          let callCount = 0

          // 为同一个插件订阅多个事件类型
          eventBus.setCurrentPluginId(pluginId)
          eventTypes.forEach(eventType => {
            eventBus.on(eventType, () => {
              callCount++
            })
          })

          // 移除该插件的所有订阅
          eventBus.offAll(pluginId)

          // 发出所有事件
          eventTypes.forEach(eventType => {
            eventBus.emit(eventType, payload)
          })

          // 验证没有回调被调用
          expect(callCount).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
