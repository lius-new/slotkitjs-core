/**
 * 事件通信示例 - 主入口
 * 
 * 本示例展示：
 * 1. 如何定义类型安全的事件
 * 2. 如何发出事件
 * 3. 如何订阅事件
 * 4. 如何使用订阅选项（优先级、防抖、过滤等）
 */

console.log('='.repeat(60))
console.log('🚀 SlotKit 事件通信示例')
console.log('='.repeat(60))
console.log()

console.log('📝 示例说明:')
console.log('  - user-plugin: 发出用户相关事件')
console.log('  - logger-plugin: 记录所有事件')
console.log('  - notification-plugin: 显示通知（带优先级和过滤）')
console.log()

console.log('🔑 关键概念:')
console.log('  1. 事件定义 - 类型安全的事件负载')
console.log('  2. 事件发出 - context.events.emit()')
console.log('  3. 事件订阅 - context.events.on()')
console.log('  4. 订阅选项 - priority, debounce, filter')
console.log()

console.log('💡 优势:')
console.log('  ✅ 插件完全解耦')
console.log('  ✅ 类型安全')
console.log('  ✅ 灵活的订阅控制')
console.log('  ✅ 自动清理')
console.log()

console.log('📚 观察下面的事件流:')
console.log('='.repeat(60))
console.log()

// 注意：这是一个概念示例
// 实际使用时，您需要创建 PluginSystem 实例并加载插件
