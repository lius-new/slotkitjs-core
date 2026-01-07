import type { ExtensionRegistry } from '@slotkitjs/core'

/**
 * 验证器注册表
 * 管理应用中的所有验证器
 */
export class ValidationRegistry {
  private validators = new Map<string, (value: any) => boolean>()
  
  constructor(private extensionRegistry: ExtensionRegistry) {
    this.setupExtensionPoint()
  }
  
  /**
   * 设置验证器扩展点
   */
  private setupExtensionPoint() {
    // 定义验证器扩展点
    this.extensionRegistry.registerExtensionPoint({
      id: 'validators',
      name: 'Validators',
      description: '数据验证器扩展点',
      multiple: true,
      schema: {
        type: 'object',
        required: ['type', 'validate'],
        properties: {
          type: { type: 'string' },
          description: { type: 'string' },
          validate: { type: 'function' }
        }
      }
    })
    
    console.log('✅ 验证器扩展点已注册')
  }
  
  /**
   * 加载所有验证器贡献
   */
  loadValidators() {
    // 获取所有验证器贡献
    const contributions = this.extensionRegistry.getContributions('validators')
    
    console.log(`\n📦 加载 ${contributions.length} 个验证器:`)
    
    // 注册验证器
    contributions.forEach(contrib => {
      if (contrib.enabled !== false) {
        this.validators.set(contrib.value.type, contrib.value.validate)
        console.log(`  ✅ ${contrib.value.type}`)
        if (contrib.value.description) {
          console.log(`     ${contrib.value.description}`)
        }
      }
    })
  }
  
  /**
   * 验证值
   */
  validate(type: string, value: any): boolean {
    const validator = this.validators.get(type)
    if (validator) {
      return validator(value)
    }
    console.warn(`⚠️  验证器不存在: ${type}`)
    return true // 默认通过
  }
  
  /**
   * 列出所有验证器类型
   */
  listValidators(): string[] {
    return Array.from(this.validators.keys())
  }
  
  /**
   * 检查验证器是否存在
   */
  hasValidator(type: string): boolean {
    return this.validators.has(type)
  }
}
