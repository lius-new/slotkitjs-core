import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PipelineImpl } from '../pipeline'
import { PipelineFactoryImpl } from '../pipeline-factory'
import type { PipelineContext } from '../types'

describe('Pipeline', () => {
  let pipeline: PipelineImpl<any, any>

  beforeEach(() => {
    pipeline = new PipelineImpl()
  })

  describe('处理器链式执行', () => {
    it('应该按顺序执行所有处理器', async () => {
      const executionOrder: number[] = []

      pipeline.use(async (ctx, next) => {
        executionOrder.push(1)
        await next()
        executionOrder.push(4)
      })

      pipeline.use(async (ctx, next) => {
        executionOrder.push(2)
        await next()
        executionOrder.push(3)
      })

      await pipeline.execute({ value: 'test' })

      expect(executionOrder).toEqual([1, 2, 3, 4])
    })

    it('应该在处理器之间传递上下文', async () => {
      pipeline.use(async (ctx, next) => {
        ctx.state.set('step1', 'completed')
        await next()
      })

      pipeline.use(async (ctx, next) => {
        expect(ctx.state.get('step1')).toBe('completed')
        ctx.state.set('step2', 'completed')
        await next()
      })

      pipeline.use(async (ctx) => {
        expect(ctx.state.get('step1')).toBe('completed')
        expect(ctx.state.get('step2')).toBe('completed')
        ctx.output = 'final'
      })

      const result = await pipeline.execute({ value: 'test' })
      expect(result).toBe('final')
    })

    it('应该传递输入和元数据', async () => {
      const input = { value: 'test-input' }
      const metadata = { userId: '123' }

      pipeline.use(async (ctx) => {
        expect(ctx.input).toEqual(input)
        expect(ctx.metadata).toEqual(metadata)
        ctx.output = 'processed'
      })

      const result = await pipeline.execute(input, metadata)
      expect(result).toBe('processed')
    })

    it('应该处理同步处理器', async () => {
      const executionOrder: number[] = []

      pipeline.use((ctx, next) => {
        executionOrder.push(1)
        next()
        executionOrder.push(2)
      })

      await pipeline.execute({ value: 'test' })

      expect(executionOrder).toEqual([1, 2])
    })
  })

  describe('中止机制', () => {
    it('应该在调用 abort 后停止执行', async () => {
      const executionOrder: number[] = []

      pipeline.use(async (ctx, next) => {
        executionOrder.push(1)
        ctx.abort()
        await next()
        executionOrder.push(2)
      })

      pipeline.use(async () => {
        executionOrder.push(3) // 不应该执行
      })

      await pipeline.execute({ value: 'test' })

      expect(executionOrder).toEqual([1, 2])
      expect(executionOrder).not.toContain(3)
    })

    it('应该在中止后仍然执行当前处理器的剩余代码', async () => {
      let afterAbort = false

      pipeline.use(async (ctx, next) => {
        ctx.abort()
        await next()
        afterAbort = true
      })

      await pipeline.execute({ value: 'test' })

      expect(afterAbort).toBe(true)
    })
  })

  describe('优先级排序', () => {
    it('应该按优先级降序执行处理器', async () => {
      const executionOrder: number[] = []

      pipeline.use(
        async (ctx, next) => {
          executionOrder.push(2)
          await next()
        },
        { priority: 10 }
      )

      pipeline.use(
        async (ctx, next) => {
          executionOrder.push(1)
          await next()
        },
        { priority: 20 }
      )

      pipeline.use(
        async (ctx, next) => {
          executionOrder.push(3)
          await next()
        },
        { priority: 5 }
      )

      await pipeline.execute({ value: 'test' })

      expect(executionOrder).toEqual([1, 2, 3])
    })

    it('应该为没有优先级的处理器使用默认优先级 0', async () => {
      const executionOrder: number[] = []

      pipeline.use(
        async (ctx, next) => {
          executionOrder.push(1)
          await next()
        },
        { priority: 10 }
      )

      pipeline.use(async (ctx, next) => {
        executionOrder.push(2)
        await next()
      })

      await pipeline.execute({ value: 'test' })

      expect(executionOrder).toEqual([1, 2])
    })
  })

  describe('处理器管理', () => {
    it('应该移除处理器', async () => {
      const executionOrder: number[] = []

      pipeline.use(
        async (ctx, next) => {
          executionOrder.push(1)
          await next()
        },
        { id: 'handler-1' }
      )

      pipeline.use(
        async (ctx, next) => {
          executionOrder.push(2)
          await next()
        },
        { id: 'handler-2' }
      )

      pipeline.remove('handler-1')

      await pipeline.execute({ value: 'test' })

      expect(executionOrder).toEqual([2])
    })

    it('应该禁用处理器', async () => {
      const executionOrder: number[] = []

      pipeline.use(
        async (ctx, next) => {
          executionOrder.push(1)
          await next()
        },
        { id: 'handler-1' }
      )

      pipeline.use(
        async (ctx, next) => {
          executionOrder.push(2)
          await next()
        },
        { id: 'handler-2' }
      )

      pipeline.disable('handler-1')

      await pipeline.execute({ value: 'test' })

      expect(executionOrder).toEqual([2])
    })

    it('应该重新启用处理器', async () => {
      const executionOrder: number[] = []

      pipeline.use(
        async (ctx, next) => {
          executionOrder.push(1)
          await next()
        },
        { id: 'handler-1' }
      )

      pipeline.disable('handler-1')
      pipeline.enable('handler-1')

      await pipeline.execute({ value: 'test' })

      expect(executionOrder).toEqual([1])
    })

    it('应该清除所有处理器', async () => {
      const executionOrder: number[] = []

      pipeline.use(async (ctx, next) => {
        executionOrder.push(1)
        await next()
      })

      pipeline.use(async (ctx, next) => {
        executionOrder.push(2)
        await next()
      })

      pipeline.clear()

      await pipeline.execute({ value: 'test' })

      expect(executionOrder).toEqual([])
    })

    it('应该返回处理器列表', () => {
      pipeline.use(async () => {}, { id: 'handler-1', priority: 10 })
      pipeline.use(async () => {}, { id: 'handler-2', priority: 5 })

      const handlers = pipeline.getHandlers()

      expect(handlers).toHaveLength(2)
      expect(handlers[0].id).toBe('handler-1')
      expect(handlers[0].priority).toBe(10)
      expect(handlers[1].id).toBe('handler-2')
      expect(handlers[1].priority).toBe(5)
    })

    it('应该为处理器生成自动 ID', () => {
      pipeline.use(async () => {})
      pipeline.use(async () => {})

      const handlers = pipeline.getHandlers()

      expect(handlers[0].id).toMatch(/^handler-\d+$/)
      expect(handlers[1].id).toMatch(/^handler-\d+$/)
      expect(handlers[0].id).not.toBe(handlers[1].id)
    })
  })

  describe('错误处理', () => {
    it('应该传播处理器中的错误', async () => {
      pipeline.use(async () => {
        throw new Error('Handler error')
      })

      await expect(pipeline.execute({ value: 'test' })).rejects.toThrow('Handler error')
    })

    it('应该在错误后停止执行', async () => {
      const executionOrder: number[] = []

      pipeline.use(async (ctx, next) => {
        executionOrder.push(1)
        await next()
      })

      pipeline.use(async () => {
        executionOrder.push(2)
        throw new Error('Handler error')
      })

      pipeline.use(async () => {
        executionOrder.push(3) // 不应该执行
      })

      await expect(pipeline.execute({ value: 'test' })).rejects.toThrow()

      expect(executionOrder).toEqual([1, 2])
      expect(executionOrder).not.toContain(3)
    })
  })
})

describe('PipelineFactory', () => {
  let factory: PipelineFactoryImpl

  beforeEach(() => {
    factory = new PipelineFactoryImpl()
  })

  it('应该创建新管道', () => {
    const pipeline = factory.create('test-pipeline')

    expect(pipeline).toBeDefined()
    expect(pipeline.use).toBeDefined()
    expect(pipeline.execute).toBeDefined()
  })

  it('应该通过名称获取管道', () => {
    const pipeline1 = factory.create('test-pipeline')
    const pipeline2 = factory.get('test-pipeline')

    expect(pipeline2).toBe(pipeline1)
  })

  it('对于不存在的管道应该返回 null', () => {
    const pipeline = factory.get('non-existent')

    expect(pipeline).toBeNull()
  })

  it('应该管理多个管道', () => {
    const pipeline1 = factory.create<string, string>('pipeline-1')
    const pipeline2 = factory.create<number, number>('pipeline-2')

    expect(factory.get('pipeline-1')).toBe(pipeline1)
    expect(factory.get('pipeline-2')).toBe(pipeline2)
  })
})
