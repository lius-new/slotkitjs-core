import type { IAuthService } from '../../types/contracts'

/**
 * 认证服务实现
 * 这是一个简单的示例实现，实际应用中应该连接到真实的认证系统
 */
export class AuthService implements IAuthService {
  private user: { username: string } | null = null
  
  async login(username: string, password: string): Promise<boolean> {
    // 简单的模拟登录逻辑
    // 实际应用中应该调用后端 API
    if (password === 'password') {
      this.user = { username }
      console.log(`✅ 用户 ${username} 登录成功`)
      return true
    }
    
    console.log(`❌ 用户 ${username} 登录失败`)
    return false
  }
  
  async logout(): Promise<void> {
    const username = this.user?.username
    this.user = null
    console.log(`👋 用户 ${username} 已登出`)
  }
  
  isAuthenticated(): boolean {
    return this.user !== null
  }
  
  getUser(): { username: string } | null {
    return this.user
  }
}
