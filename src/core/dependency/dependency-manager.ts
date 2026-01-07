import type { PluginManifest } from '../types/plugin'
import type { DependencyGraph, ValidationResult, DependencyManager as IDependencyManager } from './types'

/**
 * 依赖管理器实现
 */
export class DependencyManager implements IDependencyManager {
  private graph: DependencyGraph | null = null

  /**
   * 从清单构建依赖图
   */
  buildGraph(manifests: PluginManifest[]): DependencyGraph {
    const nodes = new Map<string, PluginManifest>()
    const edges = new Map<string, Set<string>>()

    // 构建节点
    for (const manifest of manifests) {
      nodes.set(manifest.id, manifest)
    }

    // 构建边（依赖关系）
    for (const manifest of manifests) {
      const deps = new Set<string>()
      
      // 处理依赖数组
      if (manifest.dependencies && Array.isArray(manifest.dependencies)) {
        for (const dep of manifest.dependencies) {
          deps.add(dep)
        }
      }
      
      edges.set(manifest.id, deps)
    }

    this.graph = { nodes, edges }
    return this.graph
  }

  /**
   * 验证依赖图
   */
  validate(graph: DependencyGraph): ValidationResult {
    const errors: ValidationResult['errors'] = []

    // 检测缺失依赖
    for (const [pluginId, deps] of graph.edges) {
      for (const dep of deps) {
        if (!graph.nodes.has(dep)) {
          errors.push({
            type: 'missing-dependency',
            pluginId,
            details: `Plugin "${pluginId}" depends on "${dep}" which is not available`
          })
        }
      }
    }

    // 检测循环依赖
    const cycles = this.detectCycles(graph)
    for (const cycle of cycles) {
      const cycleStr = cycle.join(' -> ')
      errors.push({
        type: 'circular-dependency',
        pluginId: cycle[0],
        details: `Circular dependency detected: ${cycleStr} -> ${cycle[0]}`
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 检测循环依赖
   */
  private detectCycles(graph: DependencyGraph): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const path: string[] = []

    const dfs = (node: string): boolean => {
      visited.add(node)
      recursionStack.add(node)
      path.push(node)

      const deps = graph.edges.get(node) || new Set()
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (dfs(dep)) {
            return true
          }
        } else if (recursionStack.has(dep)) {
          // 找到循环
          const cycleStart = path.indexOf(dep)
          const cycle = path.slice(cycleStart)
          cycles.push(cycle)
          return true
        }
      }

      path.pop()
      recursionStack.delete(node)
      return false
    }

    for (const node of graph.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node)
      }
    }

    return cycles
  }

  /**
   * 使用拓扑排序解析加载顺序
   */
  resolveLoadOrder(graph: DependencyGraph): string[] {
    const result: string[] = []
    const visited = new Set<string>()
    const temp = new Set<string>()

    const visit = (node: string): void => {
      if (temp.has(node)) {
        // 循环依赖，跳过
        return
      }
      if (visited.has(node)) {
        return
      }

      temp.add(node)

      const deps = graph.edges.get(node) || new Set()
      for (const dep of deps) {
        if (graph.nodes.has(dep)) {
          visit(dep)
        }
      }

      temp.delete(node)
      visited.add(node)
      result.push(node)
    }

    for (const node of graph.nodes.keys()) {
      if (!visited.has(node)) {
        visit(node)
      }
    }

    return result
  }

  /**
   * 检查插件是否可以加载
   */
  canLoad(pluginId: string, loadedPlugins: Set<string>): boolean {
    if (!this.graph) {
      return false
    }

    const deps = this.graph.edges.get(pluginId)
    if (!deps) {
      return true
    }

    // 检查所有依赖是否已加载
    for (const dep of deps) {
      if (!loadedPlugins.has(dep)) {
        return false
      }
    }

    return true
  }

  /**
   * 获取插件的缺失依赖
   */
  getMissingDependencies(pluginId: string): string[] {
    if (!this.graph) {
      return []
    }

    const deps = this.graph.edges.get(pluginId)
    if (!deps) {
      return []
    }

    const missing: string[] = []
    for (const dep of deps) {
      if (!this.graph.nodes.has(dep)) {
        missing.push(dep)
      }
    }

    return missing
  }

  /**
   * 验证版本兼容性
   * 注意：当前 PluginManifest 使用简单的 string[] 依赖
   * 此方法为未来扩展预留，当 manifest 支持版本约束时使用
   */
  validateVersions(_graph: DependencyGraph): ValidationResult {
    const errors: ValidationResult['errors'] = []

    // 当前实现：由于 PluginManifest.dependencies 是 string[]
    // 我们无法验证版本约束
    // 此方法为未来扩展预留
    
    // 未来当 manifest 支持如下结构时：
    // dependencies: Array<{ id: string, version?: string }>
    // 可以在这里添加版本验证逻辑

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
