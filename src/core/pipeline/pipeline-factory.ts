import type { Pipeline, PipelineFactory } from './types'
import { PipelineImpl } from './pipeline'

/**
 * 管道工厂实现
 */
export class PipelineFactoryImpl implements PipelineFactory {
  private pipelines = new Map<string, Pipeline<any, any>>()

  /**
   * 创建新管道
   */
  create<TInput, TOutput>(name: string): Pipeline<TInput, TOutput> {
    const pipeline = new PipelineImpl<TInput, TOutput>()
    this.pipelines.set(name, pipeline)
    return pipeline
  }

  /**
   * 获取已存在的管道
   */
  get<TInput, TOutput>(name: string): Pipeline<TInput, TOutput> | null {
    return (this.pipelines.get(name) as Pipeline<TInput, TOutput>) ?? null
  }
}
