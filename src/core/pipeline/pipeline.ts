import type { Pipeline, PipelineHandler, PipelineContext, HandlerDescriptor } from './types'

/**
 * 管道实现
 */
export class PipelineImpl<TInput = any, TOutput = any> implements Pipeline<TInput, TOutput> {
  private handlers: HandlerDescriptor[] = []
  private handlerIdCounter = 0

  /**
   * 注册处理器
   */
  use(handler: PipelineHandler<TInput, TOutput>, options?: { priority?: number; id?: string }): void {
    const id = options?.id ?? `handler-${++this.handlerIdCounter}`
    const priority = options?.priority ?? 0

    this.handlers.push({
      id,
      handler,
      priority,
      enabled: true,
    })

    // 按优先级排序（降序）
    this.handlers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }

  /**
   * 执行管道
   */
  async execute(input: TInput, metadata?: Record<string, any>): Promise<TOutput> {
    const context: PipelineContext<TInput, TOutput> = {
      input,
      output: undefined,
      state: new Map<string, any>(),
      metadata: metadata ?? {},
      abort: () => {
        context.state.set('__aborted', true)
      },
    }

    // 获取启用的处理器
    const enabledHandlers = this.handlers.filter(h => h.enabled)

    // 创建处理器链
    let index = 0
    const next = async (): Promise<void> => {
      // 检查是否中止
      if (context.state.get('__aborted')) {
        return
      }

      if (index >= enabledHandlers.length) {
        return
      }

      const handler = enabledHandlers[index++]
      await handler.handler(context, next)
    }

    // 执行管道
    await next()

    return context.output as TOutput
  }

  /**
   * 移除处理器
   */
  remove(id: string): void {
    this.handlers = this.handlers.filter(h => h.id !== id)
  }

  /**
   * 启用处理器
   */
  enable(id: string): void {
    const handler = this.handlers.find(h => h.id === id)
    if (handler) {
      handler.enabled = true
    }
  }

  /**
   * 禁用处理器
   */
  disable(id: string): void {
    const handler = this.handlers.find(h => h.id === id)
    if (handler) {
      handler.enabled = false
    }
  }

  /**
   * 清除所有处理器
   */
  clear(): void {
    this.handlers = []
  }

  /**
   * 获取处理器列表
   */
  getHandlers(): HandlerDescriptor[] {
    return [...this.handlers]
  }
}
