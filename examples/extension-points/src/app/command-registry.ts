import type { ExtensionRegistry } from '@slotkitjs/core'

/**
 * 命令注册表
 * 管理应用中的所有命令
 */
export class CommandRegistry {
  private commands = new Map<string, Function>()
  
  constructor(private extensionRegistry: ExtensionRegistry) {
    this.setupExtensionPoint()
  }
  
  /**
   * 设置命令扩展点
   */
  private setupExtensionPoint() {
    // 定义命令扩展点
    this.extensionRegistry.registerExtensionPoint({
      id: 'commands',
      name: 'Commands',
      description: '应用命令扩展点',
      multiple: true,
      schema: {
        type: 'object',
        required: ['id', 'handler'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          description: { type: 'string' },
          handler: { type: 'function' }
        }
      }
    })
    
    console.log('✅ 命令扩展点已注册')
  }
  
  /**
   * 加载所有命令贡献
   */
  loadCommands() {
    // 获取所有命令贡献
    const contributions = this.extensionRegistry.getContributions('commands')
    
    console.log(`\n📦 加载 ${contributions.length} 个命令:`)
    
    // 注册命令
    contributions.forEach(contrib => {
      if (contrib.enabled !== false) {
        this.commands.set(contrib.value.id, contrib.value.handler)
        console.log(`  ✅ ${contrib.value.id} - ${contrib.value.label}`)
        if (contrib.value.description) {
          console.log(`     ${contrib.value.description}`)
        }
      }
    })
  }
  
  /**
   * 执行命令
   */
  execute(commandId: string, ...args: any[]) {
    const command = this.commands.get(commandId)
    if (command) {
      console.log(`\n⚡ 执行命令: ${commandId}`)
      command(...args)
    } else {
      console.error(`❌ 命令不存在: ${commandId}`)
    }
  }
  
  /**
   * 列出所有命令
   */
  listCommands(): string[] {
    return Array.from(this.commands.keys())
  }
  
  /**
   * 检查命令是否存在
   */
  hasCommand(commandId: string): boolean {
    return this.commands.has(commandId)
  }
}
