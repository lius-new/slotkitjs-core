import type { ExtensionPoint, Contribution, ExtensionRegistry } from './types'

/**
 * 扩展点注册表实现
 */
export class ExtensionRegistryImpl implements ExtensionRegistry {
  private extensionPoints: Map<string, ExtensionPoint> = new Map()
  private contributions: Map<string, Contribution[]> = new Map()

  /**
   * 注册扩展点
   */
  registerExtensionPoint<T>(point: ExtensionPoint<T>): void {
    if (this.extensionPoints.has(point.id)) {
      throw new Error(`扩展点已存在: ${point.id}`)
    }
    this.extensionPoints.set(point.id, point)
    this.contributions.set(point.id, [])
  }

  /**
   * 贡献到扩展点
   */
  contribute<T>(
    extensionPointId: string,
    contribution: Omit<Contribution<T>, 'extensionPointId'>
  ): void {
    const extensionPoint = this.extensionPoints.get(extensionPointId)
    
    if (!extensionPoint) {
      throw new Error(`扩展点不存在: ${extensionPointId}`)
    }

    // 检查是否允许多个贡献
    const existingContributions = this.contributions.get(extensionPointId) || []
    
    if (!extensionPoint.multiple && existingContributions.length > 0) {
      throw new Error(`扩展点 ${extensionPointId} 不允许多个贡献`)
    }

    // 检查是否已经有来自同一贡献者的贡献
    const existingContribution = existingContributions.find(
      c => c.contributorId === contribution.contributorId
    )
    
    if (existingContribution) {
      throw new Error(
        `贡献者 ${contribution.contributorId} 已经贡献到扩展点 ${extensionPointId}`
      )
    }

    // 验证贡献值（如果提供了 schema）
    if (extensionPoint.schema) {
      // 这里可以集成 JSON Schema 验证库
      // 为了简单起见，我们暂时跳过实际的验证
    }

    const fullContribution: Contribution<T> = {
      extensionPointId,
      contributorId: contribution.contributorId,
      value: contribution.value,
      priority: contribution.priority ?? 0,
      enabled: contribution.enabled ?? true
    }

    existingContributions.push(fullContribution)
    
    // 按优先级排序（降序）
    existingContributions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    
    this.contributions.set(extensionPointId, existingContributions)
  }

  /**
   * 获取扩展点的所有贡献
   */
  getContributions<T>(extensionPointId: string): Contribution<T>[] {
    const contributions = this.contributions.get(extensionPointId) || []
    // 只返回启用的贡献
    return contributions.filter(c => c.enabled) as Contribution<T>[]
  }

  /**
   * 获取特定贡献者的贡献
   */
  getContribution<T>(
    extensionPointId: string,
    contributorId: string
  ): Contribution<T> | null {
    const contributions = this.contributions.get(extensionPointId) || []
    const contribution = contributions.find(c => c.contributorId === contributorId)
    return contribution ? (contribution as Contribution<T>) : null
  }

  /**
   * 检查扩展点是否存在
   */
  hasExtensionPoint(id: string): boolean {
    return this.extensionPoints.has(id)
  }

  /**
   * 获取所有扩展点
   */
  getExtensionPoints(): ExtensionPoint[] {
    return Array.from(this.extensionPoints.values())
  }

  /**
   * 移除特定贡献
   */
  removeContribution(extensionPointId: string, contributorId: string): void {
    const contributions = this.contributions.get(extensionPointId)
    
    if (!contributions) {
      return
    }

    const filtered = contributions.filter(c => c.contributorId !== contributorId)
    this.contributions.set(extensionPointId, filtered)
  }

  /**
   * 移除贡献者的所有贡献
   */
  removeAllContributions(contributorId: string): void {
    for (const [extensionPointId, contributions] of this.contributions.entries()) {
      const filtered = contributions.filter(c => c.contributorId !== contributorId)
      this.contributions.set(extensionPointId, filtered)
    }
  }
}

// 创建全局扩展点注册表实例
export const extensionRegistry = new ExtensionRegistryImpl()