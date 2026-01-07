import type { PluginManifest } from '../types/plugin'

/**
 * 依赖图
 */
export interface DependencyGraph {
  /** 节点（插件清单） */
  nodes: Map<string, PluginManifest>
  /** 边（依赖关系） */
  edges: Map<string, Set<string>> // pluginId -> dependencies
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors: Array<{
    type: 'circular-dependency' | 'missing-dependency' | 'version-mismatch'
    pluginId: string
    details: string
  }>
}

/**
 * 依赖信息（扩展）
 */
export interface DependencyInfo {
  id: string
  version?: string
  optional?: boolean
}

/**
 * 依赖管理器接口
 */
export interface DependencyManager {
  // 从清单构建依赖图
  buildGraph(manifests: PluginManifest[]): DependencyGraph
  
  // 验证依赖（检测循环、缺失依赖）
  validate(graph: DependencyGraph): ValidationResult
  
  // 使用拓扑排序解析加载顺序
  resolveLoadOrder(graph: DependencyGraph): string[]
  
  // 检查插件是否可以加载
  canLoad(pluginId: string, loadedPlugins: Set<string>): boolean
  
  // 获取插件的缺失依赖
  getMissingDependencies(pluginId: string): string[]
  
  // 验证版本兼容性
  validateVersions(graph: DependencyGraph): ValidationResult
}
