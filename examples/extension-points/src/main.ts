/**
 * 扩展点使用示例 - 主入口
 * 
 * 本示例展示：
 * 1. 如何定义扩展点
 * 2. 如何贡献到扩展点
 * 3. 如何获取和使用贡献
 */

console.log('='.repeat(60))
console.log('🚀 SlotKit 扩展点使用示例')
console.log('='.repeat(60))
console.log()

console.log('📝 示例说明:')
console.log('  - 应用层定义扩展点（commands, validators）')
console.log('  - command-plugin: 贡献命令')
console.log('  - validation-plugin: 贡献验证器')
console.log()

console.log('🔑 关键概念:')
console.log('  1. 扩展点定义 - registerExtensionPoint()')
console.log('  2. 贡献到扩展点 - contribute()')
console.log('  3. 获取贡献 - getContributions()')
console.log('  4. 使用贡献 - 应用层处理')
console.log()

console.log('💡 优势:')
console.log('  ✅ 高度可扩展')
console.log('  ✅ 类型安全（通过 schema）')
console.log('  ✅ 解耦设计')
console.log('  ✅ 灵活配置')
console.log()

console.log('📚 模拟运行流程:')
console.log('='.repeat(60))
console.log()

// 模拟扩展点系统
console.log('1️⃣  应用层注册扩展点...')
console.log('   ✅ 命令扩展点已注册')
console.log('   ✅ 验证器扩展点已注册')
console.log()

console.log('2️⃣  插件贡献到扩展点...')
console.log('   ⚡ 命令插件贡献 3 个命令')
console.log('   ✓ 验证插件贡献 4 个验证器')
console.log()

console.log('3️⃣  应用层加载贡献...')
console.log('   📦 加载命令: hello, goodbye, info')
console.log('   📦 加载验证器: email, url, phone, required')
console.log()

console.log('4️⃣  使用贡献...')
console.log('   ⚡ 执行命令: hello')
console.log('      👋 Hello, World!')
console.log()
console.log('   ✓ 验证 email: test@example.com')
console.log('      ✅ 有效')
console.log()

console.log('='.repeat(60))
console.log('✅ 示例完成！查看代码了解实现细节。')
console.log('='.repeat(60))
