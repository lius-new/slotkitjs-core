/**
 * 管道上下文（通用）
 */
export interface PipelineContext<TInput = any, TOutput = any> {
  /** 输入 */
  input: TInput
  /** 输出 */
  output?: TOutput
  /** 处理器间共享状态 */
  state: Map<string, any>
  /** 元数据 */
  metadata: Record<string, any>
  /** 中止管道执行 */
  abort: () => void
}

/**
 * 管道处理器
 */
export type PipelineHandler<TInput = any, TOutput = any> = (
  context: PipelineContext<TInput, TOutput>,
  next: () => Promise<void>
) => Promise<void> | void

/**
 * 处理器描述符
 */
export interface HandlerDescriptor {
  /** 处理器 ID */
  id: string
  /** 处理器函数 */
  handler: PipelineHandler
  /** 优先级 */
  priority?: number
  /** 是否启用 */
  enabled?: boolean
  /** 提供者（插件 ID） */
  providedBy?: string
}

/**
 * 管道接口
 */
export interface Pipeline<TInput = any, TOutput = any> {
  // 注册处理器
  use(handler: PipelineHandler<TInput, TOutput>, options?: { priority?: number; id?: string }): void
  
  // 执行管道
  execute(input: TInput, metadata?: Record<string, any>): Promise<TOutput>
  
  // 管理处理器
  remove(id: string): void
  enable(id: string): void
  disable(id: string): void
  clear(): void
  
  // 获取处理器列表
  getHandlers(): HandlerDescriptor[]
}

/**
 * 管道工厂
 */
export interface PipelineFactory {
  create<TInput, TOutput>(name: string): Pipeline<TInput, TOutput>
  get<TInput, TOutput>(name: string): Pipeline<TInput, TOutput> | null
}
