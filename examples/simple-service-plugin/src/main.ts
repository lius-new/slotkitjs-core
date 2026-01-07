/**
 * 简单服务插件示例 - 主入口
 * 
 * 本示例展示：
 * 1. 如何创建提供服务的插件
 * 2. 如何在其他插件中使用服务
 * 3. 如何通过服务容器实现插件解耦
 */

console.log('='.repeat(60))
console.log('🚀 SlotKit 简单服务插件示例')
console.log('='.repeat(60))
console.log()

// 注意：这是一个概念示例
// 实际使用时，您需要：
// 1. 安装 @slotkitjs/core 和 @slotkitjs/types
// 2. 创建 PluginSystem 实例
// 3. 加载插件

console.log('📝 示例说明:')
console.log('  - auth-plugin: 提供认证服务')
console.log('  - dashboard-plugin: 使用认证服务')
console.log()

console.log('🔑 关键概念:')
console.log('  1. 服务契约 (IAuthService) - 定义接口')
console.log('  2. 服务实现 (AuthService) - 实现接口')
console.log('  3. 服务注册 - 在 auth-plugin 中注册')
console.log('  4. 服务使用 - 在 dashboard-plugin 中使用')
console.log()

console.log('💡 优势:')
console.log('  ✅ 插件之间松耦合')
console.log('  ✅ 只依赖接口，不依赖实现')
console.log('  ✅ 易于测试和替换实现')
console.log('  ✅ 支持依赖注入')
console.log()

console.log('📚 查看代码了解更多细节!')
console.log('='.repeat(60))
