/**
 * 简单的 Semver 版本验证器
 */
export class VersionValidator {
  /**
   * 解析版本字符串
   */
  private static parseVersion(version: string): { major: number; minor: number; patch: number } | null {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
    if (!match) {
      return null
    }
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10)
    }
  }

  /**
   * 比较两个版本
   * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  static compareVersions(v1: string, v2: string): number {
    const parsed1 = this.parseVersion(v1)
    const parsed2 = this.parseVersion(v2)

    if (!parsed1 || !parsed2) {
      return 0
    }

    if (parsed1.major !== parsed2.major) {
      return parsed1.major > parsed2.major ? 1 : -1
    }
    if (parsed1.minor !== parsed2.minor) {
      return parsed1.minor > parsed2.minor ? 1 : -1
    }
    if (parsed1.patch !== parsed2.patch) {
      return parsed1.patch > parsed2.patch ? 1 : -1
    }
    return 0
  }

  /**
   * 检查版本是否满足约束
   * 支持的约束格式:
   * - "1.0.0" - 精确匹配
   * - "^1.0.0" - 兼容版本 (>=1.0.0 <2.0.0)
   * - "~1.0.0" - 近似版本 (>=1.0.0 <1.1.0)
   * - ">=1.0.0" - 大于等于
   * - ">1.0.0" - 大于
   * - "<=1.0.0" - 小于等于
   * - "<1.0.0" - 小于
   */
  static satisfies(version: string, constraint: string): boolean {
    // 精确匹配
    if (!constraint.match(/^[~^<>=]/)) {
      return version === constraint
    }

    // 兼容版本 (^)
    if (constraint.startsWith('^')) {
      const targetVersion = constraint.slice(1)
      const target = this.parseVersion(targetVersion)
      const current = this.parseVersion(version)
      
      if (!target || !current) {
        return false
      }

      // 主版本必须相同，次版本和补丁版本可以更高
      return current.major === target.major &&
             (current.minor > target.minor || 
              (current.minor === target.minor && current.patch >= target.patch))
    }

    // 近似版本 (~)
    if (constraint.startsWith('~')) {
      const targetVersion = constraint.slice(1)
      const target = this.parseVersion(targetVersion)
      const current = this.parseVersion(version)
      
      if (!target || !current) {
        return false
      }

      // 主版本和次版本必须相同，补丁版本可以更高
      return current.major === target.major &&
             current.minor === target.minor &&
             current.patch >= target.patch
    }

    // 大于等于 (>=)
    if (constraint.startsWith('>=')) {
      const targetVersion = constraint.slice(2)
      return this.compareVersions(version, targetVersion) >= 0
    }

    // 大于 (>)
    if (constraint.startsWith('>')) {
      const targetVersion = constraint.slice(1)
      return this.compareVersions(version, targetVersion) > 0
    }

    // 小于等于 (<=)
    if (constraint.startsWith('<=')) {
      const targetVersion = constraint.slice(2)
      return this.compareVersions(version, targetVersion) <= 0
    }

    // 小于 (<)
    if (constraint.startsWith('<')) {
      const targetVersion = constraint.slice(1)
      return this.compareVersions(version, targetVersion) < 0
    }

    return false
  }

  /**
   * 验证版本字符串是否有效
   */
  static isValidVersion(version: string): boolean {
    return this.parseVersion(version) !== null
  }
}
