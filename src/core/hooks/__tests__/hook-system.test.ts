import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HookSystemImpl } from '../hook-system'
import { HookType } from '../types'

describe('HookSystem', () => {
  let hookSystem: HookSystemImpl

  beforeEach(() => {
    hookSystem = new HookSystemImpl()
  })

  describe('Action Hooks', () => {
    it('应该注册和执行 action 钩子', async () => {
      let executed = false

      hookSystem.addAction('test:action', async () => {
        executed = true
      })

      await hookSystem.doAction('test:action')

      expect(executed).toBe(true)
    })

    it('应该向 action 钩子传递参数', async () => {
      let receivedArgs: any[] = []

      hookSystem.addAction('test:action', async (...args) => {
        receivedArgs = args
      })

      await hookSystem.doAction('test:action', 'arg1', 42, { key: 'value' })

      expect(receivedArgs).toEqual(['arg1', 42, { key: 'value' }])
    })

    it('应该按优先级顺序执行 action 钩子', async () => {
      const executionOrder: number[] = []

      hookSystem.addAction('test:priority', async () => {
        executionOrder.push(1)
      }, 5)

      hookSystem.addAction('test:priority', async () => {
        executionOrder.push(2)
      }, 20)

      hookSystem.addAction('test:priority', async () => {
        executionOrder.push(3)
      }, 10)

      await hookSystem.doAction('test:priority')

      // 应该按优先级降序执行：20, 10, 5
      expect(executionOrder).toEqual([2, 3, 1])
    })

    it('应该执行多个 action 钩子', async () => {
      const calls: string[] = []

      hookSystem.addAction('test:multiple', async () => {
        calls.push('first')
      })

      hookSystem.addAction('test:multiple', async () => {
        calls.push('second')
      })

      hookSystem.addAction('test:multiple', async () => {
        calls.push('third')
      })

      await hookSystem.doAction('test:multiple')

      expect(calls).toHaveLength(3)
      expect(calls).toContain('first')
      expect(calls).toContain('second')
      expect(calls).toContain('third')
    })

    it('应该隔离 action 钩子中的错误', async () => {
      const calls: string[] = []

      hookSystem.addAction('test:error', async () => {
        calls.push('first')
      })

      hookSystem.addAction('test:error', async () => {
        calls.push('second')
        throw new Error('Test error')
      })

      hookSystem.addAction('test:error', async () => {
        calls.push('third')
      })

      // 不应该抛出错误
      await expect(hookSystem.doAction('test:error')).resolves.toBeUndefined()

      // 所有钩子都应该被执行
      expect(calls).toEqual(['first', 'second', 'third'])
    })

    it('对于不存在的 action 钩子应该不执行任何操作', async () => {
      // 不应该抛出错误
      await expect(hookSystem.doAction('non:existent')).resolves.toBeUndefined()
    })
  })

  describe('Filter Hooks', () => {
    it('应该注册和应用 filter 钩子', async () => {
      hookSystem.addFilter('test:filter', async (value: number) => {
        return value * 2
      })

      const result = await hookSystem.applyFilters('test:filter', 5)

      expect(result).toBe(10)
    })

    it('应该链式应用多个 filter 钩子', async () => {
      hookSystem.addFilter('test:chain', async (value: number) => {
        return value + 1
      })

      hookSystem.addFilter('test:chain', async (value: number) => {
        return value * 2
      })

      hookSystem.addFilter('test:chain', async (value: number) => {
        return value - 3
      })

      const result = await hookSystem.applyFilters('test:chain', 5)

      // (5 + 1) * 2 - 3 = 9
      expect(result).toBe(9)
    })

    it('应该按优先级顺序应用 filter 钩子', async () => {
      hookSystem.addFilter('test:priority', async (value: string) => {
        return value + 'A'
      }, 5)

      hookSystem.addFilter('test:priority', async (value: string) => {
        return value + 'B'
      }, 20)

      hookSystem.addFilter('test:priority', async (value: string) => {
        return value + 'C'
      }, 10)

      const result = await hookSystem.applyFilters('test:priority', 'Start-')

      // 应该按优先级降序应用：20, 10, 5
      expect(result).toBe('Start-BCA')
    })

    it('应该向 filter 钩子传递额外参数', async () => {
      let receivedArgs: any[] = []

      hookSystem.addFilter('test:args', async (value: number, ...args) => {
        receivedArgs = args
        return value
      })

      await hookSystem.applyFilters('test:args', 10, 'extra1', 'extra2')

      expect(receivedArgs).toEqual(['extra1', 'extra2'])
    })

    it('应该在 filter 钩子错误时保留当前值', async () => {
      hookSystem.addFilter('test:error', async (value: number) => {
        return value + 1
      })

      hookSystem.addFilter('test:error', async (value: number) => {
        throw new Error('Test error')
      })

      hookSystem.addFilter('test:error', async (value: number) => {
        return value + 2
      })

      const result = await hookSystem.applyFilters('test:error', 5)

      // 第一个钩子：5 + 1 = 6
      // 第二个钩子：错误，保留 6
      // 第三个钩子：6 + 2 = 8
      expect(result).toBe(8)
    })

    it('对于不存在的 filter 钩子应该返回原始值', async () => {
      const result = await hookSystem.applyFilters('non:existent', 42)

      expect(result).toBe(42)
    })
  })

  describe('Hook Removal', () => {
    it('应该通过返回的函数移除钩子', async () => {
      let callCount = 0

      const unsubscribe = hookSystem.addAction('test:remove', async () => {
        callCount++
      })

      await hookSystem.doAction('test:remove')
      expect(callCount).toBe(1)

      unsubscribe()

      await hookSystem.doAction('test:remove')
      expect(callCount).toBe(1) // 不应该再次调用
    })

    it('应该通过 removeHook 移除特定钩子', async () => {
      const calls: string[] = []

      hookSystem.addAction('test:remove', async () => {
        calls.push('hook1')
      })

      hookSystem.addAction('test:remove', async () => {
        calls.push('hook2')
      })

      const hooks = hookSystem.getHooks('test:remove')
      const hookToRemove = hooks[0]

      hookSystem.removeHook('test:remove', hookToRemove.id)

      await hookSystem.doAction('test:remove')

      expect(calls).toHaveLength(1)
      expect(calls).toContain('hook2')
    })

    it('应该通过 removeAllHooks 移除所有钩子', async () => {
      let callCount = 0

      hookSystem.addAction('test:removeAll', async () => {
        callCount++
      })

      hookSystem.addAction('test:removeAll', async () => {
        callCount++
      })

      hookSystem.addAction('test:removeAll', async () => {
        callCount++
      })

      await hookSystem.doAction('test:removeAll')
      expect(callCount).toBe(3)

      hookSystem.removeAllHooks('test:removeAll')

      await hookSystem.doAction('test:removeAll')
      expect(callCount).toBe(3) // 不应该再次调用
    })

    it('移除不存在的钩子应该不抛出错误', () => {
      expect(() => {
        hookSystem.removeHook('non:existent', 'fake-id')
      }).not.toThrow()
    })
  })

  describe('Hook Inspection', () => {
    it('hasHook 应该检测已注册的钩子', () => {
      expect(hookSystem.hasHook('test:check')).toBe(false)

      hookSystem.addAction('test:check', async () => {})

      expect(hookSystem.hasHook('test:check')).toBe(true)
    })

    it('hasHook 在移除所有钩子后应该返回 false', () => {
      hookSystem.addAction('test:check', async () => {})
      expect(hookSystem.hasHook('test:check')).toBe(true)

      hookSystem.removeAllHooks('test:check')
      expect(hookSystem.hasHook('test:check')).toBe(false)
    })

    it('getHooks 应该返回按优先级排序的钩子', () => {
      hookSystem.addAction('test:get', async () => {}, 5)
      hookSystem.addAction('test:get', async () => {}, 20)
      hookSystem.addAction('test:get', async () => {}, 10)

      const hooks = hookSystem.getHooks('test:get')

      expect(hooks).toHaveLength(3)
      expect(hooks[0].priority).toBe(20)
      expect(hooks[1].priority).toBe(10)
      expect(hooks[2].priority).toBe(5)
    })

    it('getHooks 应该返回空数组对于不存在的钩子', () => {
      const hooks = hookSystem.getHooks('non:existent')

      expect(hooks).toEqual([])
    })

    it('getHooks 应该包含钩子元数据', () => {
      hookSystem.addAction('test:metadata', async () => {}, 15)

      const hooks = hookSystem.getHooks('test:metadata')

      expect(hooks[0]).toMatchObject({
        name: 'test:metadata',
        type: HookType.Action,
        priority: 15
      })
      expect(hooks[0].id).toBeDefined()
      expect(hooks[0].callback).toBeDefined()
    })
  })

  describe('Default Priority', () => {
    it('应该使用默认优先级 10', () => {
      hookSystem.addAction('test:default', async () => {})

      const hooks = hookSystem.getHooks('test:default')

      expect(hooks[0].priority).toBe(10)
    })

    it('应该正确排序默认优先级和自定义优先级', () => {
      const executionOrder: number[] = []

      hookSystem.addAction('test:mixed', async () => {
        executionOrder.push(1)
      }, 5)

      hookSystem.addAction('test:mixed', async () => {
        executionOrder.push(2)
      }) // 默认 10

      hookSystem.addAction('test:mixed', async () => {
        executionOrder.push(3)
      }, 15)

      hookSystem.doAction('test:mixed')

      const hooks = hookSystem.getHooks('test:mixed')
      expect(hooks[0].priority).toBe(15)
      expect(hooks[1].priority).toBe(10)
      expect(hooks[2].priority).toBe(5)
    })
  })
})
